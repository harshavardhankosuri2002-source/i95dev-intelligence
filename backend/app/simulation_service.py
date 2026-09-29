import os
import sqlite3
import random
from datetime import datetime
from typing import Dict, Any, List, Optional
from app.database import get_db_connection

POSITIVE_REPLIES = [
    "Positive: Yes, our technical team would like to review the ERP integration specifications next Tuesday.",
    "Positive: Thanks for following up. We reviewed the proposal internally and would like to schedule a 30-min call with your architect.",
    "Positive: Received. Please share your available time slots for Thursday afternoon to finalize the SOW.",
    "Positive: Very interested in the B2B Customer Portal. Can you share an implementation timeline document?",
    "Positive: Thanks for checking in. We are ready to move ahead with the sandbox connector testing."
]

NEUTRAL_REPLIES = [
    "Neutral: Please send over the updated PDF spec sheet and follow up with us next month.",
    "Neutral: We are currently finalizing our fiscal budgeting. We will reconnect once internal allocations are cleared.",
    "Neutral: Our lead ERP architect is on leave this week. Please hold on further calls until the 15th.",
    "Neutral: Reviewing options with our procurement department. We will notify you if next steps open up."
]

NEGATIVE_REPLIES = [
    "Negative: Thank you, but we have chosen to handle the middleware connector internally.",
    "Negative: Our digital commerce initiative has been put on indefinite hold due to corporate restructuring.",
    "Negative: Selected a competing vendor for this fiscal year. Thank you for your time."
]

OPT_OUT_REPLIES = [
    "STOP - Please unsubscribe our team from further follow-up messages.",
    "Unsubscribe: Please remove this address from automated outreach.",
    "Opt-out: No longer with this department, do not contact."
]

def simulate_message_response(
    message_id: str,
    sentiment: str = "random" # "positive", "neutral", "negative", "opt_out", "random"
) -> Dict[str, Any]:
    """
    Simulates a realistic customer response on an existing sent message.
    Updates the simulated lifecycle status and audit trail.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    row = cursor.execute("SELECT * FROM message_campaign_logs WHERE message_id = ?", (message_id,)).fetchone()
    if not row:
        conn.close()
        return {"error": f"Message {message_id} not found."}

    now_iso = datetime.now().isoformat()

    if sentiment == "positive":
        reply = random.choice(POSITIVE_REPLIES)
        status = "Replied (simulated)"
        conv_out = "Converted (simulated)" if random.random() < 0.6 else "In Discussion"
        opt_out = 0
    elif sentiment == "neutral":
        reply = random.choice(NEUTRAL_REPLIES)
        status = "Replied (simulated)"
        conv_out = "Pending Review"
        opt_out = 0
    elif sentiment == "negative":
        reply = random.choice(NEGATIVE_REPLIES)
        status = "Replied (simulated)"
        conv_out = "Lost"
        opt_out = 0
    elif sentiment == "opt_out":
        reply = random.choice(OPT_OUT_REPLIES)
        status = "Opted Out"
        conv_out = "Opted Out"
        opt_out = 1
    else:
        # Weighted random
        r = random.random()
        if r < 0.50:
            reply = random.choice(POSITIVE_REPLIES)
            status = "Replied (simulated)"
            conv_out = "Converted (simulated)" if random.random() < 0.6 else "In Discussion"
            opt_out = 0
        elif r < 0.80:
            reply = random.choice(NEUTRAL_REPLIES)
            status = "Replied (simulated)"
            conv_out = "Pending Review"
            opt_out = 0
        elif r < 0.94:
            reply = random.choice(NEGATIVE_REPLIES)
            status = "Replied (simulated)"
            conv_out = "Lost"
            opt_out = 0
        else:
            reply = random.choice(OPT_OUT_REPLIES)
            status = "Opted Out"
            conv_out = "Opted Out"
            opt_out = 1

    cursor.execute('''
    UPDATE message_campaign_logs
    SET simulated_status = ?, simulated_reply = ?, conversion_outcome = ?, opt_out_status = ?, updated_at = ?
    WHERE message_id = ?
    ''', (status, reply, conv_out, opt_out, now_iso, message_id))

    # Log to audit trail
    cursor.execute('''
    INSERT INTO audit_logs (timestamp, event_type, customer_id, details)
    VALUES (?, ?, ?, ?)
    ''', (
        now_iso,
        "SIMULATED_REPLY_RECORDED",
        row["customer_id"],
        f"Simulated {status} on message {message_id}. Reply: '{reply[:60]}...'"
    ))

    conn.commit()
    conn.close()

    return {
        "message_id": message_id,
        "simulated_status": status,
        "simulated_reply": reply,
        "conversion_outcome": conv_out,
        "opt_out_status": opt_out,
        "updated_at": now_iso
    }

def simulate_batch_delivery_and_replies(batch_size: int = 15) -> Dict[str, Any]:
    """
    Simulates sending pending/queued messages and generates realistic customer reactions.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # Find sent messages that haven't received a reply yet
    sent_messages = cursor.execute('''
    SELECT message_id FROM message_campaign_logs
    WHERE simulated_status = 'Sent (simulated)'
    ORDER BY scheduled_at DESC
    LIMIT ?
    ''', (batch_size,)).fetchall()

    replied_count = 0
    converted_count = 0
    opt_out_count = 0

    for msg in sent_messages:
        res = simulate_message_response(msg["message_id"], sentiment="random")
        if res.get("simulated_status") in ["Replied (simulated)", "Converted (simulated)"]:
            replied_count += 1
            if res.get("conversion_outcome") == "Converted (simulated)":
                converted_count += 1
        elif res.get("opt_out_status") == 1:
            opt_out_count += 1

    conn.close()
    return {
        "processed_count": len(sent_messages),
        "replied_count": replied_count,
        "converted_count": converted_count,
        "opt_out_count": opt_out_count
    }
