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

# --- SQLITE DATABASE SETUP (Days 4, 7, 8) ---
def init_db():
    conn = sqlite3.connect('home_fresh.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS customers (user_id TEXT PRIMARY KEY, name TEXT, past_orders TEXT, preferred_delivery_slot TEXT, last_interaction TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
    c.execute('''CREATE TABLE IF NOT EXISTS escalations (escalation_id TEXT PRIMARY KEY, user_id TEXT, summary TEXT, urgency TEXT, timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
    c.execute('''CREATE TABLE IF NOT EXISTS call_logs (call_id TEXT PRIMARY KEY, status TEXT, reason TEXT, timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
    conn.commit()
    conn.close()

init_db()

# --- MOCK INVENTORY ---
INVENTORY_DB = {
    "rice": {"price_per_kg": 55, "stock": "In Stock"},
    "chal": {"price_per_kg": 55, "stock": "In Stock"},
    "milk": {"price_per_liter": 66, "stock": "Low Stock (Only 2 liters left)"},
    "egg": {"price_per_dozen": 80, "stock": "Out of Stock"},
    "mustard oil": {"price_per_liter": 160, "stock": "In Stock"},
}

# --- 1. MAIN AGENT PROMPT (MITA) ---
MAIN_PROMPT = """
IDENTITY: You are 'Mita', a friendly virtual shopkeeper assistant for Home Fresh Grocery.

OBJECTIVES: 
1. Always start by using the `check_returning_customer` tool to greet returning users.
2. If a user asks about the price or availability of a specific item, use the `check_kirana_inventory` tool immediately.

DAY 9 HANDOFF RULES:
3. You are NOT an expert in returns, refunds, or damaged goods. 
4. If a user asks about a refund or return for the FIRST time, say exactly: "আমি আপনাকে আমাদের রিফান্ড স্পেশালিস্টের কাছে ট্রান্সফার করছি।" (I am transferring you to our refund specialist) and use the `transfer_to_refund_specialist` tool.
5. AFTER the tool is called, you will act as the Refund Specialist. As the Specialist, DO NOT transfer the call again. Acknowledge the user's problem, apologize, and use the `create_escalation` tool to generate a ticket.

LANGUAGE: Primarily speak in Bangla (Bengali). Keep sentences short and concise.
"""

# --- 2. SPECIALIST AGENT PROMPT ---
SPECIALIST_PROMPT = """
IDENTITY: You are the 'Returns and Refunds Specialist' for Home Fresh Grocery. You speak strictly in Bangla (Bengali).

OBJECTIVES:
1. When you take over a call, introduce yourself briefly: "নমস্কার, আমি রিফান্ড স্পেশালিস্ট। বলুন, আপনার অর্ডারে কী সমস্যা হয়েছে?" (Hello, I am the refund specialist. Tell me, what was the issue with your order?).
2. Process their refund request calmly. 
3. You MUST use the `create_escalation` tool to generate a support ticket and Reference ID for their refund.
"""

# --- 3. SPECIALIST AGENT CLASS (For Day 9 Code Structure) ---
class RefundSpecialist(Agent):
    def __init__(self, room: rtc.Room) -> None:
        super().__init__(instructions=SPECIALIST_PROMPT)
        self.room = room
        self.current_user_id = "demo_user_01"

# --- 4. MAIN AGENT CLASS ---
class Assistant(Agent):
    def __init__(self, room: rtc.Room, agent_session: AgentSession) -> None:
        super().__init__(instructions=MAIN_PROMPT)
        self.room = room
        self.agent_session = agent_session  
        self.current_user_id = "demo_user_01" 

    @function_tool
    async def transfer_to_refund_specialist(self, context: RunContext, issue_summary: str):
        """Use this tool to transfer the call to the Refund Specialist when the user asks for a return or refund."""
        logger.info(f"🔄 HANDOFF TRIGGERED: Context: {issue_summary}")
        
        # Stop the memory loop: Explicitly command the AI to move forward with the issue
        return f"Transfer successful. The user's issue is: {issue_summary}. You are now the Refund Specialist. Acknowledge their specific issue, apologize, and ask if they want you to create a refund ticket. DO NOT repeat your introduction."

    @function_tool
    async def create_escalation(self, context: RunContext, summary: str, urgency: str):
        """Create a support ticket for a human manager for complex refunds. Only use this if you are the Refund Specialist."""
        ref_id = f"ESC-{uuid.uuid4().hex[:4].upper()}"
        conn = sqlite3.connect('home_fresh.db')
        c = conn.cursor()
        c.execute('INSERT INTO escalations (escalation_id, user_id, summary, urgency) VALUES (?, ?, ?, ?)', (ref_id, self.current_user_id, summary, urgency))
        conn.commit()
        conn.close()
        
        logger.info(f"\n🚨 HUMAN HELP REQUESTED: Ticket {ref_id} 🚨\nUrgency: {urgency}\nDetails: {summary}\n")
        
        payload = json.dumps({"action": "toast", "message": f"🎫 Ticket {ref_id} Created", "type": "error"}).encode('utf-8')
        await self.room.local_participant.publish_data(payload, reliable=True, topic="ui-events")

        return f"Ticket successfully created. Tell the user their Reference ID is {ref_id}."

    @function_tool
    async def check_kirana_inventory(self, context: RunContext, item_name: str):
        """Check price and availability of a grocery item."""
        conn = sqlite3.connect('home_fresh.db')
        c = conn.cursor()
        c.execute("UPDATE call_logs SET status = 'Successful', reason = 'Caller successfully checked inventory' WHERE call_id = ?", (self.room.name,))
        conn.commit()
        conn.close()

        current_date = datetime.datetime.now().strftime("%B %d, %Y")
        item_lower = item_name.lower().strip()
        synonyms = {"চাল": "rice", "bhaat": "rice", "দুধ": "milk", "ডিম": "egg", "তেল": "mustard oil"}
        lookup_key = synonyms.get(item_lower, item_lower)
        
        for key, details in INVENTORY_DB.items():
            if key in lookup_key or lookup_key in key:
                return f"Data Timestamp: {current_date}. {item_name.capitalize()} details: {details}."
        return f"Data Timestamp: {current_date}. {item_name} is not found."

    @function_tool
    async def check_returning_customer(self, context: RunContext):
        """Check if caller has a saved profile."""
        return "New customer."

server = AgentServer()

def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()

server.setup_fnc = prewarm

@server.rtc_session(agent_name="my-agent")
async def my_agent(ctx: JobContext):
    ctx.log_context_fields = {"room": ctx.room.name}

    conn = sqlite3.connect('home_fresh.db')
    c = conn.cursor()
    c.execute("INSERT OR IGNORE INTO call_logs (call_id, status, reason) VALUES (?, ?, ?)", (ctx.room.name, 'Failed', 'Caller dropped off before finishing enquiry'))
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

    main_agent = Assistant(room=ctx.room, agent_session=session)

    await session.start(
        agent=main_agent,
        room=ctx.room,
        room_options=room_io.RoomOptions(
            audio_input=room_io.AudioInputOptions(
                noise_cancellation=lambda params: noise_cancellation.BVCTelephony() if params.participant.kind == rtc.ParticipantKind.PARTICIPANT_KIND_SIP else noise_cancellation.BVC(),
            ),
        ),
    )
    
    await session.say("নমস্কার! Home Fresh-এ আপনাকে স্বাগতম। আজ আপনাকে কীভাবে সাহায্য করতে পারি?")
    await ctx.connect()

if __name__ == "__main__":
    cli.run_app(server)