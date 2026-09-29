import React from 'react';
import {
  LayoutDashboard,
  Users,
  Network,
  Sparkles,
  Workflow,
  MessageSquare,
  BarChart3,
  Bot,
  Scale,
  Database,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

export type NavTab = 
  | 'overview'
  | 'customers'
  | 'segments'
  | 'recommendations'
  | 'automation'
  | 'messages'
  | 'analytics'
  | 'analyst'
  | 'impact'
  | 'data';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  pendingTasksCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  pendingTasksCount = 0
}) => {
  const navItems = [
    { id: 'overview', label: 'Executive Overview', icon: LayoutDashboard },
    { id: 'customers', label: 'Customer Intelligence', icon: Users },
    { id: 'segments', label: 'Behavioral Segments', icon: Network },
    { id: 'recommendations', label: 'AI Recommendations', icon: Sparkles },
    { 
      id: 'automation', 
      label: 'Follow-Up Automation', 
      icon: Workflow,
      badge: pendingTasksCount > 0 ? pendingTasksCount : undefined 
    },
    { id: 'messages', label: 'Message Centre', icon: MessageSquare },
    { id: 'analytics', label: 'Campaign Analytics', icon: BarChart3 },
    { id: 'analyst', label: 'AI Analyst', icon: Bot },
    { id: 'impact', label: 'Business Impact', icon: Scale },
    { id: 'data', label: 'Data Management', icon: Database },
  ];

  return (
    <aside className="w-64 bg-[#0B192C] text-slate-200 flex flex-col flex-shrink-0 h-screen sticky top-0 border-r border-slate-800 shadow-xl z-20">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 gap-3 border-b border-slate-800/80 bg-[#071322]">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/20 text-lg">
          i95
        </div>
        <div>
          <div className="font-bold text-sm tracking-wide text-white flex items-center gap-1.5">
            i95Dev <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-400/30">Intelligence</span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">B2B Commerce & Follow-Up</p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Core Platform
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as NavTab)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 group ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/30'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 text-slate-950">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Safeguard & Prototype Mode Notice */}
      <div className="p-3 border-t border-slate-800/80 bg-[#071322]/80">
        <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Safeguards Active</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
            Prototype simulation sandbox. 100% synthetic contacts; live delivery disabled.
          </p>
        </div>
      </div>
    </aside>
  );
};
