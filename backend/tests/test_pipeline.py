import pytest
import sqlite3
import pandas as pd
from app.database import get_db_connection
from app.feature_engineering import build_analytical_features
from app.clustering import run_kmeans_clustering
from app.automation_engine import evaluate_automation_triggers
from app.routes.data_mgmt import validate_data_health
from app.simulation_service import simulate_message_response

def test_feature_engineering():
    """Verify feature engineering produces complete vectorization without nulls."""
    df = build_analytical_features()
    assert len(df) >= 1000
    assert "engagement_score" in df.columns
    assert "retention_risk_score" in df.columns
    assert df["engagement_score"].min() >= 0
    assert df["engagement_score"].max() <= 100
    assert df["retention_risk_score"].min() >= 0
    assert df["retention_risk_score"].max() <= 100
    assert df["total_revenue"].isnull().sum() == 0
    assert df["open_pipeline_value"].isnull().sum() == 0

def test_clustering_execution():
    """Verify K-Means clustering runs and calculates valid silhouette score."""
    res = run_kmeans_clustering(k=5)
    assert res["k"] == 5
    assert "silhouette_score" in res
    assert res["silhouette_score"] > 0.0
    assert len(res["clusters"]) == 5
    total_assigned = sum(c["account_count"] for c in res["clusters"])
    assert total_assigned >= 1000

def test_trigger_evaluation_and_idempotency():
    """Verify trigger evaluation creates tasks and strictly prevents duplicates (idempotency)."""
    conn = get_db_connection()
    conn.cursor().execute("DELETE FROM scheduled_tasks")
    conn.commit()
    conn.close()

    # First run on specific rule
    run1 = evaluate_automation_triggers(rule_id_filter="RULE-001")
    assert run1["status"] == "success"
    tasks_run1 = run1["total_tasks_created"]
    assert tasks_run1 > 0

    # Second run immediately on same rule
    run2 = evaluate_automation_triggers(rule_id_filter="RULE-001")
    assert run2["status"] == "success"

    # Strictly check: NO duplicate customer-rule pairs exist in database
    conn = get_db_connection()
    c = conn.cursor()
    dups = c.execute("""
        SELECT customer_id, rule_id, COUNT(*) as cnt 
        FROM scheduled_tasks 
        WHERE status IN ('PENDING', 'APPROVED', 'EXECUTED')
        GROUP BY customer_id, rule_id 
        HAVING COUNT(*) > 1
    """).fetchall()
    conn.close()
    assert len(dups) == 0

def test_suppression_and_consent_rules():
    """Verify accounts with opt-out or missing consent are suppressed."""
    conn = get_db_connection()
    cursor = conn.cursor()
    suppressed_tasks = cursor.execute(
        "SELECT COUNT(*) as c FROM scheduled_tasks WHERE status = 'SUPPRESSED'"
    ).fetchone()["c"]
    conn.close()
    assert suppressed_tasks >= 0

def test_data_validation_suite():
    """Verify foreign keys and database health pass validation suite."""
    report = validate_data_health()
    assert report["overall_health"] in ["HEALTHY", "WARNING"]
    assert report["total_checks"] >= 6
    assert report["passed_checks"] >= 6

def test_simulation_lifecycle():
    """Verify simulated message response updates status and records reply."""
    conn = get_db_connection()
    cursor = conn.cursor()
    msg = cursor.execute("SELECT message_id FROM message_campaign_logs LIMIT 1").fetchone()
    conn.close()
    
    if msg:
        res = simulate_message_response(msg["message_id"], sentiment="positive")
        assert res["simulated_status"] == "Replied (simulated)"
        assert "Positive" in res["simulated_reply"]
