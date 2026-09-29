import React, { useState, useEffect } from 'react';
import {
  Database,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  BookOpen,
  ShieldCheck,
  Table,
  Layers
} from 'lucide-react';
import { api } from '../services/api';

export const DataManagement: React.FC = () => {
  const [datasets, setDatasets] = useState<any[]>([]);
  const [dictionary, setDictionary] = useState<any>(null);
  const [validation, setValidation] = useState<any>(null);
  const [lastGenerated, setLastGenerated] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Regeneration state
  const [seed, setSeed] = useState(42);
  const [count, setCount] = useState(1000);
  const [regenerating, setRegenerating] = useState(false);
  const [regenSuccess, setRegenSuccess] = useState<string | null>(null);

  // Active view: 'datasets' | 'dictionary' | 'validation'
  const [activeTab, setActiveTab] = useState<'datasets' | 'dictionary' | 'validation'>('datasets');

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.getDatasets(),
      api.getDataDictionary(),
      api.validateData()
    ])
      .then(([dsRes, dictRes, valRes]) => {
        setDatasets(dsRes.datasets);
        setLastGenerated(dsRes.last_generated_at);
        setDictionary(dictRes);
        setValidation(valRes);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRegenerate = async () => {
    setRegenerating(true);
    setRegenSuccess(null);
    try {
      const res = await api.regenerateData(seed, count);
      setRegenSuccess(res.message);
      await loadData();
      setRegenerating(false);
    } catch (err: any) {
      console.error(err);
      setRegenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[500px]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-500 font-medium">Inspecting relational database datasets and validation health...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Data Architecture & Governance
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Inspect relational datasets, download CSV exports, audit foreign-key integrity, and regenerate synthetic records.
          </p>
        </div>

        <div className="text-right text-xs text-slate-500">
          <span>Last Processed: </span>
          <strong className="text-slate-800 font-mono">{lastGenerated}</strong>
        </div>
      </div>

      {/* Dataset Regeneration Panel */}
      <div className="saas-card p-6 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50 border-blue-200/80 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">Synthetic Dataset Generator</h2>
          </div>
          <span className="text-[11px] font-mono text-slate-500">Deterministic Seed Model</span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
          Regenerate the entire 6-table relational dataset (accounts, transactions, touchpoints, tickets, pipeline, campaign logs) 
          using a reproducible pseudo-random seed. The pipeline automatically recalculates behavioral features and re-clusters.
        </p>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <div className="flex items-center gap-2 text-xs">
            <label className="font-semibold text-slate-700">Random Seed:</label>
            <input
              type="number"
              value={seed}
              onChange={(e) => setSeed(parseInt(e.target.value) || 42)}
              className="w-20 px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 font-mono"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <label className="font-semibold text-slate-700">Account Volume:</label>
            <input
              type="number"
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value) || 1000)}
              className="w-24 px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 font-mono"
            />
          </div>

          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} />
            <span>Regenerate Dataset</span>
          </button>
        </div>

        {regenSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{regenSuccess}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('datasets')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'datasets' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Datasets & CSV Exports ({datasets.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('validation')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'validation' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Data Validation Suite ({validation?.checks.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('dictionary')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'dictionary' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Data Dictionary</span>
        </button>
      </div>

      {/* TAB 1: Datasets & Downloads */}
      {activeTab === 'datasets' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {datasets.map((tbl) => (
            <div key={tbl.table_name} className="saas-card p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-slate-900 font-mono">
                      {tbl.table_name}
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 font-semibold">
                    {tbl.file_size_kb} KB
                  </span>
                </div>

                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900 font-mono">
                    {tbl.record_count.toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-500">records</span>
                </div>

                {/* Sample Columns */}
                {tbl.sample_records && tbl.sample_records.length > 0 && (
                  <div className="mt-3 text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-700 block mb-1">Key Fields:</span>
                    <div className="flex flex-wrap gap-1">
                      {Object.keys(tbl.sample_records[0]).slice(0, 5).map(f => (
                        <span key={f} className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-600">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <a
                href={`/api/data/download/${tbl.table_name}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" /> Download {tbl.csv_filename}
              </a>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: Validation Health Suite */}
      {activeTab === 'validation' && (
        <div className="saas-card overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">Relational Database Health & Schema Validation</h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              {validation.passed_checks} / {validation.total_checks} CHECKS PASSED
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {validation.checks.map((chk: any, i: number) => (
              <div key={i} className="p-4 text-xs flex items-start justify-between gap-4 hover:bg-slate-50">
                <div className="space-y-1">
                  <span className="font-bold text-slate-900 block">{chk.check}</span>
                  <span className="text-slate-600 text-[11px] block">{chk.details}</span>
                </div>
                <span className={`px-2 py-0.5 rounded font-bold text-[10px] font-mono ${
                  chk.status === 'PASS' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800'
                }`}>
                  {chk.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Data Dictionary */}
      {activeTab === 'dictionary' && dictionary && (
        <div className="space-y-6">
          {Object.entries(dictionary).map(([tblName, tblInfo]: [string, any]) => (
            <div key={tblName} className="saas-card p-6 space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-mono">{tblName}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{tblInfo.description}</p>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  {Object.keys(tblInfo.fields || {}).length} Columns
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3 w-1/4">Field Name</th>
                      <th className="py-2 px-3">Description & Valid Values</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Object.entries(tblInfo.fields || {}).map(([fName, fDesc]: [string, any]) => (
                      <tr key={fName} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono font-bold text-blue-700">{fName}</td>
                        <td className="py-2 px-3 text-slate-700">{fDesc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
