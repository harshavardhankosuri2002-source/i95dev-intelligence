from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.database import get_db_connection
from app.message_generator import generate_personalized_message
from app.simulation_service import simulate_message_response, simulate_batch_delivery_and_replies

router = APIRouter(prefix="/api/messages", tags=["Messages"])

class PreviewMessageRequest(BaseModel):
    customer_id: str
    trigger_name: str
    channel: str = "Email"

class SimulateResponseRequest(BaseModel):
    message_id: str
    sentiment: str = "random" # "positive", "neutral", "negative", "opt_out", "random"

class SimulateBatchRequest(BaseModel):
    batch_size: int = 15

@router.get("")
def get_campaign_messages(
    customer_id: Optional[str] = None,
    channel: Optional[str] = None,
    simulated_status: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
):
    conn = get_db_connection()
    cursor = conn.cursor()

    query = '''
    SELECT m.*, c.company_name, c.assigned_account_manager, c.industry
    FROM message_campaign_logs m
    LEFT JOIN customers c ON m.customer_id = c.customer_id
    WHERE 1=1
    '''
    params = []
    if customer_id:
        query += " AND m.customer_id = ?"
        params.append(customer_id)
    if channel:
        query += " AND m.channel = ?"
        params.append(channel)
    if simulated_status:
        query += " AND m.simulated_status = ?"
        params.append(simulated_status)

    count_query = query.replace("SELECT m.*, c.company_name, c.assigned_account_manager, c.industry", "SELECT COUNT(*) as total")
    total = cursor.execute(count_query, params).fetchone()["total"]

    query += " ORDER BY m.scheduled_at DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    rows = cursor.execute(query, params).fetchall()
    messages = [dict(r) for r in rows]
    conn.close()

    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "messages": messages
    }

@router.post("/preview")
def preview_message(req: PreviewMessageRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    cust = cursor.execute("SELECT * FROM customer_analytical_features WHERE customer_id = ?", (req.customer_id,)).fetchone()
    conn.close()

    if not cust:
        raise HTTPException(status_code=404, detail="Customer not found")

    return generate_personalized_message(dict(cust), req.trigger_name, channel=req.channel)

@router.post("/simulate-response")
def simulate_response(req: SimulateResponseRequest):
    res = simulate_message_response(req.message_id, sentiment=req.sentiment)
    if "error" in res:
        raise HTTPException(status_code=404, detail=res["error"])
    return res

@router.post("/simulate-batch")
def simulate_batch(req: SimulateBatchRequest):
    return simulate_batch_delivery_and_replies(batch_size=req.batch_size)
