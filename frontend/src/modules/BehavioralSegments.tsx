import React, { useState, useEffect } from 'react';
import {
  Network,
  Sliders,
  RefreshCw,
  CheckCircle,
  HelpCircle,
  DollarSign,
  Users,
  Activity,
  BarChart3,
  Layers,
  ArrowRight
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
import { SegmentationResponse } from '../types';

export const BehavioralSegments: React.FC = () => {
  const [data, setData] = useState<SegmentationResponse | null>(null);
  const [kValue, setKValue] = useState(5);
  const [loading, setLoading] = useState(true);
  const [reclustering, setReclustering] = useState(false);

  const loadSegmentation = () => {
    setLoading(true);
    api.getSegmentation()
      .then(res => {
        setData(res);
        setKValue(res.k);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadSegmentation();
  }, []);

  const handleRecluster = () => {
    setReclustering(true);
    api.recluster(kValue)
      .then(res => {
        setData(res);
        setReclustering(false);
      })
      .catch(err => {
        console.error(err);
        setReclustering(false);
      });
  };

  if (loading || !data) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[500px]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-500 font-medium">Loading behavioral segmentation engine...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Behavioral Segmentation Engine</h1>
          <p className="text-xs text-slate-500 mt-1">
            Unsupervised machine learning (K-Means) clustering on multi-dimensional customer behavioral vectors.
          </p>
        </div>

        {/* Cluster Slider & Re-cluster Control */}
        <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-semibold text-slate-700">Clusters (k):</span>
            <input
              type="range"
              min={3}
              max={8}
              value={kValue}
              onChange={(e) => setKValue(parseInt(e.target.value))}
              className="w-24 accent-blue-600 cursor-pointer"
            />
            <span className="text-xs font-mono font-bold text-blue-700 w-4">{kValue}</span>
          </div>

          <button
            onClick={handleRecluster}
            disabled={reclustering}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${reclustering ? 'animate-spin' : ''}`} />
            <span>Re-cluster</span>
          </button>
        </div>
      </div>

      {/* Cluster Quality & Overview Banner */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
            k={data.k}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">Current Model Evaluation</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
                Silhouette Score: {data.silhouette_score}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Silhouette score &gt; 0.40 demonstrates statistically robust separation between behavioral clusters.
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-600">
          Discovered <strong>{data.clusters.length} distinct behavioral archetypes</strong> across 1,000 accounts.
        </div>
      </div>

      {/* Discovered Cluster Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {data.clusters.map((cluster) => (
          <div
            key={cluster.cluster_id}
            className="saas-card p-5 flex flex-col justify-between border-t-4"
            style={{
              borderTopColor:
                cluster.label.includes('High-Intent') ? '#10B981' :
                cluster.label.includes('Retention') ? '#EF4444' :
                cluster.label.includes('Stalled') ? '#F59E0B' :
                cluster.label.includes('Growth') ? '#3B82F6' : '#8B5CF6'
            }}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                  Cluster #{cluster.cluster_id}
                </span>
                <span className="text-xs font-bold text-slate-900">
                  {cluster.account_count} accounts ({cluster.percentage}%)
                </span>
              </div>

              <h2 className="text-base font-bold text-slate-900 mt-2">
                {cluster.label}
              </h2>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Total Revenue</span>
                  <span className="font-bold text-slate-900">${cluster.total_revenue.toLocaleString()}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Open Pipeline</span>
                  <span className="font-bold text-blue-700">${cluster.total_pipeline.toLocaleString()}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Engagement</span>
                  <span className="font-bold text-emerald-700">{cluster.avg_engagement_score} / 100</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Retention Risk</span>
                  <span className={`font-bold ${cluster.avg_retention_risk > 35 ? 'text-rose-600' : 'text-slate-700'}`}>
                    {cluster.avg_retention_risk} / 100
                  </span>
                </div>
              </div>

              {/* Distinguishing Features */}
              <div className="mt-4 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">
                  Distinguishing Behavioral Signals:
                </span>
                {cluster.distinguishing_features.map((feat, idx) => (
                  <div key={idx} className="text-[11px] text-slate-700 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Behavioral vs Firmographic Deep-Dive Comparison */}
      <div className="saas-card p-6 space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">
              Why Behavioral Segmentation Beats Broad Firmographics
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
            B2B organizations historically rely on broad firmographics like <strong>Industry</strong> and <strong>Company Size</strong>. 
            The matrix below shows the actual cross-tabulation: accounts in <em>every single industry</em> are dispersed across all behavioral personas. 
            Sending generic industry blasts fails because it treats an account with 3 critical open tickets the same as one ready to sign a proposal.
          </p>
        </div>

        {/* Cross-Tab Matrix */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Behavioral Segment</th>
                {data.comparison_industry && Object.keys(Object.values(data.comparison_industry)[0] || {}).map(ind => (
                  <th key={ind} className="py-2.5 px-3">{ind}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.comparison_industry && Object.entries(data.comparison_industry).map(([segLabel, industries]) => (
                <tr key={segLabel} className="table-row-hover">
                  <td className="py-3 px-3 font-bold text-slate-900">
                    {segLabel}
                  </td>
                  {Object.values(industries).map((cnt, idx) => (
                    <td key={idx} className="py-3 px-3 text-slate-700 font-mono">
                      <span className={`px-2 py-0.5 rounded ${cnt > 30 ? 'bg-blue-50 text-blue-700 font-bold' : ''}`}>
                        {cnt}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
