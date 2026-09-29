export interface Customer {
  customer_id: string;
  company_name: string;
  industry: string;
  company_size: string;
  region: string;
  account_type: string;
  account_status: string;
  assigned_account_manager: string;
  consent_email: number;
  consent_whatsapp: number;
  preferred_channel: string;
  total_revenue: number;
  avg_project_value: number;
  transaction_count: number;
  repeat_purchase_count: number;
  days_since_last_purchase: number;
  renewal_proximity_days: number;
  total_interactions: number;
  days_since_last_interaction: number;
  email_response_rate: number;
  meeting_attendance_rate: number;
  demo_attendance_rate: number;
  proposal_count: number;
  open_opportunity_count: number;
  open_pipeline_value: number;
  highest_sales_stage: string;
  days_in_current_stage: number;
  support_ticket_count: number;
  open_ticket_count: number;
  avg_resolution_time_hours: number;
  avg_csat_score: number;
  high_priority_ticket_count: number;
  engagement_score: number;
  retention_risk_score: number;
  cluster_id: number;
  cluster_label: string;
  firmographic_segment: string;
}

export interface CustomerDetailResponse {
  customer: Customer;
  transactions: any[];
  interactions: any[];
  support_tickets: any[];
  pipeline_opportunities: any[];
  campaign_messages: any[];
  scheduled_tasks: any[];
  recommended_next_action: {
    title: string;
    reason: string;
    urgency: string;
    channel: string;
  };
}

export interface ClusterStat {
  cluster_id: number;
  label: string;
  account_count: number;
  percentage: number;
  total_revenue: number;
  avg_revenue: number;
  total_pipeline: number;
  avg_pipeline: number;
  avg_engagement_score: number;
  avg_retention_risk: number;
  avg_days_since_interaction: number;
  avg_response_rate: number;
  avg_csat: number;
  open_tickets: number;
  distinguishing_features: string[];
}

export interface SegmentationResponse {
  k: number;
  silhouette_score: number;
  clusters: ClusterStat[];
  comparison_industry: Record<string, Record<string, number>>;
}

export interface Recommendation {
  cluster_id: number;
  segment_name: string;
  executive_summary: string;
  defining_characteristics: string[];
  differences_from_others: string;
  supporting_metrics: Record<string, any>;
  likely_customer_needs_hypotheses: string[];
  recommended_marketing_strategy: string;
  recommended_sales_action: string;
  suggested_communication_channel: string;
  recommended_follow_up_timing: string;
  cross_sell_upsell_opportunities: string;
  potential_risks_and_cautions: string;
  suggested_success_metrics: string[];
  is_ai_generated: boolean;
  engine: string;
}

export interface AutomationRule {
  rule_id: string;
  trigger_name: string;
  description: string;
  is_active: number;
  delay_days: number;
  preferred_channel: string;
  max_attempts: number;
  min_interval_days: number;
  working_hours_only: number;
  require_human_approval: number;
  daily_limit: number;
  created_at: string;
}

export interface ScheduledTask {
  task_id: string;
  customer_id: string;
  rule_id: string;
  channel: string;
  trigger_reason: string;
  generated_message: string;
  scheduled_for: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXECUTED' | 'SUPPRESSED';
  suppression_reason?: string;
  attempts: number;
  created_at: string;
  executed_at?: string;
  company_name?: string;
  industry?: string;
  assigned_account_manager?: string;
  consent_email?: number;
  consent_whatsapp?: number;
}

export interface CampaignMessage {
  message_id: string;
  customer_id: string;
  campaign_id: string;
  channel: string;
  trigger_reason: string;
  generated_message: string;
  scheduled_at: string;
  simulated_status: string;
  simulated_reply?: string;
  conversion_outcome?: string;
  opt_out_status: number;
  company_name?: string;
  assigned_account_manager?: string;
}

export interface ExecutiveKPIs {
  total_accounts: number;
  qualified_prospects: number;
  open_opportunities_count: number;
  total_pipeline_value: number;
  total_revenue: number;
  average_project_value: number;
  simulated_followup_count: number;
  simulated_response_rate: number;
  simulated_conversion_rate: number;
  accounts_requiring_attention: number;
  segment_distribution: Array<{
    name: string;
    count: number;
    percentage: number;
    pipeline: number;
    revenue: number;
  }>;
  region_distribution: Array<{
    region: string;
    accounts: number;
    pipeline: number;
  }>;
  top_attention_accounts: any[];
}
