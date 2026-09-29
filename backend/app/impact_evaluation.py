import os
import sqlite3
import numpy as np
import pandas as pd
from typing import Dict, Any, List
from app.database import get_db_connection

def evaluate_business_impact() -> Dict[str, Any]:
    """
    Simulates and compares:
    1. Baseline Strategy: Broad firmographic segmentation & generic manual follow-ups
    2. Proposed Strategy: AI-driven behavioral segmentation & automated trigger-based follow-ups
    Uses reproducible, documented simulation assumptions grounded in the actual database state.
    """
    conn = get_db_connection()
    df_cust = pd.read_sql_query("SELECT * FROM customer_analytical_features", conn)
    conn.close()

    total_accounts = len(df_cust)
    total_pipeline = df_cust['open_pipeline_value'].sum()

    # --- BASELINE STRATEGY SIMULATION ---
    # Assumptions:
    # - Sales team manually targets based on broad Industry or Company Size
    # - Follow-up delay is high and inconsistent (average 14 days)
    # - Coverage is limited by manual capacity (~38% of accounts contacted)
    # - Generic message without behavioral personalization leads to lower response rate (~18%)
    # - Conversion rate on generic outreach is ~8.5%
    # - Higher friction and opt-outs due to untargeted blasts (~5.2% opt-out)
    np.random.seed(42)
    baseline_coverage_rate = 0.38
    baseline_accounts_targeted = int(total_accounts * baseline_coverage_rate)
    baseline_avg_days_to_touch = 14.5
    baseline_messages_sent = baseline_accounts_targeted * 2 # 2 messages per covered account
    baseline_response_rate = 18.2
    baseline_conversion_rate = 8.5
    baseline_opt_out_rate = 5.2

    # Simulated pipeline captured by baseline
    baseline_converted_accounts = int(baseline_accounts_targeted * (baseline_conversion_rate / 100.0))
    # Randomly sampled from accounts with pipeline
    pipeline_eligible = df_cust[df_cust['open_pipeline_value'] > 0]
    sample_baseline_vals = pipeline_eligible['open_pipeline_value'].sample(
        min(baseline_converted_accounts, len(pipeline_eligible)),
        random_state=42
    )
    baseline_pipeline_converted = float(sample_baseline_vals.sum())
    baseline_workload_efficiency = round(baseline_pipeline_converted / max(baseline_messages_sent, 1), 2)
    baseline_opt_outs = int(baseline_messages_sent * (baseline_opt_out_rate / 100.0))

    # --- PROPOSED BEHAVIORAL AI STRATEGY SIMULATION ---
    # Assumptions:
    # - Automated triggers identify 100% of accounts meeting behavioral criteria (High-Intent, Stalled, Expansion)
    # - Rapid follow-up within 2 to 3 days (average 2.8 days)
    # - Coverage is focused and behavioral (~64% of qualified accounts contacted with high relevance)
    # - Differentiated, verified messaging drives higher response rate (~44.8%)
    # - Conversion rate increases to ~24.5% due to timely proposal follow-up and objection mitigation
    # - Opt-outs suppressed through consent checks and suppression lists (~1.4% opt-out)
    proposed_coverage_rate = 0.64
    proposed_accounts_targeted = int(total_accounts * proposed_coverage_rate)
    proposed_avg_days_to_touch = 2.8
    # Behavioral targeting is more efficient: fewer wasted messages
    proposed_messages_sent = int(proposed_accounts_targeted * 1.5)
    proposed_response_rate = 44.8
    proposed_conversion_rate = 24.5
    proposed_opt_out_rate = 1.4

    proposed_converted_accounts = int(proposed_accounts_targeted * (proposed_conversion_rate / 100.0))
    # High-intent and expansion accounts prioritized
    high_intent_pool = df_cust[df_cust['cluster_label'].str.contains('High-Intent|Expansion', case=False, na=False)]
    if len(high_intent_pool) >= proposed_converted_accounts:
        sample_proposed_vals = high_intent_pool['open_pipeline_value'].sample(
            proposed_converted_accounts, random_state=42
        )
    else:
        sample_proposed_vals = pipeline_eligible['open_pipeline_value'].sample(
            min(proposed_converted_accounts, len(pipeline_eligible)), random_state=42
        )
    proposed_pipeline_converted = float(sample_proposed_vals.sum())
    proposed_workload_efficiency = round(proposed_pipeline_converted / max(proposed_messages_sent, 1), 2)
    proposed_opt_outs = int(proposed_messages_sent * (proposed_opt_out_rate / 100.0))

    # Segment-level Conversion Breakdown for Proposed Strategy
    seg_breakdown = []
    for label, group in df_cust.groupby('cluster_label'):
        cnt = len(group)
        pipe = float(group['open_pipeline_value'].sum())
        
        if "High-Intent" in label:
            c_rate = 34.0
            r_rate = 58.0
        elif "Expansion" in label:
            c_rate = 28.0
            r_rate = 42.0
        elif "Growth" in label:
            c_rate = 22.0
            r_rate = 65.0
        elif "Stalled" in label:
            c_rate = 14.5
            r_rate = 26.0
        else:
            c_rate = 4.0
            r_rate = 12.0

        seg_breakdown.append({
            "segment": label,
            "account_count": cnt,
            "pipeline_value": pipe,
            "simulated_response_rate": r_rate,
            "simulated_conversion_rate": c_rate,
            "simulated_converted_pipeline": round(pipe * (c_rate / 100.0), 2)
        })

    return {
        "disclaimer": "Synthetic simulation results demonstrate system capability and mathematical differentiation; they do not represent unverified real-world i95Dev operations or causal claims without a live randomized trial.",
        "summary": {
            "total_accounts_analyzed": total_accounts,
            "total_available_pipeline": total_pipeline,
            "lift_conversion_rate_percentage_points": round(proposed_conversion_rate - baseline_conversion_rate, 1),
            "lift_pipeline_value": round(proposed_pipeline_converted - baseline_pipeline_converted, 2),
            "time_to_touch_reduction_days": round(baseline_avg_days_to_touch - proposed_avg_days_to_touch, 1),
            "opt_out_reduction_percentage_points": round(baseline_opt_out_rate - proposed_opt_out_rate, 1)
        },
        "comparison_metrics": [
            {
                "metric": "Follow-Up Coverage",
                "baseline": f"{baseline_coverage_rate * 100:.1f}% ({baseline_accounts_targeted} accounts)",
                "proposed": f"{proposed_coverage_rate * 100:.1f}% ({proposed_accounts_targeted} accounts)",
                "delta": f"+{(proposed_coverage_rate - baseline_coverage_rate)*100:.1f}%",
                "higher_is_better": True
            },
            {
                "metric": "Average Time to Follow-Up",
                "baseline": f"{baseline_avg_days_to_touch} days",
                "proposed": f"{proposed_avg_days_to_touch} days",
                "delta": f"-{baseline_avg_days_to_touch - proposed_avg_days_to_touch:.1f} days",
                "higher_is_better": False
            },
            {
                "metric": "Simulated Response Rate",
                "baseline": f"{baseline_response_rate}%",
                "proposed": f"{proposed_response_rate}%",
                "delta": f"+{proposed_response_rate - baseline_response_rate:.1f}%",
                "higher_is_better": True
            },
            {
                "metric": "Simulated Conversion Rate",
                "baseline": f"{baseline_conversion_rate}%",
                "proposed": f"{proposed_conversion_rate}%",
                "delta": f"+{proposed_conversion_rate - baseline_conversion_rate:.1f}%",
                "higher_is_better": True
            },
            {
                "metric": "Converted Pipeline Value",
                "baseline": f"${baseline_pipeline_converted:,.0f}",
                "proposed": f"${proposed_pipeline_converted:,.0f}",
                "delta": f"+${proposed_pipeline_converted - baseline_pipeline_converted:,.0f}",
                "higher_is_better": True
            },
            {
                "metric": "Message Volume (Workload)",
                "baseline": f"{baseline_messages_sent:,} generic messages",
                "proposed": f"{proposed_messages_sent:,} targeted messages",
                "delta": f"{proposed_messages_sent - baseline_messages_sent:+,} messages",
                "higher_is_better": False
            },
            {
                "metric": "Workload Efficiency ($ Converted / Message)",
                "baseline": f"${baseline_workload_efficiency:,.2f}",
                "proposed": f"${proposed_workload_efficiency:,.2f}",
                "delta": f"+${proposed_workload_efficiency - baseline_workload_efficiency:,.2f}",
                "higher_is_better": True
            },
            {
                "metric": "Opt-Out / Suppression Rate",
                "baseline": f"{baseline_opt_out_rate}% ({baseline_opt_outs} accounts)",
                "proposed": f"{proposed_opt_out_rate}% ({proposed_opt_outs} accounts)",
                "delta": f"-{baseline_opt_out_rate - proposed_opt_out_rate:.1f}%",
                "higher_is_better": False
            }
        ],
        "segment_breakdown": seg_breakdown
    }

if __name__ == "__main__":
    res = evaluate_business_impact()
    print("Business Impact Evaluation complete:")
    for m in res["comparison_metrics"]:
        print(f" - {m['metric']}: Baseline={m['baseline']} vs Proposed={m['proposed']} (Delta: {m['delta']})")
