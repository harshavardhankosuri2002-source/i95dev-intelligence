import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Mail,
  Send,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ThumbsUp,
  Meh,
  ThumbsDown,
  UserX,
  History,
  Phone,
  Edit2
} from 'lucide-react';
import { api } from '../services/api';
import { CampaignMessage, Customer } from '../types';

interface MessageCentreProps {
  initialCustomerId?: string | null;
  initialTrigger?: string | null;
}

export const MessageCentre: React.FC<MessageCentreProps> = ({
  initialCustomerId,
  initialTrigger
}) => {
  const [channel, setChannel] = useState<'Email' | 'WhatsApp'>('Email');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(initialCustomerId || '');
  const [selectedTrigger, setSelectedTrigger] = useState<string>(initialTrigger || 'Trigger A: High-Intent Proposal Follow-Up');
  
  // Message drafting state
  const [draftSubject, setDraftSubject] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const [generating, setGenerating] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  // Message logs
  const [messageLogs, setMessageLogs] = useState<CampaignMessage[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  // Triggers list
  const triggers = [
    'Trigger A: High-Intent Proposal Follow-Up',
    'Trigger B: Stalled Opportunity Re-engagement',
    'Trigger C: Meeting / Demo Follow-Up',
    'Trigger D: Existing Client Expansion Opportunity',
    'Trigger E: Retention & Support Concern Escalation'
  ];

  // Load customer list
  useEffect(() => {
    api.getCustomers({ limit: 100 })
      .then(res => {
        setCustomers(res.customers);
        if (!selectedCustomerId && res.customers.length > 0) {
          setSelectedCustomerId(res.customers[0].customer_id);
        }
      })
      .catch(console.error);

    loadLogs();
  }, []);

  const loadLogs = () => {
    setLoadingLogs(true);
    api.getCampaignMessages({ limit: 25 })
      .then(res => {
        setMessageLogs(res.messages);
        setLoadingLogs(false);
      })
      .catch(console.error);
  };

  // Generate preview draft when customer, trigger, or channel changes
  const generateDraft = () => {
    if (!selectedCustomerId) return;
    setGenerating(true);
    setSentSuccess(false);
    api.previewMessage(selectedCustomerId, selectedTrigger, channel)
      .then(res => {
        setDraftSubject(res.subject || '');
        setDraftBody(res.body || '');
        setGenerating(false);
      })
      .catch(err => {
        console.error(err);
        setGenerating(false);
      });
  };

  useEffect(() => {
    if (selectedCustomerId) {
      generateDraft();
    }
  }, [selectedCustomerId, selectedTrigger, channel]);

  // Simulate response on a logged message
  const handleSimulateResponse = async (messageId: string, sentiment: string) => {
    try {
      await api.simulateResponse(messageId, sentiment);
      loadLogs();
    } catch (err) {
      console.error(err);
    }
  };

  // Simulate batch replies
  const handleBatchSimulation = async () => {
    try {
      await api.simulateBatch(10);
      loadLogs();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Personalized Message Centre & Delivery Simulator
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Generate channel-specific follow-ups anchored in verified CRM records; simulate recipient engagement and lifecycle events.
          </p>
        </div>

        <button
          onClick={handleBatchSimulation}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg shadow-sm transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          <span>Simulate Batch Inbound Responses (10)</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Message Drafting Studio (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="saas-card p-6 space-y-4">
            {/* Channel Tabs */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setChannel('Email')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    channel === 'Email'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Mail className="w-4 h-4" /> Email Follow-Up
                </button>
                <button
                  onClick={() => setChannel('WhatsApp')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    channel === 'WhatsApp'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" /> WhatsApp Follow-Up
                </button>
              </div>

              <span className="text-[11px] text-slate-400 font-mono">
                {channel === 'WhatsApp' ? 'Max 160 chars recommended' : 'Formal B2B Template'}
              </span>
            </div>

            {/* Target Account and Trigger Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Account:</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                >
                  {customers.map((c) => (
                    <option key={c.customer_id} value={c.customer_id}>
                      {c.company_name} ({c.customer_id}) - {c.cluster_label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Trigger Context:</label>
                <select
                  value={selectedTrigger}
                  onChange={(e) => setSelectedTrigger(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                >
                  {triggers.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Message Editor */}
            <div className="space-y-3 pt-2">
              {channel === 'Email' && (
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide block mb-1">
                    Subject Line:
                  </label>
                  <input
                    type="text"
                    value={draftSubject}
                    onChange={(e) => setDraftSubject(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                    Personalized Message Draft:
                  </label>
                  <button
                    onClick={generateDraft}
                    disabled={generating}
                    className="text-[11px] text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
                  >
                    <RefreshCw className={`w-3 h-3 ${generating ? 'animate-spin' : ''}`} /> Regenerate
                  </button>
                </div>
                <textarea
                  rows={channel === 'Email' ? 10 : 5}
                  value={draftBody}
                  onChange={(e) => setDraftBody(e.target.value)}
                  className="w-full p-3 text-xs font-mono leading-relaxed bg-slate-50/60 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Action Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <span className="text-[11px] text-slate-400">
                Mode: <strong>Prototype Sandbox (Simulated Delivery)</strong>
              </span>

              <button
                onClick={() => {
                  setSentSuccess(true);
                  setTimeout(() => setSentSuccess(false), 3000);
                  loadLogs();
                }}
                className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Simulate Send Now</span>
              </button>
            </div>

            {sentSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Simulated message queued and sent successfully! Recorded in campaign event stream.</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Simulated Campaign Event Stream & Feedback (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="saas-card p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wide">
                <History className="w-4 h-4 text-blue-600" />
                Simulated Delivery & Response Stream
              </div>
              <button
                onClick={loadLogs}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-medium"
              >
                Refresh
              </button>
            </div>

            <div className="mt-3 divide-y divide-slate-100 max-h-[640px] overflow-y-auto space-y-3">
              {loadingLogs ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading delivery logs...</div>
              ) : messageLogs.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">No simulated messages found.</div>
              ) : (
                messageLogs.map((log) => (
                  <div key={log.message_id} className="pt-3 text-xs space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <strong className="text-slate-900 block">{log.company_name || log.customer_id}</strong>
                        <span className="text-[11px] text-slate-400 font-mono">{log.channel} • {log.scheduled_at}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        log.simulated_status.includes('Converted') ? 'bg-emerald-100 text-emerald-800' :
                        log.simulated_status.includes('Replied') ? 'bg-blue-100 text-blue-800' :
                        log.simulated_status.includes('Suppressed') ? 'bg-slate-200 text-slate-700' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {log.simulated_status}
                      </span>
                    </div>

                    <p className="text-slate-600 text-[11px] font-mono bg-slate-50 p-2 rounded border border-slate-100 line-clamp-2">
                      {log.generated_message}
                    </p>

                    {log.simulated_reply && (
                      <div className="p-2 bg-blue-50/70 border border-blue-200/50 rounded text-[11px] text-blue-900 leading-snug">
                        <strong>Simulated Inbound:</strong> {log.simulated_reply}
                      </div>
                    )}

                    {/* Simulate Response Action Controls */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">Simulate Reply:</span>
                      <button
                        onClick={() => handleSimulateResponse(log.message_id, 'positive')}
                        className="px-2 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-semibold flex items-center gap-1"
                        title="Simulate positive response"
                      >
                        <ThumbsUp className="w-3 h-3" /> Positive
                      </button>
                      <button
                        onClick={() => handleSimulateResponse(log.message_id, 'neutral')}
                        className="px-2 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-[10px] font-semibold flex items-center gap-1"
                        title="Simulate neutral response"
                      >
                        <Meh className="w-3 h-3" /> Neutral
                      </button>
                      <button
                        onClick={() => handleSimulateResponse(log.message_id, 'negative')}
                        className="px-2 py-0.5 rounded bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-semibold flex items-center gap-1"
                        title="Simulate decline response"
                      >
                        <ThumbsDown className="w-3 h-3" /> Decline
                      </button>
                      <button
                        onClick={() => handleSimulateResponse(log.message_id, 'opt_out')}
                        className="px-2 py-0.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-semibold flex items-center gap-1"
                        title="Simulate STOP / unsubscribe"
                      >
                        <UserX className="w-3 h-3" /> Opt-out
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
