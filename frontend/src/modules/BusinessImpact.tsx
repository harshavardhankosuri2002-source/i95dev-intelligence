import React, { useState, useEffect } from 'react';
import {
  Scale,
  TrendingUp,
  Clock,
  DollarSign,
  AlertTriangle,
  Info,
  CheckCircle2,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';

export const BusinessImpact: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getImpactEvaluation()
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading || !data) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[500px]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-500 font-medium">Running business impact simulation model...</p>
        </div>
      </div>
    );
  }

  const { summary, comparison_metrics, segment_breakdown, disclaimer } = data;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Scale className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Business Impact & Strategy Evaluation Model
          </h1>
        </div>
        <p className="text-xs text-slate-500 mt-1 max-w-3xl">
          Side-by-side comparative simulation comparing a traditional firmographic baseline against the proposed AI-driven behavioral follow-up engine.
        </p>
      </div>

      {/* Scientific Transparency Disclaimer Banner */}
      <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700 leading-relaxed">
          <strong>Methodological Transparency & Evaluation Integrity:</strong> {disclaimer}
        </div>
      </div>

      {/* Executive Lift Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="saas-card p-5 border-emerald-200/80 bg-emerald-50/20">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide block">Conversion Lift</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-3xl font-black text-emerald-800">+{summary.lift_conversion_rate_percentage_points}%</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Percentage points increase</span>
        </div>

        <div className="saas-card p-5 border-blue-200/80 bg-blue-50/20">
          <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wide block">Incremental Pipeline</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-2xl font-black text-blue-900">+${(summary.lift_pipeline_value / 1_000_000).toFixed(2)}M</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Simulated converted deals</span>
        </div>

        <div className="saas-card p-5">
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide block">Response Velocity</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-3xl font-black text-slate-900">-{summary.time_to_touch_reduction_days}d</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Faster time-to-follow-up</span>
        </div>

        <div className="saas-card p-5">
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide block">Opt-Out Protection</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-3xl font-black text-emerald-700">-{summary.opt_out_reduction_percentage_points}%</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Fewer unsubscribes via consent</span>
        </div>
      </div>

      {/* Side-by-Side Comparison Table */}
      <div className="saas-card overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">
            Comparative Matrix: Baseline Strategy vs. AI Behavioral Strategy
          </h2>
          <span className="text-xs font-mono text-slate-500">Fixed Random Seed: 42</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 text-slate-600 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Evaluation Dimension</th>
                <th className="py-3 px-4">Baseline Strategy (Firmographic Blast)</th>
                <th className="py-3 px-4">Proposed Strategy (AI Behavioral Engine)</th>
                <th className="py-3 px-4 text-right">Variance / Delta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {comparison_metrics.map((row: any, i: number) => (
                <tr key={i} className="table-row-hover">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{row.metric}</td>
                  <td className="py-3.5 px-4 text-slate-600 font-mono">{row.baseline}</td>
                  <td className="py-3.5 px-4 font-semibold text-blue-900 bg-blue-50/30 font-mono">
                    {row.proposed}
                  </td>
                  <td className={`py-3.5 px-4 text-right font-bold font-mono ${
                    row.higher_is_better ? 'text-emerald-700' : 'text-blue-700'
                  }`}>
                    {row.delta}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Segment-Level Breakdown under Proposed Strategy */}
      <div className="saas-card p-6 space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900">
            Simulated Conversion Breakdown by Customer Segment
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Illustrates how behavioral segmentation concentrates conversion velocity in high-intent cohorts
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Behavioral Segment</th>
                <th className="py-2.5 px-3">Account Volume</th>
                <th className="py-2.5 px-3">Available Pipeline</th>
                <th className="py-2.5 px-3">Simulated Response Rate</th>
                <th className="py-2.5 px-3">Simulated Conversion Rate</th>
                <th className="py-2.5 px-3 text-right">Converted Pipeline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {segment_breakdown.map((seg: any, i: number) => (
                <tr key={i} className="table-row-hover">
                  <td className="py-3 px-3 font-semibold text-slate-900">{seg.segment}</td>
                  <td className="py-3 px-3 text-slate-700 font-mono">{seg.account_count}</td>
                  <td className="py-3 px-3 text-slate-700 font-mono">${seg.pipeline_value.toLocaleString()}</td>
                  <td className="py-3 px-3 font-bold text-blue-700">{seg.simulated_response_rate}%</td>
                  <td className="py-3 px-3 font-bold text-emerald-700">{seg.simulated_conversion_rate}%</td>
                  <td className="py-3 px-3 text-right font-black text-slate-900 font-mono">
                    ${seg.simulated_converted_pipeline.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
