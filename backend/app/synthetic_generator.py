import os
import random
import json
import sqlite3
from datetime import datetime, timedelta
import numpy as np
import pandas as pd
from app.database import get_db_connection, init_db, DB_PATH

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")

COMPANY_PREFIXES = [
    "Apex", "Vantage", "NexaFlow", "Summit", "Beacon", "Pinnacle", "AcroTech",
    "OmniCore", "Velocity", "Titan", "Sterling", "Horizon", "Dynamic", "Atlas",
    "Precision", "Zenith", "Quantum", "Synergy", "BlueWave", "Catalyst", "Nova",
    "PrimeScale", "Integra", "Falcon", "Trident", "Matrix", "Cobalt", "Ironclad",
    "Stratis", "Luminary", "Vektor", "Crestview", "Starlight", "CoreLogic", "Pioneer",
    "Vanguard", "Silverline", "Aerotech", "Frontier", "ApexPoint", "OmniSys", "Kinetix"
]

COMPANY_MIDDLES = [
    "Industrial", "Commerce", "BioTech", "Logistics", "Digital", "Precision",
    "Medical", "Supply", "Energy", "Materials", "Robotics", "Systems",
    "Global", "Dynamics", "Electronics", "Commercial", "Automotive", "Advanced"
]

COMPANY_SUFFIXES = [
    "Corp", "Inc", "Group", "Solutions", "Holdings", "Enterprises", "Industries",
    "Logistics", "Technologies", "Distribution", "Systems", "Supply Co", "LLC",
    "Components", "Materials", "International", "Partners", "Alliance", "Dynamics"
]

FIRST_NAMES = [
    "Rahul", "Sarah", "Michael", "Elena", "Ananya", "David", "Jessica", "James",
    "Amit", "Emily", "Carlos", "Priya", "Robert", "Chloe", "Alexander", "Hannah",
    "Suresh", "Melissa", "Daniel", "Sofia", "Marcus", "Grace", "Arjun", "Rachel"
]

LAST_NAMES = [
    "Patel", "Vance", "Miller", "Rostova", "Sharma", "Kowalski", "Jenkins", "Tanaka",
    "Gupta", "Campbell", "Mendoza", "Nair", "Schneider", "Brooks", "Li", "O'Connor",
    "Reddy", "Foster", "Kim", "Larsson", "Brody", "Novak", "Kapoor", "Sinclair"
]

INDUSTRIES = [
    "Manufacturing & Industrial",
    "Wholesale & B2B Distribution",
    "Healthcare & Medical Devices",
    "Automotive Aftermarket & Parts",
    "Building Materials & Construction",
    "Consumer Packaged Goods (CPG)",
    "Technology, Electronics & SaaS"
]

COMPANY_SIZES = [
    "SMB (20-99)",
    "Mid-Market (100-499)",
    "Enterprise (500-1999)",
    "Large Enterprise (2000+)"
]

REGIONS = [
    "North America - East",
    "North America - West",
    "North America - Central",
    "Europe - UK & Ireland",
    "Europe - DACH / Nordics",
    "APAC - Australia & NZ"
]

LEAD_SOURCES = [
    "ERP Partner Referral (SAP/Microsoft)",
    "Adobe Summit / Commerce Event",
    "Inbound Organic Search",
    "B2B eCommerce Webinar",
    "Outbound Account-Based Marketing",
    "Technology Ecosystem Directory"
]

ACCOUNT_MANAGERS = [
    "Sarah Jenkins",
    "David Vance",
    "Ananya Sharma",
    "Marcus Brody",
    "Elena Rostova"
]

SERVICE_CATEGORIES = [
    "ERP-eCommerce Bi-directional Integration (SAP / MS Dynamics)",
    "Adobe Commerce / Magento Enterprise Implementation",
    "B2B Customer Portal & Self-Service Ordering Platform",
    "Custom Middleware & Integration Hub Maintenance",
    "B2B Marketplace & Multi-Vendor Architecture",
    "Annual 24/7 Managed Integration & SLA Support"
]

ISSUE_CATEGORIES = [
    "ERP Sync Latency & Queuing Delays",
    "Catalog Webhook Timeout",
    "SSO / Multi-User Auth Handshake",
    "Inventory & Stock Buffer Discrepancy",
    "B2B Tiered Pricing Rule Mismatch",
    "TaxJar / Avalara API Webhook Interruption"
]

def generate_all_synthetic_data(seed: int = 42, count: int = 1000):
    random.seed(seed)
    np.random.seed(seed)
    os.makedirs(DATA_DIR, exist_ok=True)
    init_db()

    conn = get_db_connection()
    cursor = conn.cursor()

    # Clear existing
    for table in [
        "message_campaign_logs", "scheduled_tasks", "pipeline_opportunities",
        "support_tickets", "sales_interactions", "transactions",
        "customer_analytical_features", "customers", "audit_logs"
    ]:
        cursor.execute(f"DELETE FROM {table}")

    base_date = datetime(2026, 9, 29)

    customers = []
    transactions = []
    interactions = []
    tickets = []
    pipeline = []
    campaign_logs = []

    used_company_names = set()

    for i in range(1, count + 1):
        cust_id = f"CUST-{i:04d}"
        
        c_name = f"{random.choice(COMPANY_PREFIXES)} {random.choice(COMPANY_MIDDLES)} {random.choice(COMPANY_SUFFIXES)}"
        if c_name in used_company_names:
            c_name = f"{random.choice(COMPANY_PREFIXES)} {random.choice(COMPANY_SUFFIXES)} #{i}"
        used_company_names.add(c_name)

        industry = random.choice(INDUSTRIES)
        company_size = random.choice(COMPANY_SIZES)
        region = random.choice(REGIONS)
        lead_source = random.choice(LEAD_SOURCES)
        assigned_am = random.choice(ACCOUNT_MANAGERS)

        # Persona:
        # 0: High-intent prospect with active proposal
        # 1: Engaged growth client (repeat buyer, heavy integration user)
        # 2: Stalled opportunity (pipeline open, high days since touch)
        # 3: Expansion client (existing client, potential new portal/ERP service)
        # 4: Retention risk / support strained (open tickets, lower CSAT)
        # 5: Dormant / low engagement prospect
        persona_weights = [0.18, 0.22, 0.18, 0.16, 0.14, 0.12]
        persona = np.random.choice([0, 1, 2, 3, 4, 5], p=persona_weights)

        # Consent and channel
        consent_email = 1 if random.random() < 0.93 else 0
        consent_whatsapp = 1 if random.random() < 0.81 else 0
        preferred_channel = random.choices(["Email", "WhatsApp", "Email"], weights=[0.55, 0.35, 0.10])[0]

        if persona in [1, 3, 4]:
            account_type = "Active Client"
            acq_days_ago = random.randint(180, 1200)
            account_status = "Active" if persona != 4 else random.choice(["Active", "Under Review"])
        elif persona in [0, 2]:
            account_type = "Prospect"
            acq_days_ago = random.randint(30, 240)
            account_status = "Active"
        else:
            account_type = random.choice(["Prospect", "Dormant Client"])
            acq_days_ago = random.randint(100, 500)
            account_status = "Dormant"

        acq_date = (base_date - timedelta(days=acq_days_ago)).strftime("%Y-%m-%d")

        customers.append((
            cust_id, c_name, industry, company_size, region, lead_source,
            account_type, acq_date, assigned_am, consent_email, consent_whatsapp,
            preferred_channel, account_status
        ))

        # --- TRANSACTIONS ---
        num_transactions = 0
        if persona == 1:
            num_transactions = random.randint(3, 7)
        elif persona == 3:
            num_transactions = random.randint(2, 4)
        elif persona == 4:
            num_transactions = random.randint(1, 3)
        elif persona == 0 and random.random() < 0.1:
            num_transactions = 1
        elif persona == 5 and random.random() < 0.15:
            num_transactions = 1

        for tx_idx in range(num_transactions):
            tx_id = f"TX-{i:04d}-{tx_idx+1}"
            tx_days_ago = random.randint(15, min(acq_days_ago, 750))
            tx_date = (base_date - timedelta(days=tx_days_ago)).strftime("%Y-%m-%d")
            service = random.choice(SERVICE_CATEGORIES)
            
            mult = 2.2 if "Large" in company_size else (1.5 if "Enterprise" in company_size else 1.0)
            proj_val = round(random.uniform(25000, 95000) * mult, 2)
            
            contract_status = "Active Retainer" if tx_days_ago < 180 else "Completed"
            renewal_date = (base_date + timedelta(days=random.randint(10, 180))).strftime("%Y-%m-%d") if contract_status == "Active Retainer" else None

            transactions.append((
                tx_id, cust_id, tx_date, service, proj_val, contract_status,
                renewal_date, tx_idx
            ))

        # --- SALES INTERACTIONS ---
        num_interactions = random.randint(2, 10)
        if persona in [0, 1]:
            num_interactions = random.randint(6, 14)
        elif persona == 2:
            num_interactions = random.randint(3, 7)
        elif persona == 5:
            num_interactions = random.randint(1, 4)

        for int_idx in range(num_interactions):
            int_id = f"INT-{i:04d}-{int_idx+1}"
            int_channel = random.choice(["Email", "WhatsApp", "Zoom/Teams", "Phone"])
            int_type = random.choice([
                "Discovery Call", "Technical Architecture Review", "Integration Proposal Review",
                "Pricing Check-in", "Quarterly Account Review", "Product Demo"
            ])

            if persona == 0:
                days_since = random.randint(2, 18)
                email_resp = 1 if random.random() < 0.85 else 0
                meet_att = 1 if random.random() < 0.90 else 0
                demo_att = 1 if random.random() < 0.85 else 0
                prop_sent = 1 if int_idx == num_interactions - 1 else 0
                outcome = "Proposal Delivered" if prop_sent else "Positive - Next Step Scheduled"
            elif persona == 1:
                days_since = random.randint(5, 30)
                email_resp = 1 if random.random() < 0.90 else 0
                meet_att = 1 if random.random() < 0.85 else 0
                demo_att = 1 if random.random() < 0.60 else 0
                prop_sent = 0
                outcome = "Quarterly Review Completed"
            elif persona == 2:
                days_since = random.randint(25, 75)
                email_resp = 1 if random.random() < 0.30 else 0
                meet_att = 1 if random.random() < 0.40 else 0
                demo_att = 1 if random.random() < 0.50 else 0
                prop_sent = 1 if random.random() < 0.60 else 0
                outcome = "Awaiting Client Response"
            elif persona == 4:
                days_since = random.randint(15, 60)
                email_resp = 1 if random.random() < 0.45 else 0
                meet_att = 0 if random.random() < 0.40 else 1
                demo_att = 0
                prop_sent = 0
                outcome = "Escalation Discussed"
            else:
                days_since = random.randint(40, 150)
                email_resp = 1 if random.random() < 0.20 else 0
                meet_att = 1 if random.random() < 0.25 else 0
                demo_att = 0
                prop_sent = 0
                outcome = "Unresponsive"

            int_date = (base_date - timedelta(days=days_since + int_idx * 7)).strftime("%Y-%m-%d")

            interactions.append((
                int_id, cust_id, int_date, int_channel, int_type,
                email_resp, meet_att, demo_att, prop_sent, days_since, outcome
            ))

        # --- SUPPORT TICKETS ---
        num_tickets = 0
        if persona == 4:
            num_tickets = random.randint(3, 8)
        elif persona in [1, 3]:
            num_tickets = random.randint(1, 4)
        elif random.random() < 0.15:
            num_tickets = random.randint(1, 2)

        for tck_idx in range(num_tickets):
            tck_id = f"TCK-{i:04d}-{tck_idx+1}"
            issue_cat = random.choice(ISSUE_CATEGORIES)
            
            if persona == 4:
                priority = random.choice(["Critical", "High", "High", "Medium"])
                status = random.choice(["In Progress", "Escalated", "Resolved"])
                res_hours = round(random.uniform(36.0, 110.0), 1)
                # Introduce realistic missing values or low CSAT
                csat = round(random.uniform(1.2, 2.8), 1) if random.random() > 0.1 else None
            else:
                priority = random.choice(["Medium", "Low", "High"])
                status = random.choice(["Resolved", "Closed"])
                res_hours = round(random.uniform(4.0, 32.0), 1)
                csat = round(random.uniform(4.0, 5.0), 1) if random.random() > 0.05 else None

            created_days = random.randint(5, 120)
            created_dt = (base_date - timedelta(days=created_days)).strftime("%Y-%m-%d %H:%M")
            resolved_dt = (base_date - timedelta(days=max(0, created_days - int(res_hours/24)))).strftime("%Y-%m-%d %H:%M") if status in ["Resolved", "Closed"] else None

            tickets.append((
                tck_id, cust_id, issue_cat, priority, created_dt, resolved_dt,
                res_hours if status in ["Resolved", "Closed"] else None,
                csat, status
            ))

        # --- PIPELINE OPPORTUNITIES ---
        has_opp = False
        if persona in [0, 2]:
            has_opp = True
        elif persona == 3 and random.random() < 0.70:
            has_opp = True
        elif random.random() < 0.20:
            has_opp = True

        if has_opp:
            opp_id = f"OPP-{i:04d}-1"
            opp_val = round(random.uniform(35000, 195000), 2)
            
            if persona == 0:
                stage = "Proposal Sent"
                prop_date = (base_date - timedelta(days=random.randint(3, 14))).strftime("%Y-%m-%d")
                last_act = (base_date - timedelta(days=random.randint(1, 5))).strftime("%Y-%m-%d")
                outcome = "Open"
                lost_reason = None
            elif persona == 2:
                stage = random.choice(["Proposal Sent", "Commercial Negotiation", "Technical Architecture Review"])
                prop_date = (base_date - timedelta(days=random.randint(25, 60))).strftime("%Y-%m-%d")
                last_act = (base_date - timedelta(days=random.randint(21, 55))).strftime("%Y-%m-%d")
                outcome = "Open"
                lost_reason = None
            elif persona == 3:
                stage = random.choice(["Discovery & Scoping", "Solution Design & SOW Draft"])
                prop_date = None
                last_act = (base_date - timedelta(days=random.randint(4, 18))).strftime("%Y-%m-%d")
                outcome = "Open"
                lost_reason = None
            else:
                outcome = random.choice(["Open", "Closed Won", "Closed Lost"])
                stage = "Closed Won" if outcome == "Won" else ("Closed Lost" if outcome == "Lost" else "Qualification")
                prop_date = (base_date - timedelta(days=random.randint(30, 90))).strftime("%Y-%m-%d")
                last_act = (base_date - timedelta(days=random.randint(10, 40))).strftime("%Y-%m-%d")
                lost_reason = random.choice(["Budget Freeze", "Competitor Selected", "Timeline Deferred"]) if outcome == "Closed Lost" else None

            pipeline.append((
                opp_id, cust_id, opp_val, stage, prop_date, last_act, outcome, lost_reason
            ))

        # --- HISTORICAL CAMPAIGN / MESSAGE LOGS ---
        if random.random() < 0.65:
            msg_id = f"MSG-{i:04d}-HIST"
            camp_id = random.choice(["CAMP-Q3-PROPOSAL", "CAMP-RETENTION-ALERT", "CAMP-CLIENT-EXPANSION", "CAMP-STALLED-REACTIVATION"])
            ch = "WhatsApp" if (consent_whatsapp and random.random() < 0.45) else "Email"
            trig = random.choice([
                "Trigger A: High-Intent Proposal Follow-Up",
                "Trigger B: Stalled Opportunity Re-engagement",
                "Trigger C: Post-Demo Architecture Touchpoint",
                "Trigger D: ERP Integration Expansion Opportunity",
                "Trigger E: Support Ticket & Retention Health Check"
            ])
            body = f"Hello from i95Dev, reaching out regarding your commerce integration requirements at {c_name}."
            sched_at = (base_date - timedelta(days=random.randint(5, 60))).strftime("%Y-%m-%d %H:%M")
            
            sim_rand = random.random()
            if not consent_email and ch == "Email":
                sim_status = "Suppressed"
                sim_reply = None
                conv_out = None
                opt_out = 1
            elif not consent_whatsapp and ch == "WhatsApp":
                sim_status = "Suppressed"
                sim_reply = None
                conv_out = None
                opt_out = 1
            elif sim_rand < 0.15:
                sim_status = "Sent (simulated)"
                sim_reply = None
                conv_out = None
                opt_out = 0
            elif sim_rand < 0.55:
                sim_status = "Replied (simulated)"
                sim_reply = "Positive: Yes, our team would like to review the technical proposal next Tuesday." if random.random() < 0.7 else "Neutral: Please send an updated spec sheet and check back next month."
                conv_out = "Converted (simulated)" if random.random() < 0.40 else "In Discussion"
                opt_out = 0
            elif sim_rand < 0.85:
                sim_status = "Converted (simulated)"
                sim_reply = "Positive: Let's move forward with scheduling the implementation kickoff."
                conv_out = "Converted (simulated)"
                opt_out = 0
            elif sim_rand < 0.95:
                sim_status = "Replied (simulated)"
                sim_reply = "Negative: Not interested at this time, please pause communication."
                conv_out = "Lost"
                opt_out = 0
            else:
                sim_status = "Opted Out"
                sim_reply = "STOP / Unsubscribe"
                conv_out = "Opted Out"
                opt_out = 1

            campaign_logs.append((
                msg_id, cust_id, camp_id, ch, trig, body, sched_at,
                sim_status, sim_reply, conv_out, opt_out, sched_at, sched_at
            ))

    cursor.executemany('''
    INSERT INTO customers VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
    ''', customers)

    cursor.executemany('''
    INSERT INTO transactions VALUES (?,?,?,?,?,?,?,?)
    ''', transactions)

    cursor.executemany('''
    INSERT INTO sales_interactions VALUES (?,?,?,?,?,?,?,?,?,?,?)
    ''', interactions)

    cursor.executemany('''
    INSERT INTO support_tickets VALUES (?,?,?,?,?,?,?,?,?)
    ''', tickets)

    cursor.executemany('''
    INSERT INTO pipeline_opportunities VALUES (?,?,?,?,?,?,?,?)
    ''', pipeline)

    cursor.executemany('''
    INSERT INTO message_campaign_logs VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
    ''', campaign_logs)

    # Insert default Automation Rules
    rules = [
        ("RULE-001", "Trigger A: High-Intent Proposal Follow-Up",
         "Activates when proposal has been sent, no response for > 3 days, and opportunity is still open.",
         1, 3, "Email", 3, 4, 1, 0, 50, datetime.now().isoformat()),
        ("RULE-002", "Trigger B: Stalled Opportunity Re-engagement",
         "Activates when deal is open with no meaningful activity for >= 21 days.",
         1, 21, "WhatsApp", 2, 7, 1, 0, 30, datetime.now().isoformat()),
        ("RULE-003", "Trigger C: Meeting / Demo Follow-Up",
         "Activates within 24-48 hours after demo or technical review completion.",
         1, 2, "Email", 2, 3, 1, 0, 40, datetime.now().isoformat()),
        ("RULE-004", "Trigger D: Existing Client Expansion Opportunity",
         "Activates for active clients with high CSAT and an integration service gap.",
         1, 30, "Email", 3, 14, 1, 0, 25, datetime.now().isoformat()),
        ("RULE-005", "Trigger E: Retention & Support Concern Escalation",
         "Activates when client has >= 2 open tickets or CSAT < 3.0. Creates account manager task without spamming aggressive sales pitch.",
         1, 1, "Email", 1, 7, 1, 1, 15, datetime.now().isoformat()),
    ]
    cursor.executemany('''
    INSERT OR REPLACE INTO automation_rules VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
    ''', rules)

    cursor.execute('''
    INSERT OR REPLACE INTO metadata_store VALUES ('last_generated_at', ?)
    ''', (datetime.now().isoformat(),))
    cursor.execute('''
    INSERT OR REPLACE INTO metadata_store VALUES ('dataset_seed', ?)
    ''', (str(seed),))
    cursor.execute('''
    INSERT OR REPLACE INTO metadata_store VALUES ('account_count', ?)
    ''', (str(count),))

    conn.commit()

    export_csvs(conn)
    create_data_dictionary()

    conn.close()
    print(f"Generated synthetic data for {count} accounts successfully.")

def export_csvs(conn):
    tables = [
        "customers", "transactions", "sales_interactions",
        "support_tickets", "pipeline_opportunities", "message_campaign_logs"
    ]
    for tbl in tables:
        df = pd.read_sql_query(f"SELECT * FROM {tbl}", conn)
        csv_path = os.path.join(DATA_DIR, f"{tbl}.csv")
        df.to_csv(csv_path, index=False)
        print(f"Exported {csv_path} ({len(df)} records)")

def create_data_dictionary():
    data_dict = {
        "customers": {
            "description": "Primary B2B account master table with firmographics, consent, and assigned AM.",
            "fields": {
                "customer_id": "Unique primary identifier (CUST-XXXX)",
                "company_name": "Synthetic fictional enterprise company name",
                "industry": "Industry vertical (Manufacturing, Distribution, Healthcare, etc.)",
                "company_size": "Employee headcount classification (SMB, Mid-Market, Enterprise)",
                "region": "Geographic territory across Americas, Europe, APAC",
                "lead_source": "Origination channel (ERP Referral, Summit, Organic, ABM)",
                "account_type": "Relationship lifecycle (Prospect, Active Client, Dormant)",
                "acquisition_date": "Date account record was created in CRM",
                "assigned_account_manager": "Dedicated i95Dev client executive",
                "consent_email": "Channel opt-in consent flag (1 = Consented, 0 = Suppressed)",
                "consent_whatsapp": "WhatsApp opt-in consent flag (1 = Consented, 0 = Suppressed)",
                "preferred_channel": "Customer preferred channel of communication",
                "account_status": "Current operational status"
            }
        },
        "transactions": {
            "description": "Historical contract and project billing records for i95Dev services.",
            "fields": {
                "transaction_id": "Unique transaction key (TX-XXXX-X)",
                "customer_id": "Foreign key reference to customers",
                "transaction_date": "Booking or invoice date",
                "service_category": "Delivered service type (ERP integration, Adobe Commerce, Portal, Managed Retainer)",
                "project_value": "Financial value in USD ($)",
                "contract_status": "State of contract (Completed, Active Retainer, Expired)",
                "renewal_date": "Next upcoming retainer renewal date if active",
                "repeat_purchase_count": "Cumulative purchases count prior to this deal"
            }
        },
        "sales_interactions": {
            "description": "Granular touchpoint logs across email, whatsapp, meetings, and demos.",
            "fields": {
                "interaction_id": "Unique touchpoint identifier (INT-XXXX-X)",
                "customer_id": "Foreign key reference to customers",
                "interaction_date": "Date of communication",
                "channel": "Interaction mode (Email, WhatsApp, Zoom/Teams, Phone)",
                "interaction_type": "Touchpoint category (Discovery, Tech Review, Proposal, Demo)",
                "email_response": "1 if client opened & replied, 0 otherwise",
                "meeting_attended": "1 if scheduled meeting was attended",
                "demo_attended": "1 if live technical integration demo took place",
                "proposal_sent": "1 if formal RFP/SOW proposal was delivered",
                "days_since_last_interaction": "Days elapsed since previous touchpoint",
                "interaction_outcome": "Recorded milestone or sales disposition"
            }
        },
        "support_tickets": {
            "description": "Technical support, integration maintenance, and SLA resolution tracking.",
            "fields": {
                "ticket_id": "Unique support case ID (TCK-XXXX-X)",
                "customer_id": "Foreign key reference to customers",
                "issue_category": "Integration domain issue (Sync latency, Webhook, Auth, Pricing rule)",
                "priority": "Severity tier (Critical, High, Medium, Low)",
                "created_date": "Timestamp ticket opened",
                "resolved_date": "Timestamp ticket closed",
                "resolution_time_hours": "Turnaround time in hours",
                "customer_satisfaction": "Post-resolution CSAT score (1.0 to 5.0)",
                "ticket_status": "Current case status (Resolved, Closed, In Progress, Escalated)"
            }
        },
        "pipeline_opportunities": {
            "description": "Current and past commercial opportunities in sales pipeline.",
            "fields": {
                "opportunity_id": "Opportunity record ID (OPP-XXXX-X)",
                "customer_id": "Foreign key reference to customers",
                "opportunity_value": "Estimated contract value in USD ($)",
                "sales_stage": "Stage (Discovery, Tech Review, Solution Design, Proposal Sent, Negotiation, Closed)",
                "proposal_date": "Date commercial proposal was shared",
                "last_activity_date": "Most recent sales engagement date",
                "outcome": "Disposition (Open, Won, Lost)",
                "lost_reason": "Structured rationale for lost opportunities"
            }
        },
        "message_campaign_logs": {
            "description": "Complete audit trail of simulated automated follow-ups, statuses, and simulated customer reactions.",
            "fields": {
                "message_id": "Message execution record ID",
                "customer_id": "Foreign key reference to customers",
                "campaign_id": "Associated campaign or trigger code",
                "channel": "Delivered channel (Email, WhatsApp)",
                "trigger_reason": "Rule or behavioral anomaly that fired the message",
                "generated_message": "Rendered message content with customer context",
                "scheduled_at": "Timestamp queued or scheduled",
                "simulated_status": "Simulated lifecycle status (Queued, Scheduled, Sent, Replied, Converted, Suppressed)",
                "simulated_reply": "Simulated client feedback text",
                "conversion_outcome": "Subsequent conversion result",
                "opt_out_status": "1 if client opted out or was suppressed"
            }
        }
    }
    
    dict_path = os.path.join(DATA_DIR, "data_dictionary.json")
    with open(dict_path, "w", encoding="utf-8") as f:
        json.dump(data_dict, f, indent=2)
    print(f"Saved data dictionary to {dict_path}")

if __name__ == "__main__":
    generate_all_synthetic_data()
