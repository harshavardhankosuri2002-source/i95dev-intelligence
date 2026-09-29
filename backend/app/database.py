import os
import sqlite3
from typing import Dict, Any, List, Optional
import json

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "i95dev.db")

def get_db_connection() -> sqlite3.Connection:
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS customers (
        customer_id TEXT PRIMARY KEY,
        company_name TEXT NOT NULL,
        industry TEXT NOT NULL,
        company_size TEXT NOT NULL,
        region TEXT NOT NULL,
        lead_source TEXT NOT NULL,
        account_type TEXT NOT NULL,
        acquisition_date TEXT NOT NULL,
        assigned_account_manager TEXT NOT NULL,
        consent_email INTEGER NOT NULL DEFAULT 1,
        consent_whatsapp INTEGER NOT NULL DEFAULT 1,
        preferred_channel TEXT NOT NULL,
        account_status TEXT NOT NULL
    )
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS transactions (
        transaction_id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        transaction_date TEXT NOT NULL,
        service_category TEXT NOT NULL,
        project_value REAL NOT NULL,
        contract_status TEXT NOT NULL,
        renewal_date TEXT,
        repeat_purchase_count INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (customer_id) REFERENCES customers (customer_id)
    )
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS sales_interactions (
        interaction_id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        interaction_date TEXT NOT NULL,
        channel TEXT NOT NULL,
        interaction_type TEXT NOT NULL,
        email_response INTEGER NOT NULL DEFAULT 0,
        meeting_attended INTEGER NOT NULL DEFAULT 0,
        demo_attended INTEGER NOT NULL DEFAULT 0,
        proposal_sent INTEGER NOT NULL DEFAULT 0,
        days_since_last_interaction INTEGER NOT NULL DEFAULT 0,
        interaction_outcome TEXT NOT NULL,
        FOREIGN KEY (customer_id) REFERENCES customers (customer_id)
    )
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS support_tickets (
        ticket_id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        issue_category TEXT NOT NULL,
        priority TEXT NOT NULL,
        created_date TEXT NOT NULL,
        resolved_date TEXT,
        resolution_time_hours REAL,
        customer_satisfaction REAL,
        ticket_status TEXT NOT NULL,
        FOREIGN KEY (customer_id) REFERENCES customers (customer_id)
    )
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS pipeline_opportunities (
        opportunity_id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        opportunity_value REAL NOT NULL,
        sales_stage TEXT NOT NULL,
        proposal_date TEXT,
        last_activity_date TEXT,
        outcome TEXT NOT NULL,
        lost_reason TEXT,
        FOREIGN KEY (customer_id) REFERENCES customers (customer_id)
    )
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS message_campaign_logs (
        message_id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        campaign_id TEXT NOT NULL,
        channel TEXT NOT NULL,
        trigger_reason TEXT NOT NULL,
        generated_message TEXT NOT NULL,
        scheduled_at TEXT NOT NULL,
        simulated_status TEXT NOT NULL,
        simulated_reply TEXT,
        conversion_outcome TEXT,
        opt_out_status INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (customer_id) REFERENCES customers (customer_id)
    )
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS customer_analytical_features (
        customer_id TEXT PRIMARY KEY,
        company_name TEXT NOT NULL,
        industry TEXT NOT NULL,
        company_size TEXT NOT NULL,
        region TEXT NOT NULL,
        account_type TEXT NOT NULL,
        account_status TEXT NOT NULL,
        assigned_account_manager TEXT NOT NULL,
        consent_email INTEGER NOT NULL DEFAULT 1,
        consent_whatsapp INTEGER NOT NULL DEFAULT 1,
        preferred_channel TEXT NOT NULL,
        total_revenue REAL NOT NULL DEFAULT 0,
        avg_project_value REAL NOT NULL DEFAULT 0,
        transaction_count INTEGER NOT NULL DEFAULT 0,
        repeat_purchase_count INTEGER NOT NULL DEFAULT 0,
        days_since_last_purchase REAL,
        renewal_proximity_days REAL,
        total_interactions INTEGER NOT NULL DEFAULT 0,
        days_since_last_interaction REAL,
        email_response_rate REAL NOT NULL DEFAULT 0,
        meeting_attendance_rate REAL NOT NULL DEFAULT 0,
        demo_attendance_rate REAL NOT NULL DEFAULT 0,
        proposal_count INTEGER NOT NULL DEFAULT 0,
        open_opportunity_count INTEGER NOT NULL DEFAULT 0,
        open_pipeline_value REAL NOT NULL DEFAULT 0,
        highest_sales_stage TEXT,
        days_in_current_stage REAL,
        support_ticket_count INTEGER NOT NULL DEFAULT 0,
        open_ticket_count INTEGER NOT NULL DEFAULT 0,
        avg_resolution_time_hours REAL,
        avg_csat_score REAL,
        high_priority_ticket_count INTEGER NOT NULL DEFAULT 0,
        engagement_score REAL NOT NULL DEFAULT 0,
        retention_risk_score REAL NOT NULL DEFAULT 0,
        cluster_id INTEGER,
        cluster_label TEXT,
        firmographic_segment TEXT,
        FOREIGN KEY (customer_id) REFERENCES customers (customer_id)
    )
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS automation_rules (
        rule_id TEXT PRIMARY KEY,
        trigger_name TEXT NOT NULL,
        description TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        delay_days INTEGER NOT NULL DEFAULT 3,
        preferred_channel TEXT NOT NULL DEFAULT 'Email',
        max_attempts INTEGER NOT NULL DEFAULT 3,
        min_interval_days INTEGER NOT NULL DEFAULT 5,
        working_hours_only INTEGER NOT NULL DEFAULT 1,
        require_human_approval INTEGER NOT NULL DEFAULT 0,
        daily_limit INTEGER NOT NULL DEFAULT 50,
        created_at TEXT NOT NULL
    )
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS scheduled_tasks (
        task_id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        rule_id TEXT NOT NULL,
        channel TEXT NOT NULL,
        trigger_reason TEXT NOT NULL,
        generated_message TEXT NOT NULL,
        scheduled_for TEXT NOT NULL,
        status TEXT NOT NULL,
        suppression_reason TEXT,
        attempts INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        executed_at TEXT,
        FOREIGN KEY (customer_id) REFERENCES customers (customer_id),
        FOREIGN KEY (rule_id) REFERENCES automation_rules (rule_id)
    )
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS audit_logs (
        log_id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        event_type TEXT NOT NULL,
        customer_id TEXT,
        details TEXT NOT NULL
    )
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS metadata_store (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    )
    ''')

    cursor.execute('CREATE INDEX IF NOT EXISTS idx_trans_cust ON transactions(customer_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_inter_cust ON sales_interactions(customer_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_supp_cust ON support_tickets(customer_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_pipe_cust ON pipeline_opportunities(customer_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_msg_cust ON message_campaign_logs(customer_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_tasks_status ON scheduled_tasks(status)')

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully.")
