from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.database import get_db_connection
from app.automation_engine import evaluate_automation_triggers, execute_approved_tasks

router = APIRouter(prefix="/api/automation", tags=["Automation"])

class UpdateRuleRequest(BaseModel):
    delay_days: Optional[int] = None
    preferred_channel: Optional[str] = None
    max_attempts: Optional[int] = None
    min_interval_days: Optional[int] = None
    require_human_approval: Optional[int] = None
    daily_limit: Optional[int] = None

class TaskActionRequest(BaseModel):
    action: str # "APPROVE", "REJECT", "SCHEDULE"
    edited_message: Optional[str] = None

@router.get("/rules")
def get_automation_rules():
    conn = get_db_connection()
    cursor = conn.cursor()
    rows = cursor.execute("SELECT * FROM automation_rules ORDER BY rule_id").fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.post("/rules/{rule_id}/toggle")
def toggle_rule(rule_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    rule = cursor.execute("SELECT * FROM automation_rules WHERE rule_id = ?", (rule_id,)).fetchone()
    if not rule:
        conn.close()
        raise HTTPException(status_code=404, detail="Rule not found")
    
    new_state = 0 if rule["is_active"] == 1 else 1
    cursor.execute("UPDATE automation_rules SET is_active = ? WHERE rule_id = ?", (new_state, rule_id))
    conn.commit()
    conn.close()
    return {"rule_id": rule_id, "is_active": new_state}

@router.put("/rules/{rule_id}")
def update_rule(rule_id: str, req: UpdateRuleRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    rule = cursor.execute("SELECT * FROM automation_rules WHERE rule_id = ?", (rule_id,)).fetchone()
    if not rule:
        conn.close()
        raise HTTPException(status_code=404, detail="Rule not found")

    fields = []
    values = []
    if req.delay_days is not None:
        fields.append("delay_days = ?")
        values.append(req.delay_days)
    if req.preferred_channel is not None:
        fields.append("preferred_channel = ?")
        values.append(req.preferred_channel)
    if req.max_attempts is not None:
        fields.append("max_attempts = ?")
        values.append(req.max_attempts)
    if req.min_interval_days is not None:
        fields.append("min_interval_days = ?")
        values.append(req.min_interval_days)
    if req.require_human_approval is not None:
        fields.append("require_human_approval = ?")
        values.append(req.require_human_approval)
    if req.daily_limit is not None:
        fields.append("daily_limit = ?")
        values.append(req.daily_limit)

    if fields:
        values.append(rule_id)
        cursor.execute(f"UPDATE automation_rules SET {', '.join(fields)} WHERE rule_id = ?", values)
        conn.commit()

    updated = cursor.execute("SELECT * FROM automation_rules WHERE rule_id = ?", (rule_id,)).fetchone()
    conn.close()
    return dict(updated)

@router.post("/evaluate")
def run_evaluation(rule_id: Optional[str] = None):
    return evaluate_automation_triggers(rule_id_filter=rule_id)

@router.get("/tasks")
def get_scheduled_tasks(status: Optional[str] = None, limit: int = 100):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = '''
    SELECT t.*, c.company_name, c.industry, c.assigned_account_manager, c.consent_email, c.consent_whatsapp
    FROM scheduled_tasks t
    LEFT JOIN customers c ON t.customer_id = c.customer_id
    WHERE 1=1
    '''
    params = []
    if status:
        query += " AND t.status = ?"
        params.append(status)

    query += " ORDER BY t.created_at DESC LIMIT ?"
    params.append(limit)

    rows = cursor.execute(query, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.post("/tasks/{task_id}/action")
def update_task_action(task_id: str, req: TaskActionRequest):
    conn = get_db_connection()
    cursor = conn.cursor()

    task = cursor.execute("SELECT * FROM scheduled_tasks WHERE task_id = ?", (task_id,)).fetchone()
    if not task:
        conn.close()
        raise HTTPException(status_code=404, detail="Task not found")

    new_status = "APPROVED" if req.action == "APPROVE" else ("REJECTED" if req.action == "REJECT" else "APPROVED")
    
    if req.edited_message:
        cursor.execute(
            "UPDATE scheduled_tasks SET status = ?, generated_message = ? WHERE task_id = ?",
            (new_status, req.edited_message, task_id)
        )
    else:
        cursor.execute("UPDATE scheduled_tasks SET status = ? WHERE task_id = ?", (new_status, task_id))

    conn.commit()
    conn.close()
    return {"task_id": task_id, "status": new_status}

@router.post("/tasks/dispatch")
def dispatch_approved():
    return execute_approved_tasks()

@router.get("/audit")
def get_audit_logs(limit: int = 50):
    conn = get_db_connection()
    cursor = conn.cursor()
    rows = cursor.execute(
        "SELECT * FROM audit_logs ORDER BY log_id DESC LIMIT ?",
        (limit,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]
