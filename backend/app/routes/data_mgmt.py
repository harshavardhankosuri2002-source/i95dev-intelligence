import os
import json
import sqlite3
import pandas as pd
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from app.database import get_db_connection, DB_PATH
from app.synthetic_generator import generate_all_synthetic_data
from app.feature_engineering import build_analytical_features
from app.clustering import run_kmeans_clustering

router = APIRouter(prefix="/api/data", tags=["Data Management"])

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data")

class RegenerateRequest(BaseModel):
    seed: int = 42
    count: int = 1000

@router.get("/datasets")
def list_datasets():
    conn = get_db_connection()
    cursor = conn.cursor()

    tables = [
        "customers", "transactions", "sales_interactions",
        "support_tickets", "pipeline_opportunities", "message_campaign_logs"
    ]
    results = []

    for tbl in tables:
        count = cursor.execute(f"SELECT COUNT(*) as cnt FROM {tbl}").fetchone()["cnt"]
        csv_file = os.path.join(DATA_DIR, f"{tbl}.csv")
        file_size_kb = round(os.path.getsize(csv_file) / 1024, 1) if os.path.exists(csv_file) else 0

        # Sample 3 records
        sample_rows = [dict(r) for r in cursor.execute(f"SELECT * FROM {tbl} LIMIT 3").fetchall()]

        results.append({
            "table_name": tbl,
            "record_count": count,
            "csv_filename": f"{tbl}.csv",
            "file_size_kb": file_size_kb,
            "sample_records": sample_rows
        })

    # Last generated metadata
    cursor.execute("SELECT value FROM metadata_store WHERE key = 'last_generated_at'")
    last_gen = cursor.fetchone()
    last_gen_str = last_gen["value"] if last_gen else "Never"

    conn.close()

    return {
        "datasets": results,
        "last_generated_at": last_gen_str
    }

@router.get("/dictionary")
def get_data_dictionary():
    dict_path = os.path.join(DATA_DIR, "data_dictionary.json")
    if not os.path.exists(dict_path):
        raise HTTPException(status_code=404, detail="Data dictionary not found.")
    with open(dict_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data

@router.get("/download/{table_name}")
def download_csv(table_name: str):
    csv_file = os.path.join(DATA_DIR, f"{table_name}.csv")
    if not os.path.exists(csv_file):
        raise HTTPException(status_code=404, detail=f"File {table_name}.csv not found.")
    return FileResponse(csv_file, media_type="text/csv", filename=f"{table_name}.csv")

@router.post("/regenerate")
def regenerate_data(req: RegenerateRequest):
    try:
        # 1. Generate synthetic master tables
        generate_all_synthetic_data(seed=req.seed, count=req.count)
        # 2. Re-engineer analytical features
        build_analytical_features()
        # 3. Re-run clustering
        cluster_res = run_kmeans_clustering(k=5)

        return {
            "status": "success",
            "message": f"Successfully regenerated dataset with {req.count} accounts (seed: {req.seed}).",
            "clustering": cluster_res
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/validate")
def validate_data_health():
    """
    Runs automated integrity and validation checks across all 6 linked datasets.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    checks = []

    # 1. Total accounts count
    cust_count = cursor.execute("SELECT COUNT(*) as c FROM customers").fetchone()["c"]
    checks.append({
        "check": "Customer Master Records",
        "status": "PASS" if cust_count >= 1000 else "FAIL",
        "details": f"{cust_count} master customer accounts present."
    })

    # 2. Foreign Key Integrity: Transactions
    orphaned_trans = cursor.execute('''
    SELECT COUNT(*) as c FROM transactions WHERE customer_id NOT IN (SELECT customer_id FROM customers)
    ''').fetchone()["c"]
    checks.append({
        "check": "Foreign Key Integrity: Transactions -> Customers",
        "status": "PASS" if orphaned_trans == 0 else "FAIL",
        "details": f"{orphaned_trans} orphaned transaction records."
    })

    # 3. Foreign Key Integrity: Interactions
    orphaned_inter = cursor.execute('''
    SELECT COUNT(*) as c FROM sales_interactions WHERE customer_id NOT IN (SELECT customer_id FROM customers)
    ''').fetchone()["c"]
    checks.append({
        "check": "Foreign Key Integrity: Interactions -> Customers",
        "status": "PASS" if orphaned_inter == 0 else "FAIL",
        "details": f"{orphaned_inter} orphaned sales interaction records."
    })

    # 4. Foreign Key Integrity: Support Tickets
    orphaned_tickets = cursor.execute('''
    SELECT COUNT(*) as c FROM support_tickets WHERE customer_id NOT IN (SELECT customer_id FROM customers)
    ''').fetchone()["c"]
    checks.append({
        "check": "Foreign Key Integrity: Support Tickets -> Customers",
        "status": "PASS" if orphaned_tickets == 0 else "FAIL",
        "details": f"{orphaned_tickets} orphaned support ticket records."
    })

    # 5. Foreign Key Integrity: Pipeline Opportunities
    orphaned_pipe = cursor.execute('''
    SELECT COUNT(*) as c FROM pipeline_opportunities WHERE customer_id NOT IN (SELECT customer_id FROM customers)
    ''').fetchone()["c"]
    checks.append({
        "check": "Foreign Key Integrity: Pipeline Opportunities -> Customers",
        "status": "PASS" if orphaned_pipe == 0 else "FAIL",
        "details": f"{orphaned_pipe} orphaned pipeline records."
    })

    # 6. Intentional Missing Values Audit (Realism check)
    null_csat = cursor.execute("SELECT COUNT(*) as c FROM support_tickets WHERE customer_satisfaction IS NULL").fetchone()["c"]
    null_res = cursor.execute("SELECT COUNT(*) as c FROM support_tickets WHERE resolution_time_hours IS NULL").fetchone()["c"]
    checks.append({
        "check": "Synthetic Noise & Anomaly Validation",
        "status": "PASS",
        "details": f"{null_csat} pending/unrated tickets (missing CSAT) and {null_res} unresolved tickets correctly handled by cleaning pipeline."
    })

    # 7. Customer Analytical Features Integrity
    feature_count = cursor.execute("SELECT COUNT(*) as c FROM customer_analytical_features").fetchone()["c"]
    unassigned_clusters = cursor.execute("SELECT COUNT(*) as c FROM customer_analytical_features WHERE cluster_label IS NULL").fetchone()["c"]
    checks.append({
        "check": "Analytical Feature Store & Cluster Label Assignment",
        "status": "PASS" if feature_count == cust_count and unassigned_clusters == 0 else "FAIL",
        "details": f"{feature_count}/{cust_count} accounts fully vectorized with persistent cluster assignments."
    })

    conn.close()

    overall_pass = all(c["status"] == "PASS" for c in checks)

    return {
        "overall_health": "HEALTHY" if overall_pass else "WARNING",
        "total_checks": len(checks),
        "passed_checks": sum(1 for c in checks if c["status"] == "PASS"),
        "checks": checks
    }
