import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Clock,
  MessageSquare,
  AlertTriangle,
  Lightbulb,
  Target
} from 'lucide-react';
import { api } from '../services/api';
import { Recommendation } from '../types';

interface AIRecommendationsProps {
  onOpenMessageCentre?: (customerId: string, triggerName: string) => void;
}

export const AIRecommendations: React.FC<AIRecommendationsProps> = ({
  onOpenMessageCentre
}) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSegmentIdx, setSelectedSegmentIdx] = useState(0);

  useEffect(() => {
    setLoading(true);
    api.getSegmentRecommendations()
      .then(res => {
        setRecommendations(res.recommendations);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading || recommendations.length === 0) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[500px]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-500 font-medium">Generating evidence-grounded AI recommendations...</p>
        </div>
      </div>
    );
  }

  const activeRec = recommendations[selectedSegmentIdx];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            AI-Powered Customer Intelligence & Strategy Engine
          </h1>
        </div>
        <p className="text-xs text-slate-500 mt-1 max-w-3xl">
          Actionable B2B sales and marketing recommendations synthesized from computed analytical characteristics. 
          Every hypothesis and action is anchored strictly in verified transaction, interaction, and support records.
        </p>
      </div>

      {/* Segment Selector Tabs */}
      <div className="flex flex-wrap gap-2 pb-2">
        {recommendations.map((rec, idx) => (
          <button
            key={rec.cluster_id}
            onClick={() => setSelectedSegmentIdx(idx)}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center gap-2 ${
              selectedSegmentIdx === idx
                ? 'bg-blue-600 text-white shadow-blue-500/20'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>{rec.segment_name}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
              selectedSegmentIdx === idx ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              #{rec.cluster_id}
            </span>
          </button>
        ))}
      </div>

      {/* Active Segment Intelligence Deck */}
      <div className="space-y-6">
        {/* Executive Summary Card */}
        <div className="saas-card p-6 bg-gradient-to-br from-white via-slate-50/50 to-blue-50/30 border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded font-bold">
                Analytical Strategy Blueprint
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-1">
                {activeRec.segment_name}
              </h2>
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Model: <strong>{activeRec.engine}</strong></span>
            </div>
          </div>

          <p className="text-xs text-slate-700 mt-4 leading-relaxed font-medium">
            {activeRec.executive_summary}
          </p>

          {/* Defining Behavioral Characteristics & Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="p-4 bg-white rounded-xl border border-slate-200">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5 mb-3">
                <Target className="w-3.5 h-3.5 text-blue-600" />
                Defining Behavioral Traits
              </h3>
              <ul className="space-y-2">
                {activeRec.defining_characteristics.map((char, i) => (
                  <li key={i} className="text-xs text-slate-700 flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>{char}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5 mb-3">
                <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                Supporting Analytical Metrics
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                {Object.entries(activeRec.supporting_metrics).map(([k, v]) => (
                  <div key={k} className="p-2.5 bg-slate-50 rounded-lg">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                      {k.replace(/_/g, ' ')}
                    </span>
                    <span className="font-bold text-slate-900">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Needs Hypotheses & Strategies */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Hypotheses */}
          <div className="saas-card p-6">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              Likely Customer Needs (Testable Hypotheses)
            </h3>
            <p className="text-[11px] text-slate-500 mb-3">
              Formulated as hypotheses to validate during sales discovery calls:
            </p>
            <div className="space-y-2.5">
              {activeRec.likely_customer_needs_hypotheses.map((hyp, i) => (
                <div key={i} className="p-3 bg-amber-50/50 rounded-lg border border-amber-200/60 text-xs text-slate-800 leading-relaxed">
                  {hyp}
                </div>
              ))}
            </div>
          </div>

          {/* Action Recommendations */}
          <div className="saas-card p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              Recommended Differentiated Actions
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-900 block">Recommended Sales Action:</span>
                <span className="text-slate-700 mt-1 block leading-relaxed">{activeRec.recommended_sales_action}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-900 block">Marketing Strategy:</span>
                <span className="text-slate-700 mt-1 block leading-relaxed">{activeRec.recommended_marketing_strategy}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-blue-50/60 rounded-lg border border-blue-200/60">
                  <span className="text-[10px] text-blue-900 uppercase font-bold block">Channel</span>
                  <span className="font-semibold text-blue-950 mt-0.5 block">{activeRec.suggested_communication_channel}</span>
                </div>
                <div className="p-2.5 bg-blue-50/60 rounded-lg border border-blue-200/60">
                  <span className="text-[10px] text-blue-900 uppercase font-bold block">Follow-Up Timing</span>
                  <span className="font-semibold text-blue-950 mt-0.5 block">{activeRec.recommended_follow_up_timing}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cautions and Success Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cautions */}
          <div className="saas-card p-6 border-amber-200 bg-amber-50/10">
            <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wide flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Potential Risks & Critical Cautions
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed mt-2 p-3 bg-white rounded-lg border border-amber-200">
              {activeRec.potential_risks_and_cautions}
            </p>
            <div className="mt-3 text-xs text-slate-600">
              <strong>Cross-Sell/Up-Sell Opportunities:</strong>
              <p className="mt-1 text-slate-700">{activeRec.cross_sell_upsell_opportunities}</p>
            </div>
          </div>

          {/* Success Metrics */}
          <div className="saas-card p-6">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Suggested Campaign Success Metrics
            </h3>
            <ul className="space-y-2 mt-3">
              {activeRec.suggested_success_metrics.map((met, i) => (
                <li key={i} className="text-xs text-slate-700 flex items-center gap-2 p-2 bg-slate-50 rounded border border-slate-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>{met}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
