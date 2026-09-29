import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Mail,
  Phone,
  MessageSquare,
  Clock,
  Sparkles,
  CheckCircle,
  FileText,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { CustomerDetailResponse } from '../types';

interface Customer360ModalProps {
  customerId: string | null;
  onClose: () => void;
  onOpenMessageCentre?: (customerId: string, triggerName: string) => void;
}

export const Customer360Modal: React.FC<Customer360ModalProps> = ({
  customerId,
  onClose,
  onOpenMessageCentre
}) => {
  const [data, setData] = useState<CustomerDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'interactions' | 'tickets' | 'pipeline' | 'messages'>('overview');

  useEffect(() => {
    if (!customerId) return;
    setLoading(true);
    api.getCustomerDetails(customerId)
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [customerId]);

  if (!customerId) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex justify-end">
      <div className="bg-white w-full max-w-4xl min-h-screen flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="bg-[#0B192C] text-white p-6 border-b border-slate-800 flex justify-between items-start">
          {loading || !data ? (
            <div className="animate-pulse space-y-2">
              <div className="h-6 w-48 bg-slate-700 rounded"></div>
              <div className="h-4 w-32 bg-slate-800 rounded"></div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-400/30">
                  {data.customer.customer_id}
                </span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                  data.customer.cluster_label.includes('High-Intent') ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                  data.customer.cluster_label.includes('Retention') ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                  data.customer.cluster_label.includes('Stalled') ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                  'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                }`}>
                  {data.customer.cluster_label}
                </span>
              </div>
              <h2 className="text-xl font-bold mt-2 text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-400" />
                {data.customer.company_name}
              </h2>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-slate-300">
                <span>Industry: <strong className="text-white">{data.customer.industry}</strong></span>
                <span>Size: <strong className="text-white">{data.customer.company_size}</strong></span>
                <span>Region: <strong className="text-white">{data.customer.region}</strong></span>
                <span>Assigned AM: <strong className="text-white">{data.customer.assigned_account_manager}</strong></span>
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-slate-200 bg-slate-50 px-6 flex gap-2">
          {(['overview', 'transactions', 'interactions', 'tickets', 'pipeline', 'messages'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab === 'overview' && 'Customer 360'}
              {tab === 'transactions' && `Projects (${data?.transactions.length || 0})`}
              {tab === 'interactions' && `Interactions (${data?.interactions.length || 0})`}
              {tab === 'tickets' && `Support (${data?.support_tickets.length || 0})`}
              {tab === 'pipeline' && `Pipeline (${data?.pipeline_opportunities.length || 0})`}
              {tab === 'messages' && `Outreach (${data?.campaign_messages.length || 0})`}
            </button>
          ))}
        </div>

        {/* Tab Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {loading || !data ? (
            <div className="p-12 text-center text-slate-400 text-sm">Loading 360-degree account profile...</div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Behavioral Metrics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Total Billings</p>
                      <p className="text-lg font-bold text-slate-900 mt-1">${data.customer.total_revenue.toLocaleString()}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{data.customer.transaction_count} closed contracts</p>
                    </div>
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Open Pipeline</p>
                      <p className="text-lg font-bold text-blue-700 mt-1">${data.customer.open_pipeline_value.toLocaleString()}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{data.customer.open_opportunity_count} active opportunities</p>
                    </div>
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Engagement Score</p>
                      <p className="text-lg font-bold text-emerald-700 mt-1">{data.customer.engagement_score} / 100</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Last touch: {data.customer.days_since_last_interaction.toFixed(0)}d ago</p>
                    </div>
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Retention Risk</p>
                      <p className={`text-lg font-bold mt-1 ${data.customer.retention_risk_score > 35 ? 'text-rose-600' : 'text-slate-700'}`}>
                        {data.customer.retention_risk_score} / 100
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{data.customer.open_ticket_count} open support cases</p>
                    </div>
                  </div>

                  {/* AI Recommended Next Action Card */}
                  <div className="p-5 rounded-xl border-2 border-blue-200 bg-gradient-to-r from-blue-50/80 to-indigo-50/60 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-blue-800 text-xs font-bold uppercase tracking-wider">
                        <Sparkles className="w-4 h-4 text-blue-600" />
                        AI Recommended Next Action
                      </div>
                      <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                        {data.recommended_next_action.urgency}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-2">
                      {data.recommended_next_action.title}
                    </h3>
                    <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                      {data.recommended_next_action.reason}
                    </p>
                    <div className="mt-4 flex items-center justify-between pt-3 border-t border-blue-200/60">
                      <span className="text-xs text-slate-600">
                        Suggested Channel: <strong>{data.recommended_next_action.channel}</strong>
                      </span>
                      {onOpenMessageCentre && (
                        <button
                          onClick={() => {
                            onClose();
                            onOpenMessageCentre(data.customer.customer_id, data.recommended_next_action.title);
                          }}
                          className="px-3.5 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                        >
                          Generate Draft in Studio <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Consent & Communication Safeguards */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-3">Communication Consent & Safeguards</h4>
                    <div className="grid grid-cols-3 gap-4 text-xs">
                      <div>
                        <span className="text-slate-500 block">Email Consent:</span>
                        <span className={`font-semibold inline-flex items-center gap-1 mt-0.5 ${data.customer.consent_email ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {data.customer.consent_email ? 'Consented (Active)' : 'Suppressed / Opted-Out'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">WhatsApp Consent:</span>
                        <span className={`font-semibold inline-flex items-center gap-1 mt-0.5 ${data.customer.consent_whatsapp ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {data.customer.consent_whatsapp ? 'Consented (Active)' : 'Suppressed / Opted-Out'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Preferred Channel:</span>
                        <span className="font-semibold text-slate-800 mt-0.5 block">{data.customer.preferred_channel}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Transactions Tab */}
              {activeTab === 'transactions' && (
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-slate-500 uppercase">Historical Contracts & Deployments</div>
                  {data.transactions.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4">No closed billing contracts recorded for this account yet.</p>
                  ) : (
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                      {data.transactions.map((tx: any) => (
                        <div key={tx.transaction_id} className="p-3.5 text-xs flex justify-between items-center hover:bg-slate-50">
                          <div>
                            <span className="font-semibold text-slate-900 block">{tx.service_category}</span>
                            <span className="text-slate-500 text-[11px]">ID: {tx.transaction_id} | Date: {tx.transaction_date}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-slate-900 block">${tx.project_value.toLocaleString()}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                              {tx.contract_status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Interactions Tab */}
              {activeTab === 'interactions' && (
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-slate-500 uppercase">Touchpoint & Interaction Logs</div>
                  {data.interactions.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4">No interactions recorded.</p>
                  ) : (
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                      {data.interactions.map((it: any) => (
                        <div key={it.interaction_id} className="p-3.5 text-xs flex justify-between items-center hover:bg-slate-50">
                          <div>
                            <span className="font-semibold text-slate-900 block">{it.interaction_type} ({it.channel})</span>
                            <span className="text-slate-500 text-[11px]">Date: {it.interaction_date} | Outcome: {it.interaction_outcome}</span>
                          </div>
                          <div className="text-right text-[11px] space-x-2">
                            {it.proposal_sent === 1 && <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-medium">Proposal Delivered</span>}
                            {it.demo_attended === 1 && <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-medium">Demo Attended</span>}
                            {it.email_response === 1 && <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium">Replied</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tickets Tab */}
              {activeTab === 'tickets' && (
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-slate-500 uppercase">Support Tickets & Service SLA</div>
                  {data.support_tickets.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4">Zero support tickets recorded. Account has had flawless service uptime.</p>
                  ) : (
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                      {data.support_tickets.map((tck: any) => (
                        <div key={tck.ticket_id} className="p-3.5 text-xs flex justify-between items-center hover:bg-slate-50">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900">{tck.issue_category}</span>
                              <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                                tck.priority === 'Critical' ? 'bg-rose-100 text-rose-700' :
                                tck.priority === 'High' ? 'bg-amber-100 text-amber-700' :
                                'bg-slate-100 text-slate-600'
                              }`}>{tck.priority}</span>
                            </div>
                            <span className="text-slate-500 text-[11px]">Created: {tck.created_date} | Resolution: {tck.resolution_time_hours || '--'}h</span>
                          </div>
                          <div className="text-right">
                            <span className={`font-semibold block ${tck.ticket_status === 'In Progress' ? 'text-amber-600' : 'text-emerald-700'}`}>
                              {tck.ticket_status}
                            </span>
                            <span className="text-[11px] text-slate-500">CSAT: {tck.customer_satisfaction ? `${tck.customer_satisfaction}/5.0` : 'Pending'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Pipeline Tab */}
              {activeTab === 'pipeline' && (
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-slate-500 uppercase">Sales Pipeline Opportunities</div>
                  {data.pipeline_opportunities.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4">No pipeline opportunities recorded.</p>
                  ) : (
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                      {data.pipeline_opportunities.map((opp: any) => (
                        <div key={opp.opportunity_id} className="p-3.5 text-xs flex justify-between items-center hover:bg-slate-50">
                          <div>
                            <span className="font-semibold text-slate-900 block">{opp.sales_stage}</span>
                            <span className="text-slate-500 text-[11px]">ID: {opp.opportunity_id} | Last Activity: {opp.last_activity_date}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-slate-900 block">${opp.opportunity_value.toLocaleString()}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              opp.outcome === 'Open' ? 'bg-blue-100 text-blue-700' :
                              opp.outcome === 'Won' ? 'bg-emerald-100 text-emerald-700' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {opp.outcome}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Messages Tab */}
              {activeTab === 'messages' && (
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-slate-500 uppercase">Simulated Automated Outreach History</div>
                  {data.campaign_messages.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4">No follow-up messages generated for this account yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {data.campaign_messages.map((msg: any) => (
                        <div key={msg.message_id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{msg.channel} Follow-Up</span>
                              <span className="text-[11px] text-slate-500">({msg.scheduled_at})</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full font-medium text-[11px] ${
                              msg.simulated_status.includes('Converted') ? 'bg-emerald-100 text-emerald-800' :
                              msg.simulated_status.includes('Replied') ? 'bg-blue-100 text-blue-800' :
                              msg.simulated_status.includes('Suppressed') ? 'bg-slate-200 text-slate-700' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {msg.simulated_status}
                            </span>
                          </div>
                          <p className="text-slate-600 italic font-mono text-[11px] bg-white p-2.5 rounded border border-slate-200">
                            {msg.generated_message}
                          </p>
                          {msg.simulated_reply && (
                            <div className="mt-2 p-2 bg-blue-50/70 border border-blue-200/60 rounded text-[11px] text-blue-900">
                              <strong>Simulated Customer Reply:</strong> {msg.simulated_reply}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
