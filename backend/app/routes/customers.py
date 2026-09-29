import os
import sqlite3
from typing import Optional, List
from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import FileResponse
from app.database import get_db_connection

router = APIRouter(prefix="/api/customers", tags=["Customers"])

@router.get("")
def get_customers(
    search: Optional[str] = None,
    segment: Optional[str] = None,
    industry: Optional[str] = None,
    region: Optional[str] = None,
    account_type: Optional[str] = None,
    account_manager: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
):
    conn = get_db_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM customer_analytical_features WHERE 1=1"
    params = []

    if search:
        query += " AND (company_name LIKE ? OR customer_id LIKE ?)"
        params.extend([f"%{search}%", f"%{search}%"])
    if segment:
        query += " AND cluster_label = ?"
        params.append(segment)
    if industry:
        query += " AND industry = ?"
        params.append(industry)
    if region:
        query += " AND region = ?"
        params.append(region)
    if account_type:
        query += " AND account_type = ?"
        params.append(account_type)
    if account_manager:
        query += " AND assigned_account_manager = ?"
        params.append(account_manager)

    # Count total
    count_query = query.replace("SELECT *", "SELECT COUNT(*) as total")
    total = cursor.execute(count_query, params).fetchone()["total"]

    query += " ORDER BY open_pipeline_value DESC, total_revenue DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    rows = cursor.execute(query, params).fetchall()
    customers = [dict(r) for r in rows]

    conn.close()
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "customers": customers
    }

@router.get("/{customer_id}")
def get_customer_details(customer_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()

    cust = cursor.execute(
        "SELECT * FROM customer_analytical_features WHERE customer_id = ?",
        (customer_id,)
    ).fetchone()

    if not cust:
        conn.close()
        raise HTTPException(status_code=404, detail="Customer not found")

    transactions = [dict(r) for r in cursor.execute(
        "SELECT * FROM transactions WHERE customer_id = ? ORDER BY transaction_date DESC",
        (customer_id,)
    ).fetchall()]

    interactions = [dict(r) for r in cursor.execute(
        "SELECT * FROM sales_interactions WHERE customer_id = ? ORDER BY interaction_date DESC",
        (customer_id,)
    ).fetchall()]

    tickets = [dict(r) for r in cursor.execute(
        "SELECT * FROM support_tickets WHERE customer_id = ? ORDER BY created_date DESC",
        (customer_id,)
    ).fetchall()]

    pipeline = [dict(r) for r in cursor.execute(
        "SELECT * FROM pipeline_opportunities WHERE customer_id = ? ORDER BY last_activity_date DESC",
        (customer_id,)
    ).fetchall()]

    messages = [dict(r) for r in cursor.execute(
        "SELECT * FROM message_campaign_logs WHERE customer_id = ? ORDER BY scheduled_at DESC",
        (customer_id,)
    ).fetchall()]

    scheduled = [dict(r) for r in cursor.execute(
        "SELECT * FROM scheduled_tasks WHERE customer_id = ? ORDER BY created_at DESC",
        (customer_id,)
    ).fetchall()]

    conn.close()

    # Determine recommended next action based on behavioral profile
    c_label = cust["cluster_label"] or ""
    if "High-Intent" in c_label:
        next_action = {
            "title": "Trigger A: Proposal Follow-up",
            "reason": f"Active commercial pipeline of ${cust['open_pipeline_value']:,.2f} with proposal delivered.",
            "urgency": "High (Within 48h)",
            "channel": cust["preferred_channel"]
        }
    elif "Stalled" in c_label:
        next_action = {
            "title": "Trigger B: Low-Pressure Re-engagement",
            "reason": f"No sales interaction for {cust['days_since_last_interaction']:.0f} days. Share lightweight Phase-1 architecture brief.",
            "urgency": "Medium",
            "channel": "WhatsApp" if cust["consent_whatsapp"] else "Email"
        }
    elif "Retention" in c_label:
        next_action = {
            "title": "Trigger E: Executive Support Escalation",
            "reason": f"{cust['open_ticket_count']} open tickets and {cust['avg_csat_score']:.1f}/5.0 CSAT. Marketing suppressed.",
            "urgency": "Urgent Priority",
            "channel": "Direct Call / Dedicated Email"
        }
    elif "Growth" in c_label or "Expansion" in c_label:
        next_action = {
            "title": "Trigger D: B2B Portal Expansion Discussion",
            "reason": f"Established customer (${cust['total_revenue']:,.2f} billings). Propose self-service customer portal module.",
            "urgency": "Normal",
            "channel": "Email"
        }
    else:
        next_action = {
            "title": "Quarterly Check-in",
            "reason": "Maintain brand touchpoint and monitor upcoming integration requirements.",
            "urgency": "Low",
            "channel": cust["preferred_channel"]
        }

    return {
        "customer": dict(cust),
        "transactions": transactions,
        "interactions": interactions,
        "support_tickets": tickets,
        "pipeline_opportunities": pipeline,
        "campaign_messages": messages,
        "scheduled_tasks": scheduled,
        "recommended_next_action": next_action
    }

@router.get("/export/csv")
def export_customers_csv():
    data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data")
    csv_path = os.path.join(data_dir, "customers.csv")
    if not os.path.exists(csv_path):
        raise HTTPException(status_code=404, detail="CSV not found. Regenerate synthetic data first.")
    return FileResponse(csv_path, media_type="text/csv", filename="i95dev_customers_master.csv")
