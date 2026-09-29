import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Download,
  Eye,
  Building2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  PhoneCall,
  Mail
} from 'lucide-react';
import { api } from '../services/api';
import { Customer } from '../types';

interface CustomerIntelligenceProps {
  onSelectCustomer: (customerId: string) => void;
  onOpenMessageCentre?: (customerId: string, triggerName: string) => void;
  selectedAM?: string;
}

export const CustomerIntelligence: React.FC<CustomerIntelligenceProps> = ({
  onSelectCustomer,
  onOpenMessageCentre,
  selectedAM
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [segment, setSegment] = useState('');
  const [industry, setIndustry] = useState('');
  const [region, setRegion] = useState('');
  const [accountType, setAccountType] = useState('');
  const [page, setPage] = useState(0);
  const limit = 20;

  const loadCustomers = () => {
    setLoading(true);
    api.getCustomers({
      search: search || undefined,
      segment: segment || undefined,
      industry: industry || undefined,
      region: region || undefined,
      account_manager: selectedAM && selectedAM !== 'All Account Managers' ? selectedAM : undefined,
      limit,
      offset: page * limit
    })
      .then(res => {
        setCustomers(res.customers);
        setTotal(res.total);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadCustomers();
  }, [search, segment, industry, region, accountType, selectedAM, page]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Customer Intelligence Directory</h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse, search, and inspect 360-degree behavioral profiles across {total} enterprise accounts.
          </p>
        </div>

        <a
          href="/api/customers/export/csv"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg shadow-sm transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" /> Export Customers CSV
        </a>
      </div>

      {/* Filter and Search Bar */}
      <div className="saas-card p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by company name or customer ID (e.g. Apex, CUST-0042)..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={segment}
              onChange={(e) => { setSegment(e.target.value); setPage(0); }}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Behavioral Segments</option>
              <option value="High-Intent Prospects">High-Intent Prospects</option>
              <option value="Engaged Growth Accounts">Engaged Growth Accounts</option>
              <option value="Stalled Opportunities">Stalled Opportunities</option>
              <option value="Existing Clients - Expansion Potential">Existing Clients - Expansion Potential</option>
              <option value="Retention & Support Risk">Retention & Support Risk</option>
            </select>

            <select
              value={industry}
              onChange={(e) => { setIndustry(e.target.value); setPage(0); }}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Industries</option>
              <option value="Manufacturing & Industrial">Manufacturing & Industrial</option>
              <option value="Wholesale & B2B Distribution">Wholesale & B2B Distribution</option>
              <option value="Healthcare & Medical Devices">Healthcare & Medical Devices</option>
              <option value="Automotive Aftermarket & Parts">Automotive Aftermarket & Parts</option>
              <option value="Building Materials & Construction">Building Materials & Construction</option>
              <option value="Technology, Electronics & SaaS">Technology, Electronics & SaaS</option>
            </select>

            {(search || segment || industry) && (
              <button
                onClick={() => { setSearch(''); setSegment(''); setIndustry(''); setPage(0); }}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Directory Table */}
      <div className="saas-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Account ID & Company</th>
                <th className="py-3 px-4">Industry & Size</th>
                <th className="py-3 px-4">Behavioral Segment</th>
                <th className="py-3 px-4">Billings</th>
                <th className="py-3 px-4">Pipeline</th>
                <th className="py-3 px-4">Engagement</th>
                <th className="py-3 px-4">Retention Risk</th>
                <th className="py-3 px-4">Consent</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Loading accounts...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No accounts match the current filters.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.customer_id} className="table-row-hover">
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => onSelectCustomer(c.customer_id)}
                        className="font-bold text-slate-900 hover:text-blue-600 text-left block"
                      >
                        {c.company_name}
                      </button>
                      <span className="text-[11px] text-slate-400 font-mono">{c.customer_id}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <span className="block font-medium text-slate-800">{c.industry}</span>
                      <span className="text-[11px] text-slate-400">{c.company_size} | {c.region}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full font-medium text-[11px] ${
                        c.cluster_label.includes('High-Intent') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        c.cluster_label.includes('Retention') ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        c.cluster_label.includes('Stalled') ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {c.cluster_label}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      ${c.total_revenue.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-blue-700">
                      {c.open_pipeline_value > 0 ? `$${c.open_pipeline_value.toLocaleString()}` : '--'}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500"
                            style={{ width: `${Math.min(c.engagement_score, 100)}%` }}
                          ></div>
                        </div>
                        <span className="font-medium text-slate-700">{c.engagement_score}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block">{c.days_since_last_interaction.toFixed(0)}d since touch</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`font-semibold ${c.retention_risk_score > 35 ? 'text-rose-600' : 'text-slate-600'}`}>
                        {c.retention_risk_score} / 100
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${c.consent_email ? 'bg-emerald-500' : 'bg-slate-300'}`} title="Email Consent"></span>
                        <span className={`w-2 h-2 rounded-full ${c.consent_whatsapp ? 'bg-emerald-500' : 'bg-slate-300'}`} title="WhatsApp Consent"></span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => onSelectCustomer(c.customer_id)}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> 360 View
                      </button>
                      {onOpenMessageCentre && (
                        <button
                          onClick={() => onOpenMessageCentre(c.customer_id, `Follow-up for ${c.company_name}`)}
                          className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors inline-flex items-center gap-1"
                        >
                          Message
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span>
            Showing <strong>{Math.min(total, page * limit + 1)}</strong> to{' '}
            <strong>{Math.min(total, (page + 1) * limit)}</strong> of <strong>{total}</strong> accounts
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 font-medium flex items-center gap-1 shadow-sm"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>
            <span className="font-medium text-slate-700">
              Page {page + 1} of {Math.ceil(total / limit) || 1}
            </span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={(page + 1) * limit >= total}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 font-medium flex items-center gap-1 shadow-sm"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
