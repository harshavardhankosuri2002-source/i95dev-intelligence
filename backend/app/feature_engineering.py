import os
import sqlite3
import pandas as pd
import numpy as np
from datetime import datetime
from app.database import get_db_connection

def build_analytical_features():
    conn = get_db_connection()
    
    # 1. Fetch Master Customers
    df_customers = pd.read_sql_query("SELECT * FROM customers", conn)
    
    # 2. Transactions aggregation
    df_trans = pd.read_sql_query("SELECT * FROM transactions", conn)
    if not df_trans.empty:
        df_trans['transaction_date'] = pd.to_datetime(df_trans['transaction_date'])
        base_date = pd.to_datetime('2026-09-29')
        df_trans['days_ago'] = (base_date - df_trans['transaction_date']).dt.days
        
        # Calculate renewal proximity if renewal_date exists
        df_trans['renewal_date_dt'] = pd.to_datetime(df_trans['renewal_date'])
        df_trans['renewal_proximity'] = (df_trans['renewal_date_dt'] - base_date).dt.days
        
        trans_agg = df_trans.groupby('customer_id').agg(
            total_revenue=('project_value', 'sum'),
            avg_project_value=('project_value', 'mean'),
            transaction_count=('transaction_id', 'count'),
            repeat_purchase_count=('repeat_purchase_count', 'max'),
            days_since_last_purchase=('days_ago', 'min'),
            renewal_proximity_days=('renewal_proximity', lambda x: x.dropna().min() if not x.dropna().empty else None)
        ).reset_index()
    else:
        trans_agg = pd.DataFrame(columns=[
            'customer_id', 'total_revenue', 'avg_project_value', 'transaction_count',
            'repeat_purchase_count', 'days_since_last_purchase', 'renewal_proximity_days'
        ])

    # 3. Sales interactions aggregation
    df_inter = pd.read_sql_query("SELECT * FROM sales_interactions", conn)
    if not df_inter.empty:
        inter_agg = df_inter.groupby('customer_id').agg(
            total_interactions=('interaction_id', 'count'),
            days_since_last_interaction=('days_since_last_interaction', 'min'),
            email_responses=('email_response', 'sum'),
            meetings_attended=('meeting_attended', 'sum'),
            demos_attended=('demo_attended', 'sum'),
            proposals_sent=('proposal_sent', 'sum')
        ).reset_index()
        
        # Rates
        inter_agg['email_response_rate'] = (inter_agg['email_responses'] / inter_agg['total_interactions']).round(3)
        inter_agg['meeting_attendance_rate'] = (inter_agg['meetings_attended'] / inter_agg['total_interactions']).round(3)
        inter_agg['demo_attendance_rate'] = (inter_agg['demos_attended'] / inter_agg['total_interactions']).round(3)
        inter_agg['proposal_count'] = inter_agg['proposals_sent']
    else:
        inter_agg = pd.DataFrame(columns=[
            'customer_id', 'total_interactions', 'days_since_last_interaction',
            'email_response_rate', 'meeting_attendance_rate', 'demo_attendance_rate', 'proposal_count'
        ])

    # 4. Pipeline opportunities aggregation
    df_pipe = pd.read_sql_query("SELECT * FROM pipeline_opportunities", conn)
    if not df_pipe.empty:
        df_pipe['last_act_dt'] = pd.to_datetime(df_pipe['last_activity_date'])
        base_date = pd.to_datetime('2026-09-29')
        df_pipe['days_in_stage'] = (base_date - df_pipe['last_act_dt']).dt.days

        df_pipe_open = df_pipe[df_pipe['outcome'] == 'Open']
        
        pipe_agg = df_pipe.groupby('customer_id').agg(
            highest_sales_stage=('sales_stage', 'last'),
            days_in_current_stage=('days_in_stage', 'min')
        ).reset_index()

        open_pipe_agg = df_pipe_open.groupby('customer_id').agg(
            open_opportunity_count=('opportunity_id', 'count'),
            open_pipeline_value=('opportunity_value', 'sum')
        ).reset_index()

        pipe_agg = pd.merge(pipe_agg, open_pipe_agg, on='customer_id', how='left')
    else:
        pipe_agg = pd.DataFrame(columns=[
            'customer_id', 'highest_sales_stage', 'days_in_current_stage',
            'open_opportunity_count', 'open_pipeline_value'
        ])

    # 5. Support tickets aggregation
    df_supp = pd.read_sql_query("SELECT * FROM support_tickets", conn)
    if not df_supp.empty:
        supp_agg = df_supp.groupby('customer_id').agg(
            support_ticket_count=('ticket_id', 'count'),
            open_ticket_count=('ticket_status', lambda x: (x.isin(['In Progress', 'Escalated'])).sum()),
            avg_resolution_time_hours=('resolution_time_hours', 'mean'),
            avg_csat_score=('customer_satisfaction', 'mean'),
            high_priority_ticket_count=('priority', lambda x: (x.isin(['Critical', 'High'])).sum())
        ).reset_index()
    else:
        supp_agg = pd.DataFrame(columns=[
            'customer_id', 'support_ticket_count', 'open_ticket_count',
            'avg_resolution_time_hours', 'avg_csat_score', 'high_priority_ticket_count'
        ])

    # Merge everything into df_features
    df = df_customers.merge(trans_agg, on='customer_id', how='left')
    df = df.merge(inter_agg, on='customer_id', how='left')
    df = df.merge(pipe_agg, on='customer_id', how='left')
    df = df.merge(supp_agg, on='customer_id', how='left')

    # Impute missing values with business logic
    df['total_revenue'] = df['total_revenue'].fillna(0.0).round(2)
    df['avg_project_value'] = df['avg_project_value'].fillna(0.0).round(2)
    df['transaction_count'] = df['transaction_count'].fillna(0).astype(int)
    df['repeat_purchase_count'] = df['repeat_purchase_count'].fillna(0).astype(int)
    df['days_since_last_purchase'] = df['days_since_last_purchase'].fillna(999.0)
    df['renewal_proximity_days'] = df['renewal_proximity_days'].fillna(999.0)

    df['total_interactions'] = df['total_interactions'].fillna(0).astype(int)
    df['days_since_last_interaction'] = df['days_since_last_interaction'].fillna(180.0)
    df['email_response_rate'] = df['email_response_rate'].fillna(0.0)
    df['meeting_attendance_rate'] = df['meeting_attendance_rate'].fillna(0.0)
    df['demo_attendance_rate'] = df['demo_attendance_rate'].fillna(0.0)
    df['proposal_count'] = df['proposal_count'].fillna(0).astype(int)

    df['open_opportunity_count'] = df['open_opportunity_count'].fillna(0).astype(int)
    df['open_pipeline_value'] = df['open_pipeline_value'].fillna(0.0).round(2)
    df['highest_sales_stage'] = df['highest_sales_stage'].fillna('None')
    df['days_in_current_stage'] = df['days_in_current_stage'].fillna(0.0)

    df['support_ticket_count'] = df['support_ticket_count'].fillna(0).astype(int)
    df['open_ticket_count'] = df['open_ticket_count'].fillna(0).astype(int)
    df['avg_resolution_time_hours'] = df['avg_resolution_time_hours'].fillna(24.0).round(1)
    df['avg_csat_score'] = df['avg_csat_score'].fillna(4.5).round(2) # Default high for customers with no issues
    df['high_priority_ticket_count'] = df['high_priority_ticket_count'].fillna(0).astype(int)

    # Composite Engagement Score (0 - 100)
    # Recency component: max 30 pts (linear decay from 0 to 60 days)
    recency_pts = np.clip(30.0 * (1.0 - (df['days_since_last_interaction'] / 60.0)), 0, 30)
    # Response rate: max 30 pts
    resp_pts = df['email_response_rate'] * 30.0
    # Attendance & volume: max 40 pts
    att_pts = (df['meeting_attendance_rate'] * 20.0) + np.clip(df['total_interactions'] * 2.0, 0, 20.0)
    df['engagement_score'] = (recency_pts + resp_pts + att_pts).clip(0, 100).round(1)

    # Composite Retention Risk Score (0 - 100)
    # Open tickets factor: up to 35 pts
    ticket_risk = np.clip(df['open_ticket_count'] * 12.0 + df['high_priority_ticket_count'] * 8.0, 0, 35)
    # Low CSAT factor: up to 35 pts (if CSAT < 4.0)
    csat_risk = np.clip((4.5 - df['avg_csat_score']) * 14.0, 0, 35)
    # Disengagement risk: up to 30 pts if days_since_last_interaction > 30 for active clients
    diseng_risk = np.where(
        (df['account_type'] == 'Active Client') & (df['days_since_last_interaction'] > 30),
        np.clip((df['days_since_last_interaction'] - 30) * 0.75, 0, 30),
        0.0
    )
    df['retention_risk_score'] = (ticket_risk + csat_risk + diseng_risk).clip(0, 100).round(1)

    # Firmographic segment baseline
    df['firmographic_segment'] = df['industry'] + " (" + df['company_size'] + ")"

    # Store back to SQLite
    cursor = conn.cursor()
    cursor.execute("DELETE FROM customer_analytical_features")

    insert_cols = [
        'customer_id', 'company_name', 'industry', 'company_size', 'region',
        'account_type', 'account_status', 'assigned_account_manager',
        'consent_email', 'consent_whatsapp', 'preferred_channel',
        'total_revenue', 'avg_project_value', 'transaction_count',
        'repeat_purchase_count', 'days_since_last_purchase', 'renewal_proximity_days',
        'total_interactions', 'days_since_last_interaction', 'email_response_rate',
        'meeting_attendance_rate', 'demo_attendance_rate', 'proposal_count',
        'open_opportunity_count', 'open_pipeline_value', 'highest_sales_stage',
        'days_in_current_stage', 'support_ticket_count', 'open_ticket_count',
        'avg_resolution_time_hours', 'avg_csat_score', 'high_priority_ticket_count',
        'engagement_score', 'retention_risk_score', 'firmographic_segment'
    ]

    records = df[insert_cols].to_dict(orient='records')
    placeholders = ", ".join(["?" for _ in insert_cols])
    col_names = ", ".join(insert_cols)

    cursor.executemany(f'''
    INSERT INTO customer_analytical_features ({col_names})
    VALUES ({placeholders})
    ''', [tuple(r[c] for c in insert_cols) for r in records])

    conn.commit()
    conn.close()
    print(f"Engineered analytical features for {len(df)} accounts.")
    return df

if __name__ == "__main__":
    build_analytical_features()
