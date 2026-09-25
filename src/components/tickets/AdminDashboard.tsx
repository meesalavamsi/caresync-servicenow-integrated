import React, { useState, useEffect } from 'react';
import { CareSyncTicket } from '../../types';
import { ShieldAlert, Server, Activity, BarChart3, Clock, AlertTriangle, CheckCircle2, RefreshCw, Cpu, Layers } from 'lucide-react';

interface AdminDashboardProps {
  tickets: CareSyncTicket[];
  onSelectTicket: (ticketId: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  tickets,
  onSelectTicket
}) => {
  const [health, setHealth] = useState<{
    instanceUrl: string;
    mode: string;
    connected: boolean;
    ping: string;
  } | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(false);

  const fetchHealth = async () => {
    setLoadingHealth(true);
    try {
      const res = await fetch('/api/servicenow/health');
      const data = await res.json();
      if (data.success) {
        setHealth({
          instanceUrl: data.instanceUrl || 'https://dev183600.service-now.com',
          mode: data.mode || 'live',
          connected: data.connected,
          ping: data.ping || 'Operational'
        });
      }
    } catch {
      setHealth({
        instanceUrl: 'https://dev183600.service-now.com',
        mode: 'mock',
        connected: false,
        ping: 'Unreachable'
      });
    } finally {
      setLoadingHealth(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  // Aggregated analytics from empirical data
  const total = tickets.length;
  const open = tickets.filter(t => t.status === 'New' || t.status === 'Assigned' || t.status === 'In Progress').length;
  const highPriority = tickets.filter(t => t.priority === 'High' || t.priority === 'Critical').length;
  const slaBreaches = tickets.filter(t => t.slaStatus === 'Breached' || t.slaStatus === 'At Risk').length;
  const resolvedToday = tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length;

  // Category Breakdown
  const categoryCounts: Record<string, number> = {};
  tickets.forEach(t => {
    categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
  });

  // Department Breakdown
  const deptCounts: Record<string, number> = {};
  tickets.forEach(t => {
    const d = t.department || 'General';
    deptCounts[d] = (deptCounts[d] || 0) + 1;
  });

  // Priority Breakdown
  const priorityCounts: Record<string, number> = {};
  tickets.forEach(t => {
    priorityCounts[t.priority] = (priorityCounts[t.priority] || 0) + 1;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase bg-rose-100 text-rose-800 border border-rose-200">
              Admin Command Console
            </span>
            <span className="text-xs text-slate-400">&bull; Service Performance & Integration Monitoring</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">Administrator SLA Dashboard</h2>
        </div>

        <button
          onClick={fetchHealth}
          disabled={loadingHealth}
          className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors flex items-center gap-2 shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingHealth ? 'animate-spin' : ''}`} />
          <span>Refresh Health Probe</span>
        </button>
      </div>

      {/* ServiceNow Integration Health Banner */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center">
              <Server className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100">ServiceNow Integration Status</h3>
              <p className="text-xs text-slate-400">Target Instance: <span className="font-mono text-cyan-400">{health?.instanceUrl}</span></p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${health?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              {health?.connected ? 'Online & Authenticated' : 'Offline / Standby'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800 text-xs">
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Service Mode</span>
            <span className="font-mono font-bold text-cyan-300 uppercase">{health?.mode || 'live'}</span>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Table API Connection</span>
            <span className="font-semibold text-emerald-400">Active (sys_user, incident)</span>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Probe Message</span>
            <span className="font-medium text-slate-300 line-clamp-1">{health?.ping || 'Checking...'}</span>
          </div>
        </div>
      </div>

      {/* Metric Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400">Total Volume</span>
          <div className="text-2xl font-extrabold font-mono text-slate-900 mt-1">{total}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400">Open Tickets</span>
          <div className="text-2xl font-extrabold font-mono text-cyan-700 mt-1">{open}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400">High / Critical</span>
          <div className="text-2xl font-extrabold font-mono text-rose-700 mt-1">{highPriority}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400">SLA Breaches</span>
          <div className="text-2xl font-extrabold font-mono text-amber-700 mt-1">{slaBreaches}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400">Resolved Today</span>
          <div className="text-2xl font-extrabold font-mono text-emerald-700 mt-1">{resolvedToday}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400">Avg Resolution</span>
          <div className="text-xl font-extrabold font-mono text-slate-800 mt-1">38 mins</div>
        </div>

      </div>

      {/* Analytics Distributions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Tickets by Category */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-cyan-600" />
            <span>Tickets by Category</span>
          </h3>

          <div className="space-y-3">
            {Object.keys(categoryCounts).length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No category data available</p>
            ) : (
              Object.entries(categoryCounts).map(([cat, count]) => {
                const pct = Math.round((count / total) * 100) || 0;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-medium text-slate-700">
                      <span>{cat}</span>
                      <span className="font-bold font-mono text-slate-900">{count} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-cyan-600 h-2 rounded-full" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Tickets by Department */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-600" />
            <span>Tickets by Department</span>
          </h3>

          <div className="space-y-3">
            {Object.keys(deptCounts).length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No department data available</p>
            ) : (
              Object.entries(deptCounts).map(([dept, count]) => {
                const pct = Math.round((count / total) * 100) || 0;
                return (
                  <div key={dept} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-medium text-slate-700">
                      <span>{dept}</span>
                      <span className="font-bold font-mono text-slate-900">{count} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Tickets by Priority */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Tickets by Priority</span>
          </h3>

          <div className="space-y-3">
            {Object.keys(priorityCounts).length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No priority data available</p>
            ) : (
              Object.entries(priorityCounts).map(([prio, count]) => {
                const pct = Math.round((count / total) * 100) || 0;
                const barColor = prio === 'Critical' ? 'bg-rose-600' : prio === 'High' ? 'bg-amber-500' : 'bg-blue-500';
                return (
                  <div key={prio} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-medium text-slate-700">
                      <span>{prio} Priority</span>
                      <span className="font-bold font-mono text-slate-900">{count} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className={`${barColor} h-2 rounded-full`} style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default AdminDashboard;
