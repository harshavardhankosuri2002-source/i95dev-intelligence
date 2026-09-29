import React, { useState, useEffect } from 'react';
import {
  Workflow,
  Play,
  Pause,
  Settings,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  Send,
  RefreshCw,
  AlertTriangle,
  History,
  FileCheck,
  Edit3
} from 'lucide-react';
import { api } from '../services/api';
import { AutomationRule, ScheduledTask } from '../types';

export const FollowUpAutomation: React.FC = () => {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'rules' | 'tasks' | 'audit'>('rules');
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [taskFilter, setTaskFilter] = useState<string>('');

  // Editing state for message
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editedText, setEditedText] = useState('');

  const loadAll = () => {
    setLoading(true);
    Promise.all([
      api.getRules(),
      api.getTasks(taskFilter || undefined),
      api.getAuditLogs()
    ])
      .then(([rulesRes, tasksRes, auditRes]) => {
        setRules(rulesRes);
        setTasks(tasksRes);
        setAuditLogs(auditRes);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadAll();
  }, [taskFilter]);

  const handleToggleRule = async (ruleId: string) => {
    try {
      await api.toggleRule(ruleId);
      loadAll();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEvaluate = async () => {
    setEvaluating(true);
    try {
      await api.evaluateTriggers();
      await loadAll();
      setEvaluating(false);
    } catch (err) {
      console.error(err);
      setEvaluating(false);
    }
  };

  const handleDispatch = async () => {
    setDispatching(true);
    try {
      await api.dispatchApprovedTasks();
      await loadAll();
      setDispatching(false);
    } catch (err) {
      console.error(err);
      setDispatching(false);
    }
  };

  const handleTaskAction = async (taskId: string, action: string) => {
    try {
      await api.updateTaskAction(taskId, action, editingTaskId === taskId ? editedText : undefined);
      setEditingTaskId(null);
      loadAll();
    } catch (err) {
      console.error(err);
    }
  };

  const pendingCount = tasks.filter(t => t.status === 'PENDING' || t.status === 'APPROVED').length;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Follow-Up Automation & Workflow Engine
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Rule-based trigger evaluation, frequency capping, suppression safeguards, and scheduled task approval.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleEvaluate}
            disabled={evaluating}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${evaluating ? 'animate-spin' : ''}`} />
            <span>Evaluate Triggers Now</span>
          </button>

          <button
            onClick={handleDispatch}
            disabled={dispatching}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Dispatch Approved ({pendingCount})</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('rules')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
            activeTab === 'rules' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Active Trigger Rules ({rules.length})
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'tasks' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Scheduled Tasks Queue</span>
          {pendingCount > 0 && (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeTab === 'tasks' ? 'bg-white text-blue-700' : 'bg-blue-600 text-white'}`}>
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
            activeTab === 'audit' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Audit Trail Logs ({auditLogs.length})
        </button>
      </div>

      {/* TAB 1: Trigger Rules */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {rules.map((rule) => (
              <div
                key={rule.rule_id}
                className={`saas-card p-5 border-l-4 ${
                  rule.is_active ? 'border-l-emerald-500' : 'border-l-slate-300 opacity-75'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
                        {rule.rule_id}
                      </span>
                      <h2 className="text-sm font-bold text-slate-900">
                        {rule.trigger_name}
                      </h2>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        rule.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {rule.is_active ? 'ACTIVE' : 'PAUSED'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
                      {rule.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleRule(rule.rule_id)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
                        rule.is_active
                          ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      {rule.is_active ? (
                        <>
                          <Pause className="w-3.5 h-3.5" /> Pause Rule
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5" /> Activate
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Rule Settings Chips */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-3 text-[11px] text-slate-500">
                  <span className="bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
                    Delay: <strong>{rule.delay_days} days</strong>
                  </span>
                  <span className="bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
                    Channel: <strong>{rule.preferred_channel}</strong>
                  </span>
                  <span className="bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
                    Max Attempts: <strong>{rule.max_attempts}</strong>
                  </span>
                  <span className="bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
                    Min Interval: <strong>{rule.min_interval_days} days</strong>
                  </span>
                  <span className="bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
                    Daily Limit: <strong>{rule.daily_limit} accounts/run</strong>
                  </span>
                  <span className="bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
                    Human Review: <strong>{rule.require_human_approval ? 'Required' : 'Auto-Approve'}</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Scheduled Tasks Queue */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          {/* Status Filter */}
          <div className="flex gap-2">
            {['', 'PENDING', 'APPROVED', 'SUPPRESSED', 'EXECUTED'].map((st) => (
              <button
                key={st}
                onClick={() => setTaskFilter(st)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                  taskFilter === st
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {st === '' ? 'All Tasks' : st}
              </button>
            ))}
          </div>

          <div className="saas-card overflow-hidden">
            <div className="divide-y divide-slate-100">
              {tasks.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  No tasks currently in queue. Click "Evaluate Triggers Now" to process accounts.
                </div>
              ) : (
                tasks.map((task) => (
                  <div key={task.task_id} className="p-4 text-xs space-y-2 hover:bg-slate-50/70">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                          {task.task_id}
                        </span>
                        <strong className="text-slate-900">{task.company_name || task.customer_id}</strong>
                        <span className="text-slate-500 font-normal">via {task.channel}</span>
                        <span className="text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {task.trigger_reason}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          task.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                          task.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                          task.status === 'SUPPRESSED' ? 'bg-rose-100 text-rose-800' :
                          'bg-slate-200 text-slate-700'
                        }`}>
                          {task.status}
                        </span>

                        {task.status === 'PENDING' && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleTaskAction(task.task_id, 'APPROVE')}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium text-[11px]"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleTaskAction(task.task_id, 'REJECT')}
                              className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-medium text-[11px]"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Message Preview or Edit */}
                    {editingTaskId === task.task_id ? (
                      <div className="space-y-2">
                        <textarea
                          rows={4}
                          value={editedText}
                          onChange={(e) => setEditedText(e.target.value)}
                          className="w-full text-xs font-mono p-2 border border-blue-400 rounded-lg focus:outline-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleTaskAction(task.task_id, 'APPROVE')}
                            className="px-2.5 py-1 bg-blue-600 text-white rounded text-[11px] font-semibold"
                          >
                            Save & Approve
                          </button>
                          <button
                            onClick={() => setEditingTaskId(null)}
                            className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded text-[11px]"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="relative group">
                        <p className="text-slate-600 font-mono text-[11px] bg-slate-50 p-2.5 rounded border border-slate-200 whitespace-pre-line">
                          {task.generated_message}
                        </p>
                        {task.status === 'PENDING' && (
                          <button
                            onClick={() => { setEditingTaskId(task.task_id); setEditedText(task.generated_message); }}
                            className="absolute top-2 right-2 p-1 bg-white hover:bg-slate-100 rounded border border-slate-200 text-slate-500 shadow-sm"
                            title="Edit Draft Message"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}

                    {task.suppression_reason && (
                      <div className="text-[11px] text-rose-700 bg-rose-50 px-2.5 py-1 rounded border border-rose-200 flex items-center gap-1.5 font-medium">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                        <span>Suppression Guard: {task.suppression_reason}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Audit Trail Logs */}
      {activeTab === 'audit' && (
        <div className="saas-card overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase tracking-wide">
            Automated Trigger & Execution Audit Trail
          </div>
          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {auditLogs.map((log) => (
              <div key={log.log_id} className="p-3.5 text-xs flex items-start gap-3 hover:bg-slate-50">
                <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap mt-0.5">
                  {log.timestamp}
                </span>
                <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[10px] whitespace-nowrap">
                  {log.event_type}
                </span>
                <span className="text-slate-700 flex-1">{log.details}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
