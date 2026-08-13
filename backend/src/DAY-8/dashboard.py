import streamlit as st
import sqlite3
import pandas as pd

st.set_page_config(page_title="Home Fresh Analytics", page_icon="📊", layout="centered")

st.title("🛒 Home Fresh - Call Analytics")
st.markdown("Real-time telemetry and success tracking for **Mita**, your local commerce voice agent.")

def load_data():
    conn = sqlite3.connect('home_fresh.db')
    try:
        df_calls = pd.read_sql("SELECT * FROM call_logs ORDER BY timestamp DESC", conn)
    except Exception:
        df_calls = pd.DataFrame(columns=["call_id", "status", "reason", "timestamp"])
    conn.close()
    return df_calls

df_calls = load_data()

# Calculate Day 8 Metrics
total_calls = len(df_calls)
successful_calls = len(df_calls[df_calls['status'] == 'Successful']) if not df_calls.empty else 0
failed_calls = len(df_calls[df_calls['status'] == 'Failed']) if not df_calls.empty else 0

# Display the 3 Required Numbers
col1, col2, col3 = st.columns(3)
col1.metric("📞 Total Calls", total_calls)
col2.metric("✅ Successful Calls", successful_calls)
col3.metric("⚠️ Failed / Incomplete", failed_calls)

st.divider()

st.subheader("📋 Recent Call Logs")
if not df_calls.empty:
    st.dataframe(df_calls, use_container_width=True)
else:
    st.info("No calls recorded yet. Make a call via your browser agent to populate real telemetry data!")

if st.button("🔄 Refresh Analytics"):
    st.rerun()