import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Mail,
  MessageSquare,
  CheckCircle2,
  DollarSign,
  Users,
  Target,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { api } from '../services/api';

export const CampaignAnalytics: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getCampaignAnalytics()
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading || !data || !data.summary) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[500px]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-500 font-medium">Computing campaign analytics from execution logs...</p>
        </div>
      </div>
    );
  }

  const { summary, channel_comparison, trigger_comparison, segment_comparison, timeline } = data;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Campaign Performance Analytics</h1>
        <p className="text-xs text-slate-500 mt-1">
          Detailed metrics calculated dynamically from message campaign logs and simulated recipient interaction streams.
        </p>
      </div>

      {/* KPI Funnel Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="saas-card p-5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Messages Queued</span>
          <span className="text-2xl font-black text-slate-900 mt-2 block">{summary.total_messages}</span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {summary.sent_simulated} sent • {summary.suppressed} suppressed
          </span>
        </div>

        <div className="saas-card p-5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Simulated Response Rate</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-blue-700">{summary.response_rate}%</span>
            <span className="text-[11px] text-slate-500">({summary.replied_simulated} replies)</span>
          </div>
          <span className="text-[11px] text-emerald-600 font-medium mt-1 block">
            {summary.positive_response_rate}% positive sentiment
          </span>
        </div>

        <div className="saas-card p-5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Conversion Rate</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-emerald-700">{summary.conversion_rate}%</span>
            <span className="text-[11px] text-slate-500">({summary.converted_simulated} deals)</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">From sent follow-ups</span>
        </div>

        <div className="saas-card p-5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Opt-Out & Suppressed</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-slate-700">{summary.opted_out}</span>
            <span className="text-[11px] text-slate-500">opted-out</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">{summary.suppressed} consent suppressed</span>
        </div>
      </div>

      {/* Channel Comparison Cards (Email vs WhatsApp) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {channel_comparison.map((ch: any) => (
          <div key={ch.channel} className="saas-card p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                {ch.channel === 'Email' ? (
                  <Mail className="w-5 h-5 text-blue-600" />
                ) : (
                  <MessageSquare className="w-5 h-5 text-emerald-600" />
                )}
                <h3 className="text-sm font-bold text-slate-900">{ch.channel} Campaign Performance</h3>
              </div>
              <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
                {ch.sent} messages sent
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Inbounds</span>
                <span className="text-lg font-bold text-slate-900 mt-0.5 block">{ch.replied}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Response Rate</span>
                <span className="text-lg font-bold text-blue-700 mt-0.5 block">{ch.response_rate}%</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Conversion Rate</span>
                <span className="text-lg font-bold text-emerald-700 mt-0.5 block">{ch.conversion_rate}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Trigger-Level Performance Table */}
      <div className="saas-card p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-600" />
              Conversion & Engagement by Behavioral Trigger
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Measures relative efficacy of each automated rule
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Trigger Workflow</th>
                <th className="py-2.5 px-3">Messages Sent</th>
                <th className="py-2.5 px-3">Replies</th>
                <th className="py-2.5 px-3">Response Rate</th>
                <th className="py-2.5 px-3">Conversions</th>
                <th className="py-2.5 px-3">Conversion Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {trigger_comparison.map((trig: any, i: number) => (
                <tr key={i} className="table-row-hover">
                  <td className="py-3 px-3 font-semibold text-slate-900">{trig.trigger}</td>
                  <td className="py-3 px-3 text-slate-700 font-mono">{trig.messages_sent}</td>
                  <td className="py-3 px-3 text-slate-700 font-mono">{trig.replies}</td>
                  <td className="py-3 px-3 font-bold text-blue-700">{trig.response_rate}%</td>
                  <td className="py-3 px-3 text-slate-700 font-mono">{trig.conversions}</td>
                  <td className="py-3 px-3 font-bold text-emerald-700">{trig.conversion_rate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Segment Campaign Comparison */}
      <div className="saas-card p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              Campaign Performance Across Behavioral Clusters
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Validates that high-intent cohorts yield higher conversion velocity
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Behavioral Cluster</th>
                <th className="py-2.5 px-3">Messages Sent</th>
                <th className="py-2.5 px-3">Replies</th>
                <th className="py-2.5 px-3">Response Rate</th>
                <th className="py-2.5 px-3">Conversions</th>
                <th className="py-2.5 px-3">Conversion Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {segment_comparison.map((seg: any, i: number) => (
                <tr key={i} className="table-row-hover">
                  <td className="py-3 px-3 font-bold text-slate-900">{seg.segment}</td>
                  <td className="py-3 px-3 text-slate-700 font-mono">{seg.messages_sent}</td>
                  <td className="py-3 px-3 text-slate-700 font-mono">{seg.replies}</td>
                  <td className="py-3 px-3 font-bold text-blue-700">{seg.response_rate}%</td>
                  <td className="py-3 px-3 text-slate-700 font-mono">{seg.conversions}</td>
                  <td className="py-3 px-3 font-bold text-emerald-700">{seg.conversion_rate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
