import React, { useState, useEffect } from 'react';
import {
  Users,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Clock,
  ArrowUpRight,
  Filter,
  CheckCircle,
  Eye,
  Building2,
  PieChart as PieIcon,
  BarChart2
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend
} from 'recharts';
import { api } from '../services/api';
import { ExecutiveKPIs } from '../types';

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

interface ExecutiveOverviewProps {
  onSelectCustomer: (customerId: string) => void;
  selectedAM?: string;
}

export const ExecutiveOverview: React.FC<ExecutiveOverviewProps> = ({
  onSelectCustomer,
  selectedAM
}) => {
  const [data, setData] = useState<ExecutiveKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [regionFilter, setRegionFilter] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');

  const loadData = () => {
    setLoading(true);
    api.getExecutiveKPIs({
      region: regionFilter || undefined,
      industry: industryFilter || undefined,
      account_manager: selectedAM && selectedAM !== 'All Account Managers' ? selectedAM : undefined
    })
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, [regionFilter, industryFilter, selectedAM]);

  if (loading || !data) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[500px]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-500 font-medium">Computing real-time executive analytics across 1,000 accounts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Executive Intelligence Overview</h1>
          <p className="text-xs text-slate-500 mt-1">
            Grounded cross-dataset analytics for i95Dev B2B commerce integration services.
          </p>
        </div>

        {/* Global Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-sm">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-700">Filters:</span>
          </div>

          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Geographic Regions</option>
            <option value="North America - East">North America - East</option>
            <option value="North America - West">North America - West</option>
            <option value="North America - Central">North America - Central</option>
            <option value="Europe - UK & Ireland">Europe - UK & Ireland</option>
            <option value="Europe - DACH / Nordics">Europe - DACH / Nordics</option>
            <option value="APAC - Australia & NZ">APAC - Australia & NZ</option>
          </select>

          <select
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Industry Verticals</option>
            <option value="Manufacturing & Industrial">Manufacturing & Industrial</option>
            <option value="Wholesale & B2B Distribution">Wholesale & B2B Distribution</option>
            <option value="Healthcare & Medical Devices">Healthcare & Medical Devices</option>
            <option value="Automotive Aftermarket & Parts">Automotive Aftermarket & Parts</option>
            <option value="Building Materials & Construction">Building Materials & Construction</option>
            <option value="Consumer Packaged Goods (CPG)">Consumer Packaged Goods (CPG)</option>
            <option value="Technology, Electronics & SaaS">Technology, Electronics & SaaS</option>
          </select>

          {(regionFilter || industryFilter) && (
            <button
              onClick={() => { setRegionFilter(''); setIndustryFilter(''); }}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="saas-card p-5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Accounts</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{data.total_accounts}</span>
            <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              {data.qualified_prospects} Prospects
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Managed across assigned territories</p>
        </div>

        {/* Card 2 */}
        <div className="saas-card p-5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Pipeline</span>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              ${(data.total_pipeline_value / 1_000_000).toFixed(2)}M
            </span>
            <span className="text-[11px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
              {data.open_opportunities_count} Deals
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Avg Deal: ${(data.average_project_value / 1000).toFixed(0)}k</p>
        </div>

        {/* Card 3 */}
        <div className="saas-card p-5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Simulated Outreach</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{data.simulated_followup_count}</span>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              {data.simulated_response_rate}% Resp.
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Conversion: {data.simulated_conversion_rate}%</p>
        </div>

        {/* Card 4 */}
        <div className="saas-card p-5 border-amber-200/80 bg-amber-50/20">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-900">Attention Required</span>
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-900">{data.accounts_requiring_attention}</span>
            <span className="text-[11px] font-medium text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
              High Risk / Idle
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Retention risks & stalled proposals</p>
        </div>
      </div>

      {/* Analytical Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Behavioral Segment Distribution */}
        <div className="saas-card p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-blue-600" />
                Behavioral Segment Distribution
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">Account volume by discovered behavioral cluster</p>
            </div>
            <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
              {data.segment_distribution.length} Clusters
            </span>
          </div>

          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.segment_distribution}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  innerRadius={50}
                  paddingAngle={3}
                >
                  {data.segment_distribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any, name: any) => [`${val} accounts`, name]}
                  contentStyle={{ backgroundColor: '#0B192C', borderColor: '#1E293B', color: '#fff', borderRadius: '8px', fontSize: '11px' }}
                  itemStyle={{ color: '#E2E8F0' }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => <span className="text-[11px] text-slate-600">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pipeline Value by Segment */}
        <div className="saas-card p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-blue-600" />
                Pipeline Concentration by Segment ($)
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">Total open opportunity value across clusters</p>
            </div>
            <span className="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-semibold">
              Live DB Aggregation
            </span>
          </div>

          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.segment_distribution}
                margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#64748B' }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#64748B' }}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Pipeline Value']}
                  contentStyle={{ backgroundColor: '#0B192C', borderColor: '#1E293B', color: '#fff', borderRadius: '8px', fontSize: '11px' }}
                  itemStyle={{ color: '#E2E8F0' }}
                />
                <Bar dataKey="pipeline" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Priority Accounts Requiring Attention */}
      <div className="saas-card p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              Priority Action Accounts (Stalled Proposals & Retention Risks)
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Identified through automated multi-feature anomaly detection
            </p>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Company</th>
                <th className="py-2.5 px-3">Segment</th>
                <th className="py-2.5 px-3">Open Pipeline</th>
                <th className="py-2.5 px-3">Days Inactive</th>
                <th className="py-2.5 px-3">Retention Risk</th>
                <th className="py-2.5 px-3">Assigned AM</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.top_attention_accounts.map((acc: any) => (
                <tr key={acc.customer_id} className="table-row-hover">
                  <td className="py-3 px-3">
                    <span className="font-semibold text-slate-900 block">{acc.company_name}</span>
                    <span className="text-[11px] text-slate-400 font-mono">{acc.customer_id}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded-full font-medium text-[11px] ${
                      acc.cluster_label.includes('Retention') ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                      acc.cluster_label.includes('Stalled') ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {acc.cluster_label}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-800">
                    ${acc.open_pipeline_value.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-slate-600">
                    {acc.days_since_last_interaction.toFixed(0)} days
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${acc.retention_risk_score > 40 ? 'bg-rose-500' : 'bg-amber-500'}`}
                          style={{ width: `${Math.min(acc.retention_risk_score, 100)}%` }}
                        ></div>
                      </div>
                      <span className="font-medium text-slate-700">{acc.retention_risk_score}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-600">
                    {acc.assigned_account_manager}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => onSelectCustomer(acc.customer_id)}
                      className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors inline-flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> 360 View
                    </button>
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
