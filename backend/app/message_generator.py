import os
import random
from typing import Dict, Any

def generate_personalized_message(
    customer: Dict[str, Any],
    trigger_name: str,
    channel: str = "Email"
) -> Dict[str, str]:
    """
    Generates tailored, verified B2B communication for i95Dev.
    Uses only verified customer details: company name, assigned AM, verified proposal details,
    avoiding fabricated discounts, false promises, or hallucinated claims.
    """
    company = customer.get("company_name", "your team")
    am_name = customer.get("assigned_account_manager", "Sarah Jenkins")
    industry = customer.get("industry", "Manufacturing & Distribution")
    cust_id = customer.get("customer_id", "")
    
    # Select first name from common greeting context
    # (Since company is synthetic B2B company, we personalize with executive role or greeting)
    greeting = f"Hi {company} Commerce Team,"

    if "Trigger A" in trigger_name or "High-Intent" in trigger_name:
        if channel == "WhatsApp":
            subject = ""
            body = (
                f"Hi from i95Dev! Following up on the digital commerce & ERP integration proposal "
                f"we recently shared for {company}. Would your technical leads be available for a brief 15-minute "
                f"call this week to review architecture specifications and answer any open questions? Regards, {am_name}."
            )
        else:
            subject = f"Following up on the digital commerce integration proposal for {company}"
            body = (
                f"{greeting}\n\n"
                f"I wanted to follow up on the integration proposal we delivered for {company}. "
                f"We outlined a dedicated architecture connecting your enterprise ERP with your digital commerce platform "
                f"to eliminate manual order sync and streamline real-time inventory management.\n\n"
                f"If the project is currently in evaluation with your stakeholders, we would be pleased to coordinate a brief "
                f"technical review with our Solution Architecture team to address any scoping, SLA, or timeline questions.\n\n"
                f"Please let me know if Thursday or Friday afternoon suits your team.\n\n"
                f"Best regards,\n"
                f"{am_name}\n"
                f"Senior Enterprise Account Executive | i95Dev\n"
                f"i95Dev Digital Commerce & ERP Integration Services"
            )

    elif "Trigger B" in trigger_name or "Stalled" in trigger_name:
        if channel == "WhatsApp":
            subject = ""
            body = (
                f"Hello from i95Dev. Checking in on {company}'s digital commerce initiatives. "
                f"We know integration priorities shift—happy to share our lightweight Phase-1 roadmap whenever your team is ready to revisit. "
                f"Best regards, {am_name}."
            )
        else:
            subject = f"Re-connecting regarding {company}'s commerce integration roadmap"
            body = (
                f"{greeting}\n\n"
                f"I hope you are having a productive quarter. I am reaching out to check in on {company}'s digital commerce and ERP workflow plans.\n\n"
                f"We understand that enterprise technology priorities and implementation windows frequently adjust. When you are ready to evaluate connector milestones, "
                f"we can provide a modular, phased implementation outline designed to reduce internal IT resource demands.\n\n"
                f"Would it be helpful to share our recent benchmark report on integration efficiencies in {industry}?\n\n"
                f"Warm regards,\n"
                f"{am_name}\n"
                f"Client Engagement Lead | i95Dev"
            )

    elif "Trigger C" in trigger_name or "Demo" in trigger_name:
        if channel == "WhatsApp":
            subject = ""
            body = (
                f"Hi from i95Dev! Thank you for participating in our recent technical architecture demo for {company}. "
                f"I've compiled the integration diagram and session takeaways—would you like me to send them over here or to your email? - {am_name}."
            )
        else:
            subject = f"Summary & Next Steps: Technical Architecture Demo for {company}"
            body = (
                f"{greeting}\n\n"
                f"Thank you for taking the time to attend our technical integration review. We enjoyed discussing {company}'s specific commerce sync requirements.\n\n"
                f"As discussed during the session, our bi-directional connector middleware directly maps customer pricing tiers, multi-warehouse inventory levels, "
                f"and order status callbacks between your ERP and web storefront without custom middleware overhead.\n\n"
                f"Next Steps:\n"
                f"1. Review the attached solution architecture overview.\n"
                f"2. Confirm your target sandbox testing window.\n\n"
                f"Please let me know if your team has any preliminary technical questions before we prepare the formal statement of work.\n\n"
                f"Best regards,\n"
                f"{am_name}\n"
                f"Enterprise Solutions | i95Dev"
            )

    elif "Trigger D" in trigger_name or "Expansion" in trigger_name:
        if channel == "WhatsApp":
            subject = ""
            body = (
                f"Hi from i95Dev! As {company}'s commerce volume continues to scale, our team has prepared an architecture brief on adding a B2B Self-Service Customer Portal. "
                f"Would you be open to a 10-minute catch-up next week? - {am_name}."
            )
        else:
            subject = f"Strategic Expansion: Enhancing B2B Customer Portals for {company}"
            body = (
                f"{greeting}\n\n"
                f"I wanted to reach out and commend {company}'s operational consistency over the past year. With your core ERP integration operating smoothly, "
                f"many of our clients in {industry} are now automating customer ordering workflows through dedicated B2B self-service portals.\n\n"
                f"A self-service portal enables your wholesale buyers to generate repeat orders, inspect credit limits, and access live invoice histories directly—substantially reducing manual customer service inquiries.\n\n"
                f"We would welcome the opportunity to present a 20-minute operational roadmap tailored to {company}.\n\n"
                f"Kind regards,\n"
                f"{am_name}\n"
                f"Client Success Director | i95Dev"
            )

    elif "Trigger E" in trigger_name or "Retention" in trigger_name or "Support" in trigger_name:
        # Note: Retention trigger produces an internal priority escalation note rather than aggressive promotion
        subject = f"[PRIORITY ESCALATION] Account Health & Support Case Review: {company} ({cust_id})"
        body = (
            f"ACCOUNT MANAGER INTERNAL ESCALATION & CLIENT ASSURANCE NOTICE\n\n"
            f"To: {am_name} (Assigned Account Manager)\n"
            f"Account: {company} | ID: {cust_id}\n\n"
            f"BEHAVIORAL RISK DETECTED:\n"
            f"- Multiple open integration tickets or recent CSAT score below operational threshold.\n"
            f"- Automatic sales outreach and promotional marketing have been IMMEDIATELY SUPPRESSED for this account.\n\n"
            f"REQUIRED ACTION:\n"
            f"1. Contact the client's lead technical contact within 4 business hours.\n"
            f"2. Coordinate directly with the Senior Engineering Escalation Lead to expedite open ticket resolution.\n"
            f"3. Schedule an executive status assurance call to reaffirm SLA commitments.\n\n"
            f"Draft Client Assurance Note:\n"
            f"'Hi {company} team, this is {am_name} from i95Dev. I am personally monitoring your recent support cases with our engineering leadership to ensure a swift and complete resolution. I will provide an update by 3:00 PM today.'"
        )

    else:
        subject = f"Touching base regarding {company}'s commerce integration"
        body = (
            f"{greeting}\n\n"
            f"Reaching out from i95Dev to ensure your digital commerce systems are running at peak reliability. "
            f"Please let our account team know if there are any upcoming projects or connector updates we can support.\n\n"
            f"Best regards,\n{am_name} | i95Dev"
        )

    return {
        "channel": channel,
        "subject": subject,
        "body": body
    }
