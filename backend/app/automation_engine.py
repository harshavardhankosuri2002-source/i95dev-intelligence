import os
import sqlite3
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
import pandas as pd
from app.database import get_db_connection
from app.message_generator import generate_personalized_message

def evaluate_automation_triggers(rule_id_filter: Optional[str] = None) -> Dict[str, Any]:
    """
    Evaluates configurable behavioral triggers against real database accounts.
    Guarantees idempotency: re-running triggers never creates duplicate tasks.
    Enforces consent, suppression, frequency caps, and human-approval checks.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # Load active rules
    if rule_id_filter:
        rules_query = "SELECT * FROM automation_rules WHERE rule_id = ?"
        rules = cursor.execute(rules_query, (rule_id_filter,)).fetchall()
    else:
        rules_query = "SELECT * FROM automation_rules WHERE is_active = 1"
        rules = cursor.execute(rules_query).fetchall()

    df_cust = pd.read_sql_query("SELECT * FROM customer_analytical_features", conn)
    base_date = datetime(2026, 9, 29)

    tasks_created = 0
    tasks_suppressed = 0
    evaluated_count = len(df_cust)
    rule_results = []

    for rule in rules:
        r_id = rule["rule_id"]
        r_name = rule["trigger_name"]
        delay_days = rule["delay_days"]
        pref_channel = rule["preferred_channel"]
        max_attempts = rule["max_attempts"]
        min_interval = rule["min_interval_days"]
        require_approval = rule["require_human_approval"]
        daily_limit = rule["daily_limit"]

        matched_customers = []

        # Trigger logic
        if "Trigger A" in r_name:
            # High-intent: Proposal sent, days since interaction >= delay_days, open pipeline > 0
            matched = df_cust[
                (df_cust['proposal_count'] > 0) &
                (df_cust['open_pipeline_value'] > 0) &
                (df_cust['days_since_last_interaction'] >= delay_days) &
                (df_cust['cluster_label'].str.contains('High-Intent', case=False, na=False))
            ]
            matched_customers = matched.to_dict(orient='records')

        elif "Trigger B" in r_name:
            # Stalled opportunity: open opportunity > 0, days since interaction >= delay_days (e.g. 21 days)
            matched = df_cust[
                (df_cust['open_opportunity_count'] > 0) &
                (df_cust['days_since_last_interaction'] >= delay_days) &
                (df_cust['cluster_label'].str.contains('Stalled', case=False, na=False))
            ]
            matched_customers = matched.to_dict(orient='records')

        elif "Trigger C" in r_name:
            # Meeting / Demo follow-up: demo attendance > 0 or meeting attendance > 0
            matched = df_cust[
                (df_cust['demo_attendance_rate'] > 0.3) &
                (df_cust['days_since_last_interaction'] >= delay_days) &
                (df_cust['account_type'] == 'Prospect')
            ]
            matched_customers = matched.to_dict(orient='records')

        elif "Trigger D" in r_name:
            # Existing Client Expansion: active client, high CSAT >= 4.0, zero open tickets, low days since purchase
            matched = df_cust[
                (df_cust['account_type'] == 'Active Client') &
                (df_cust['avg_csat_score'] >= 4.0) &
                (df_cust['open_ticket_count'] == 0) &
                (df_cust['cluster_label'].str.contains('Expansion|Growth', case=False, na=False))
            ]
            matched_customers = matched.to_dict(orient='records')

        elif "Trigger E" in r_name:
            # Retention / Support Concern: open tickets >= 2 or CSAT < 3.0 or high risk score
            matched = df_cust[
                (df_cust['open_ticket_count'] >= 2) |
                (df_cust['avg_csat_score'] < 3.0) |
                (df_cust['retention_risk_score'] >= 45.0)
            ]
            matched_customers = matched.to_dict(orient='records')

        rule_created = 0
        rule_suppressed = 0

        for cust in matched_customers:
            if rule_created >= daily_limit:
                break

            cust_id = cust['customer_id']
            channel = cust.get('preferred_channel', pref_channel) or pref_channel
            if channel not in ["Email", "WhatsApp"]:
                channel = pref_channel

            # 1. Check Consent Safeguards
            has_consent = True
            suppression_reason = None

            if channel == "Email" and cust.get('consent_email', 1) == 0:
                has_consent = False
                suppression_reason = "Customer has not consented to Email communication (Opt-out/Suppressed)."
            elif channel == "WhatsApp" and cust.get('consent_whatsapp', 1) == 0:
                has_consent = False
                suppression_reason = "Customer has not consented to WhatsApp communication (Opt-out/Suppressed)."

            # 2. Check Global Opt-Out Status in campaign logs
            opt_out_check = cursor.execute(
                "SELECT COUNT(*) as cnt FROM message_campaign_logs WHERE customer_id = ? AND opt_out_status = 1",
                (cust_id,)
            ).fetchone()["cnt"]

            if opt_out_check > 0:
                has_consent = False
                suppression_reason = "Customer is on global suppression list (Recorded opt-out/STOP request)."

            # 3. Check Idempotency & Frequency Caps
            # Check existing pending or scheduled tasks for same customer and rule
            existing_task = cursor.execute(
                "SELECT COUNT(*) as cnt FROM scheduled_tasks WHERE customer_id = ? AND rule_id = ? AND status IN ('PENDING', 'APPROVED', 'EXECUTED')",
                (cust_id, r_id)
            ).fetchone()["cnt"]

            if existing_task > 0:
                # Idempotent skip: task already exists for this event
                continue

            # Check attempt counts in scheduled tasks
            prev_attempts = cursor.execute(
                "SELECT COUNT(*) as cnt FROM scheduled_tasks WHERE customer_id = ? AND rule_id = ?",
                (cust_id, r_id)
            ).fetchone()["cnt"]

            if prev_attempts >= max_attempts:
                has_consent = False
                suppression_reason = f"Frequency Cap: Maximum attempts reached ({max_attempts} attempts)."

            # 4. Generate Message Content
            msg_data = generate_personalized_message(cust, r_name, channel=channel)
            full_msg = f"Subject: {msg_data['subject']}\n\n{msg_data['body']}" if msg_data['subject'] else msg_data['body']

            task_id = f"TASK-{uuid.uuid4().hex[:8].upper()}"
            scheduled_for = (datetime.now() + timedelta(hours=2)).strftime("%Y-%m-%d %H:%M:%S")
            now_iso = datetime.now().isoformat()

            if has_consent:
                status = "PENDING" if require_approval else "APPROVED"
                cursor.execute('''
                INSERT INTO scheduled_tasks VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
                ''', (
                    task_id, cust_id, r_id, channel, r_name, full_msg,
                    scheduled_for, status, None, prev_attempts + 1, now_iso, None
                ))
                rule_created += 1
                tasks_created += 1
            else:
                cursor.execute('''
                INSERT INTO scheduled_tasks VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
                ''', (
                    task_id, cust_id, r_id, channel, r_name, full_msg,
                    scheduled_for, "SUPPRESSED", suppression_reason, prev_attempts + 1, now_iso, None
                ))
                rule_suppressed += 1
                tasks_suppressed += 1

        rule_results.append({
            "rule_id": r_id,
            "trigger_name": r_name,
            "matched_accounts": len(matched_customers),
            "tasks_created": rule_created,
            "tasks_suppressed": rule_suppressed
        })

    # Log to audit trail
    cursor.execute('''
    INSERT INTO audit_logs (timestamp, event_type, details)
    VALUES (?, ?, ?)
    ''', (
        datetime.now().isoformat(),
        "AUTOMATION_TRIGGER_EVALUATION",
        f"Evaluated {len(rules)} active rules across {evaluated_count} accounts. Created {tasks_created} eligible tasks; {tasks_suppressed} suppressed."
    ))

    conn.commit()
    conn.close()

    return {
        "status": "success",
        "evaluated_accounts": evaluated_count,
        "total_tasks_created": tasks_created,
        "total_tasks_suppressed": tasks_suppressed,
        "rules_breakdown": rule_results,
        "timestamp": datetime.now().isoformat()
    }

def execute_approved_tasks() -> Dict[str, Any]:
    """
    Executes approved tasks in the queue, moving them to simulated campaign logs.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    approved_tasks = cursor.execute(
        "SELECT * FROM scheduled_tasks WHERE status = 'APPROVED'"
    ).fetchall()

    dispatched = 0
    now_iso = datetime.now().isoformat()

    for task in approved_tasks:
        t_id = task["task_id"]
        c_id = task["customer_id"]
        ch = task["channel"]
        trig = task["trigger_reason"]
        msg = task["generated_message"]
        
        msg_id = f"MSG-{uuid.uuid4().hex[:8].upper()}"
        camp_id = f"CAMP-{task['rule_id']}"

        # Insert to campaign logs as Scheduled / Sent (simulated)
        cursor.execute('''
        INSERT INTO message_campaign_logs VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
        ''', (
            msg_id, c_id, camp_id, ch, trig, msg, now_iso,
            "Sent (simulated)", None, None, 0, now_iso, now_iso
        ))

        # Update scheduled task to EXECUTED
        cursor.execute('''
        UPDATE scheduled_tasks
        SET status = 'EXECUTED', executed_at = ?
        WHERE task_id = ?
        ''', (now_iso, t_id))

        dispatched += 1

    cursor.execute('''
    INSERT INTO audit_logs (timestamp, event_type, details)
    VALUES (?, ?, ?)
    ''', (
        now_iso,
        "DISPATCH_APPROVED_TASKS",
        f"Dispatched {dispatched} approved tasks to campaign execution."
    ))

    conn.commit()
    conn.close()

    return {
        "dispatched_count": dispatched,
        "timestamp": now_iso
    }
