import logging
import sqlite3
import json
import datetime
import uuid

from dotenv import load_dotenv
from livekit import rtc
from livekit.agents import (
    Agent,
    AgentServer,
    AgentSession,
    JobContext,
    JobProcess,
    cli,
    tokenize,
    room_io,
    function_tool,
    RunContext,
    inference
)
from livekit.plugins import murf, silero, deepgram, noise_cancellation
from livekit.plugins.turn_detector.multilingual import MultilingualModel

logger = logging.getLogger("agent")

load_dotenv(".env.local")

# --- SQLITE DATABASE SETUP ---
def init_db():
    conn = sqlite3.connect('home_fresh.db')
    c = conn.cursor()
    # Day 4: Customer Profile Table
    c.execute('''
        CREATE TABLE IF NOT EXISTS customers (
            user_id TEXT PRIMARY KEY,
            name TEXT,
            past_orders TEXT,
            preferred_delivery_slot TEXT,
            last_interaction TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    # Day 7: Human Escalation Table
    c.execute('''
        CREATE TABLE IF NOT EXISTS escalations (
            escalation_id TEXT PRIMARY KEY,
            user_id TEXT,
            summary TEXT,
            urgency TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    # Day 8: Call Analytics Table
    c.execute('''
        CREATE TABLE IF NOT EXISTS call_logs (
            call_id TEXT PRIMARY KEY,
            status TEXT,
            reason TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

init_db()

# --- DAY 5: MOCK INVENTORY DATABASE ---
INVENTORY_DB = {
    "rice": {"price_per_kg": 55, "stock": "In Stock"},
    "chal": {"price_per_kg": 55, "stock": "In Stock"},
    "milk": {"price_per_liter": 66, "stock": "Low Stock (Only 2 liters left)"},
    "dudh": {"price_per_liter": 66, "stock": "Low Stock (Only 2 liters left)"},
    "egg": {"price_per_dozen": 80, "stock": "Out of Stock"},
    "dim": {"price_per_dozen": 80, "stock": "Out of Stock"},
    "mustard oil": {"price_per_liter": 160, "stock": "In Stock"},
}

SYSTEM_PROMPT = """
IDENTITY: You are 'Mita', a friendly virtual shopkeeper assistant for Home Fresh Grocery.

OBJECTIVES: 
1. Always start by using the `check_returning_customer` tool to greet returning users.
2. If a user asks about the price or availability of a specific item, YOU MUST use the `check_kirana_inventory` tool immediately.
3. When telling the user a price, state when the data is from based on the tool's output.

DAY 7 ESCALATION RULES:
4. WHEN TO ESCALATE: If the caller has a payment issue, a refund dispute, or explicitly asks to speak to a human/manager, you must escalate the call.
5. PERMISSION FIRST: Before calling the `create_escalation` tool, you MUST explicitly ask the user for permission to send their details to a human team member. If they say no, apologize and do not use the tool.
6. SUMMARY: Gather who needs help, what happened, what you checked, how urgent it is, and their language to pass into the tool.
7. THE HANDOFF: After the `create_escalation` tool runs, give the user the generated Reference ID and clearly state that a human support agent will review the ticket and contact them shortly. Do not promise an immediate reply.

LANGUAGE & SCRIPT:
- Primarily speak in Bangla (Bengali), handling code-mixed Bangla and English naturally.
- Keep sentences short, concise, and conversational.
"""

class Assistant(Agent):
    def __init__(self, room: rtc.Room) -> None:
        super().__init__(instructions=SYSTEM_PROMPT)
        self.room = room
        self.current_user_id = "demo_user_01" 

    @function_tool
    async def create_escalation(self, context: RunContext, summary: str, urgency: str):
        """Use this tool to create a support ticket for a human agent. ONLY call this if the user gave permission."""
        ref_id = f"ESC-{uuid.uuid4().hex[:4].upper()}"
        
        conn = sqlite3.connect('home_fresh.db')
        c = conn.cursor()
        c.execute('''
            INSERT INTO escalations (escalation_id, user_id, summary, urgency)
            VALUES (?, ?, ?, ?)
        ''', (ref_id, self.current_user_id, summary, urgency))
        conn.commit()
        conn.close()

        logger.info(f"\n🚨 HUMAN HELP REQUESTED: Ticket {ref_id} 🚨\nUrgency: {urgency}\nDetails: {summary}\n")
        
        payload = json.dumps({"action": "toast", "message": f"🎫 Ticket {ref_id} Created", "type": "error"}).encode('utf-8')
        await self.room.local_participant.publish_data(payload, reliable=True, topic="ui-events")

        return f"Ticket successfully created. Tell the user their Reference ID is {ref_id} and a human will follow up shortly."

    @function_tool
    async def check_kirana_inventory(self, context: RunContext, item_name: str, simulate_failure: bool = False):
        """Check price and availability of a grocery item."""
        if simulate_failure:
            return "ERROR 503: Inventory API is currently down."
        
        # DAY 8: Mark the call as Successful because the user completed an enquiry!
        conn = sqlite3.connect('home_fresh.db')
        c = conn.cursor()
        c.execute('''
            UPDATE call_logs 
            SET status = 'Successful', reason = 'Caller successfully checked inventory'
            WHERE call_id = ?
        ''', (self.room.name,))
        conn.commit()
        conn.close()

        current_date = datetime.datetime.now().strftime("%B %d, %Y")
        item_lower = item_name.lower().strip()
        
        synonyms = {
            "চাল": "rice", "bhaat": "rice", "rice": "rice",
            "দুধ": "milk", "dudh": "milk", "milk": "milk",
            "ডিম": "egg", "dim": "egg", "egg": "eggs", "eggs": "egg",
            "তেল": "mustard oil", "sorshe tel": "mustard oil", "mustard oil": "mustard oil"
        }
        
        lookup_key = synonyms.get(item_lower, item_lower)
        
        for key, details in INVENTORY_DB.items():
            if key in lookup_key or lookup_key in key:
                return f"Data Timestamp: {current_date}. {item_name.capitalize()} details: {details}."
                
        return f"Data Timestamp: {current_date}. {item_name} is not found."

    @function_tool
    async def check_returning_customer(self, context: RunContext):
        """Check if caller has a saved profile."""
        conn = sqlite3.connect('home_fresh.db')
        c = conn.cursor()
        c.execute("SELECT name, past_orders FROM customers WHERE user_id=?", (self.current_user_id,))
        result = c.fetchone()
        conn.close()
        if result:
            return f"Customer Name: {result[0]}, Past Orders: {result[1]}."
        return "New customer."


server = AgentServer()

def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()

server.setup_fnc = prewarm

@server.rtc_session(agent_name="my-agent")
async def my_agent(ctx: JobContext):
    ctx.log_context_fields = {"room": ctx.room.name}

    # DAY 8: Log the new call as 'Failed' by default. 
    # (It will be updated to 'Successful' if they check inventory)
    conn = sqlite3.connect('home_fresh.db')
    c = conn.cursor()
    c.execute('''
        INSERT OR IGNORE INTO call_logs (call_id, status, reason)
        VALUES (?, ?, ?)
    ''', (ctx.room.name, 'Failed', 'Caller dropped off before finishing enquiry'))
    conn.commit()
    conn.close()

    session = AgentSession(
        stt=deepgram.STT(model="nova-3", language="bn-IN"), 
        llm=inference.LLM(model="google/gemini-2.5-flash"),
        tts=murf.TTS(
            voice="Anisha", 
            locale="bn-IN", 
            style="Conversational", 
            model="FALCON", 
            tokenizer=tokenize.basic.SentenceTokenizer(min_sentence_len=2),
            text_pacing=True
        ),
        turn_detection=MultilingualModel(),
        vad=ctx.proc.userdata["vad"],
        preemptive_generation=True,
    )

    await session.start(
        agent=Assistant(room=ctx.room),
        room=ctx.room,
        room_options=room_io.RoomOptions(
            audio_input=room_io.AudioInputOptions(
                noise_cancellation=lambda params: (
                    noise_cancellation.BVCTelephony()
                    if params.participant.kind == rtc.ParticipantKind.PARTICIPANT_KIND_SIP
                    else noise_cancellation.BVC()
                ),
            ),
        ),
    )
    
    await session.say("নমস্কার! Home Fresh-এ আপনাকে স্বাগতম। আজ আপনাকে কীভাবে সাহায্য করতে পারি?")
    await ctx.connect()

if __name__ == "__main__":
    cli.run_app(server)