import React from 'react';
import { RefreshCw, Radio, CheckCircle2, UserCircle2, Server } from 'lucide-react';

interface TopNavProps {
  onRefreshData?: () => void;
  isRefreshing?: boolean;
  selectedAM?: string;
  onSelectAM?: (am: string) => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  onRefreshData,
  isRefreshing = false,
  selectedAM,
  onSelectAM
}) => {
  const accountManagers = [
    'All Account Managers',
    'Sarah Jenkins',
    'David Vance',
    'Ananya Sharma',
    'Marcus Brody',
    'Elena Rostova'
  ];

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-10 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="flex items-center gap-3">
        <span className="flex h-2.5 w-2.5 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-800 tracking-wide uppercase">Engine Status:</span>
          <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Operational & Synced
          </span>
        </div>
        <div className="hidden md:flex items-center gap-1.5 ml-4 pl-4 border-l border-slate-200 text-xs text-slate-500">
          <Radio className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
          <span>Simulated WhatsApp & Email Adapter Active</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Account Manager Filter */}
        <div className="flex items-center gap-2">
          <UserCircle2 className="w-4 h-4 text-slate-400" />
          <select
            value={selectedAM || 'All Account Managers'}
            onChange={(e) => onSelectAM && onSelectAM(e.target.value)}
            className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {accountManagers.map((am) => (
              <option key={am} value={am}>
                {am}
              </option>
            ))}
          </select>
        </div>

        {/* Refresh button */}
        {onRefreshData && (
          <button
            onClick={onRefreshData}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors shadow-sm disabled:opacity-50"
            title="Refresh analytics and cache"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Sync Data</span>
          </button>
        )}

        <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
          <div className="w-7 h-7 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-xs font-bold text-blue-700">
            i95
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-semibold text-slate-800 leading-none">Enterprise Admin</p>
            <p className="text-[10px] text-slate-400 leading-none mt-1">i95Dev AI Ops</p>
          </div>
        </div>
      </div>
    </header>
  );
};
