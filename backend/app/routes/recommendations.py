from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from app.clustering import get_current_clustering
from app.llm_intelligence import generate_segment_recommendations
from app.database import get_db_connection

router = APIRouter(prefix="/api/recommendations", tags=["Recommendations"])

@router.get("/segments")
def get_segment_recommendations():
    clustering = get_current_clustering()
    clusters = clustering.get("clusters", [])
    
    recommendations = []
    for c in clusters:
        rec = generate_segment_recommendations(c)
        recommendations.append(rec)
        
    return {
        "k": clustering.get("k", 5),
        "silhouette_score": clustering.get("silhouette_score", 0),
        "recommendations": recommendations
    }

@router.get("/customer/{customer_id}")
def get_customer_recommendation(customer_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cust = cursor.execute(
        "SELECT * FROM customer_analytical_features WHERE customer_id = ?",
        (customer_id,)
    ).fetchone()
    conn.close()

    if not cust:
        raise HTTPException(status_code=404, detail="Customer not found")

    c_dict = dict(cust)
    c_label = c_dict.get("cluster_label", "")

    # Supporting evidence
    evidence = [
        f"Assigned Behavioral Segment: {c_label}",
        f"Lifetime Realized Billings: ${c_dict['total_revenue']:,.2f}",
        f"Current Open Pipeline: ${c_dict['open_pipeline_value']:,.2f}",
        f"Engagement Score: {c_dict['engagement_score']}/100 (Recency: {c_dict['days_since_last_interaction']:.0f} days ago)",
        f"Email Response Rate: {c_dict['email_response_rate']*100:.1f}%",
        f"Support Service Record: {c_dict['open_ticket_count']} open tickets, {c_dict['avg_csat_score']:.1f}/5.0 CSAT rating",
        f"Retention Risk Score: {c_dict['retention_risk_score']}/100"
    ]

    if "High-Intent" in c_label:
        rec = {
            "customer_id": customer_id,
            "company_name": c_dict["company_name"],
            "recommended_action": "Execute Proposal Follow-Up & Technical Q&A Session",
            "reason_for_recommendation": f"Customer has an active proposal of ${c_dict['open_pipeline_value']:,.2f} and responds promptly. Reaching out now accelerates time-to-close.",
            "expected_objective": "Secure technical sign-off and schedule SOW contract finalization.",
            "suggested_channel": c_dict["preferred_channel"],
            "suggested_timing": "Within 48 hours",
            "confidence_score": 0.94,
            "supporting_evidence": evidence
        }
    elif "Stalled" in c_label:
        rec = {
            "customer_id": customer_id,
            "company_name": c_dict["company_name"],
            "recommended_action": "Send Consultative Low-Pressure Architecture Overview",
            "reason_for_recommendation": f"Account has been idle for {c_dict['days_since_last_interaction']:.0f} days with open pipeline. A low-friction value touchpoint reactivates interest.",
            "expected_objective": "Re-establish active communication without triggering opt-out friction.",
            "suggested_channel": "WhatsApp" if c_dict["consent_whatsapp"] else "Email",
            "suggested_timing": "This week during working hours",
            "confidence_score": 0.82,
            "supporting_evidence": evidence
        }
    elif "Retention" in c_label:
        rec = {
            "customer_id": customer_id,
            "company_name": c_dict["company_name"],
            "recommended_action": "SUPPRESS SALES & Escalate Open Tickets to Engineering Lead",
            "reason_for_recommendation": f"Account has {c_dict['open_ticket_count']} open tickets and low satisfaction. Selling now risks contract cancellation.",
            "expected_objective": "Restore technical confidence and resolve open tickets within 24 hours.",
            "suggested_channel": "Direct Phone Call by Account Manager",
            "suggested_timing": "Immediate (Within 4 hours)",
            "confidence_score": 0.98,
            "supporting_evidence": evidence
        }
    elif "Growth" in c_label or "Expansion" in c_label:
        rec = {
            "customer_id": customer_id,
            "company_name": c_dict["company_name"],
            "recommended_action": "Introduce B2B Customer Portal & Self-Service Ordering Module",
            "reason_for_recommendation": f"Account has high trust (${c_dict['total_revenue']:,.2f} billing, {c_dict['avg_csat_score']:.1f} CSAT). Ready for next tier commerce capability.",
            "expected_objective": "Expand annual contract value by adding self-service portal licensing.",
            "suggested_channel": "Email from Account Manager",
            "suggested_timing": "Next quarterly review window",
            "confidence_score": 0.89,
            "supporting_evidence": evidence
        }
    else:
        rec = {
            "customer_id": customer_id,
            "company_name": c_dict["company_name"],
            "recommended_action": "Maintain Standard Account Health Monitoring",
            "reason_for_recommendation": "Account is stable without immediate pipeline velocity or retention risk.",
            "expected_objective": "Ensure steady operational satisfaction.",
            "suggested_channel": c_dict["preferred_channel"],
            "suggested_timing": "Next monthly check-in",
            "confidence_score": 0.75,
            "supporting_evidence": evidence
        }

    return rec
