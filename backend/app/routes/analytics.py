from fastapi import APIRouter, Query
from typing import Optional, Dict, Any, List
import pandas as pd
from app.database import get_db_connection

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("/executive")
def get_executive_overview(
    region: Optional[str] = None,
    industry: Optional[str] = None,
    account_manager: Optional[str] = None
):
    conn = get_db_connection()
    df_cust = pd.read_sql_query("SELECT * FROM customer_analytical_features", conn)
    df_pipe = pd.read_sql_query("SELECT * FROM pipeline_opportunities", conn)
    df_logs = pd.read_sql_query("SELECT * FROM message_campaign_logs", conn)
    conn.close()

    # Apply filters
    if region:
        df_cust = df_cust[df_cust['region'] == region]
    if industry:
        df_cust = df_cust[df_cust['industry'] == industry]
    if account_manager:
        df_cust = df_cust[df_cust['assigned_account_manager'] == account_manager]

    total_accounts = len(df_cust)
    if total_accounts == 0:
        return {"error": "No accounts match current filters."}

    qualified_prospects = len(df_cust[df_cust['account_type'] == 'Prospect'])
    open_pipeline_val = float(df_cust['open_pipeline_value'].sum())
    total_revenue = float(df_cust['total_revenue'].sum())
    avg_project_val = float(df_cust[df_cust['avg_project_value'] > 0]['avg_project_value'].mean() or 0)
    
    # Filter customer ids for messages
    cust_ids = set(df_cust['customer_id'])
    df_logs_filtered = df_logs[df_logs['customer_id'].isin(cust_ids)]

    sim_followups_count = len(df_logs_filtered)
    sim_replied = len(df_logs_filtered[df_logs_filtered['simulated_status'].isin(['Replied (simulated)', 'Converted (simulated)'])])
    sim_converted = len(df_logs_filtered[df_logs_filtered['simulated_status'] == 'Converted (simulated)'])

    response_rate = round((sim_replied / sim_followups_count * 100), 1) if sim_followups_count > 0 else 0.0
    conversion_rate = round((sim_converted / sim_followups_count * 100), 1) if sim_followups_count > 0 else 0.0

    # Accounts requiring attention (retention risk >= 35 or days without touch >= 45 with open pipeline)
    attention_df = df_cust[
        (df_cust['retention_risk_score'] >= 35.0) |
        ((df_cust['open_pipeline_value'] > 0) & (df_cust['days_since_last_interaction'] >= 30.0))
    ]
    attention_count = len(attention_df)

    # Segment distribution
    seg_dist = []
    for label, group in df_cust.groupby('cluster_label'):
        seg_dist.append({
            "name": label,
            "count": len(group),
            "percentage": round(len(group) / total_accounts * 100, 1),
            "pipeline": round(float(group['open_pipeline_value'].sum()), 2),
            "revenue": round(float(group['total_revenue'].sum()), 2)
        })

    # Region breakdown
    reg_dist = []
    for reg, group in df_cust.groupby('region'):
        reg_dist.append({
            "region": reg,
            "accounts": len(group),
            "pipeline": round(float(group['open_pipeline_value'].sum()), 2)
        })

    # Open opportunities count
    open_opps_count = int(df_cust['open_opportunity_count'].sum())

    return {
        "total_accounts": total_accounts,
        "qualified_prospects": qualified_prospects,
        "open_opportunities_count": open_opps_count,
        "total_pipeline_value": round(open_pipeline_val, 2),
        "total_revenue": round(total_revenue, 2),
        "average_project_value": round(avg_project_val, 2),
        "simulated_followup_count": sim_followups_count,
        "simulated_response_rate": response_rate,
        "simulated_conversion_rate": conversion_rate,
        "accounts_requiring_attention": attention_count,
        "segment_distribution": seg_dist,
        "region_distribution": reg_dist,
        "top_attention_accounts": attention_df[['customer_id', 'company_name', 'cluster_label', 'retention_risk_score', 'open_pipeline_value', 'days_since_last_interaction', 'assigned_account_manager']].head(8).to_dict(orient='records')
    }

@router.get("/campaigns")
def get_campaign_analytics():
    conn = get_db_connection()
    df_logs = pd.read_sql_query("SELECT * FROM message_campaign_logs", conn)
    df_cust = pd.read_sql_query("SELECT customer_id, cluster_label, industry FROM customer_analytical_features", conn)
    conn.close()

    total_logs = len(df_logs)
    if total_logs == 0:
        return {"total_messages": 0}

    # Merge cluster label
    df_logs = df_logs.merge(df_cust, on='customer_id', how='left')

    sent = len(df_logs[df_logs['simulated_status'].isin(['Sent (simulated)', 'Replied (simulated)', 'Converted (simulated)'])])
    replied = len(df_logs[df_logs['simulated_status'].isin(['Replied (simulated)', 'Converted (simulated)'])])
    converted = len(df_logs[df_logs['simulated_status'] == 'Converted (simulated)'])
    suppressed = len(df_logs[df_logs['simulated_status'] == 'Suppressed'])
    opted_out = len(df_logs[df_logs['opt_out_status'] == 1])

    # Positive replies
    positive_replies = len(df_logs[df_logs['simulated_reply'].str.contains('Positive', case=False, na=False)])

    delivery_rate = round(sent / total_logs * 100, 1)
    response_rate = round(replied / sent * 100, 1) if sent > 0 else 0
    positive_response_rate = round(positive_replies / replied * 100, 1) if replied > 0 else 0
    conversion_rate = round(converted / sent * 100, 1) if sent > 0 else 0

    # Channel comparison
    channel_comp = []
    for ch, group in df_logs.groupby('channel'):
        ch_sent = len(group[group['simulated_status'].isin(['Sent (simulated)', 'Replied (simulated)', 'Converted (simulated)'])])
        ch_rep = len(group[group['simulated_status'].isin(['Replied (simulated)', 'Converted (simulated)'])])
        ch_conv = len(group[group['simulated_status'] == 'Converted (simulated)'])
        channel_comp.append({
            "channel": ch,
            "total_queued": len(group),
            "sent": ch_sent,
            "replied": ch_rep,
            "response_rate": round(ch_rep / max(ch_sent, 1) * 100, 1),
            "converted": ch_conv,
            "conversion_rate": round(ch_conv / max(ch_sent, 1) * 100, 1)
        })

    # Trigger breakdown
    trigger_comp = []
    for trig, group in df_logs.groupby('trigger_reason'):
        t_sent = len(group[group['simulated_status'].isin(['Sent (simulated)', 'Replied (simulated)', 'Converted (simulated)'])])
        t_rep = len(group[group['simulated_status'].isin(['Replied (simulated)', 'Converted (simulated)'])])
        t_conv = len(group[group['simulated_status'] == 'Converted (simulated)'])
        trigger_comp.append({
            "trigger": trig,
            "messages_sent": t_sent,
            "replies": t_rep,
            "response_rate": round(t_rep / max(t_sent, 1) * 100, 1),
            "conversions": t_conv,
            "conversion_rate": round(t_conv / max(t_sent, 1) * 100, 1)
        })

    # Segment-level campaign comparison
    segment_comp = []
    for seg, group in df_logs.groupby('cluster_label'):
        if pd.isna(seg):
            continue
        s_sent = len(group[group['simulated_status'].isin(['Sent (simulated)', 'Replied (simulated)', 'Converted (simulated)'])])
        s_rep = len(group[group['simulated_status'].isin(['Replied (simulated)', 'Converted (simulated)'])])
        s_conv = len(group[group['simulated_status'] == 'Converted (simulated)'])
        segment_comp.append({
            "segment": seg,
            "messages_sent": s_sent,
            "replies": s_rep,
            "response_rate": round(s_rep / max(s_sent, 1) * 100, 1),
            "conversions": s_conv,
            "conversion_rate": round(s_conv / max(s_sent, 1) * 100, 1)
        })

    # Performance over time (by week/month)
    df_logs['date'] = pd.to_datetime(df_logs['scheduled_at']).dt.strftime('%Y-%m-%d')
    timeline = []
    for d, group in df_logs.groupby('date'):
        timeline.append({
            "date": d,
            "messages": len(group),
            "conversions": len(group[group['simulated_status'] == 'Converted (simulated)'])
        })
    timeline = sorted(timeline, key=lambda x: x['date'])[-14:] # Last 14 days active

    return {
        "summary": {
            "total_messages": total_logs,
            "sent_simulated": sent,
            "replied_simulated": replied,
            "converted_simulated": converted,
            "suppressed": suppressed,
            "opted_out": opted_out,
            "delivery_rate": delivery_rate,
            "response_rate": response_rate,
            "positive_response_rate": positive_response_rate,
            "conversion_rate": conversion_rate
        },
        "channel_comparison": channel_comp,
        "trigger_comparison": trigger_comp,
        "segment_comparison": segment_comp,
        "timeline": timeline
    }
