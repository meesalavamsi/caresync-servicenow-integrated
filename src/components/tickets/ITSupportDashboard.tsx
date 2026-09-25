import React, { useState } from 'react';
import { CareSyncTicket, UserSession } from '../../types';
import { Wrench, Clock, AlertTriangle, CheckCircle2, UserCheck, ShieldAlert, Play, MessageSquare, Check, Eye } from 'lucide-react';

interface ITSupportDashboardProps {
  user: UserSession;
  tickets: CareSyncTicket[];
  onSelectTicket: (ticketId: string) => void;
  onTicketUpdated: (updatedTicket: CareSyncTicket) => void;
}

export const ITSupportDashboard: React.FC<ITSupportDashboardProps> = ({
  user,
  tickets,
  onSelectTicket,
  onTicketUpdated
}) => {
  const [activeQueueFilter, setActiveQueueFilter] = useState<'all' | 'assigned_to_me' | 'high_priority' | 'sla_risk'>('all');

  const newCount = tickets.filter(t => t.status === 'New').length;
  const assignedToMe = tickets.filter(t => t.assignedTo.toLowerCase().includes(user.name.toLowerCase().split(' ')[0])).length;
  const highPriorityCount = tickets.filter(t => t.priority === 'High' || t.priority === 'Critical').length;
  const slaRiskCount = tickets.filter(t => t.slaStatus === 'At Risk' || t.slaStatus === 'Breached').length;
  const inProgressCount = tickets.filter(t => t.status === 'In Progress').length;
  const resolvedTodayCount = tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length;

  const filteredTickets = tickets.filter(t => {
    if (activeQueueFilter === 'assigned_to_me') {
      return t.assignedTo.toLowerCase().includes(user.name.toLowerCase().split(' ')[0]);
    }
    if (activeQueueFilter === 'high_priority') {
      return t.priority === 'High' || t.priority === 'Critical';
    }
    if (activeQueueFilter === 'sla_risk') {
      return t.slaStatus === 'At Risk' || t.slaStatus === 'Breached';
    }
    return true;
  });

  const handleAssignToMe = async (ticketId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignedTo: user.name,
          actor: user.name,
          workNote: `Assigned ticket to ${user.name}`
        }),
      });
      const data = await res.json();
      if (data.success && data.ticket) {
        onTicketUpdated(data.ticket);
      }
    } catch {
      alert('Failed to assign ticket.');
    }
  };

  const handleStartWork = async (ticketId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'In Progress',
          actor: user.name,
          workNote: 'Work started by IT Technician.'
        }),
      });
      const data = await res.json();
      if (data.success && data.ticket) {
        onTicketUpdated(data.ticket);
      }
    } catch {
      alert('Failed to update status.');
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p.toLowerCase()) {
      case 'critical': return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'high': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s.toLowerCase()) {
      case 'new': return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'in progress': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'waiting': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'resolved': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'closed': return 'bg-slate-100 text-slate-600 border-slate-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-200">
              IT Support Workspace
            </span>
            <span className="text-xs text-slate-400">&bull; ServiceNow Operational Desk</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">IT Service Queue</h2>
        </div>
      </div>

      {/* Operational Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        
        <button
          onClick={() => setActiveQueueFilter('all')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeQueueFilter === 'all'
              ? 'bg-slate-900 text-white border-slate-900 ring-2 ring-slate-400/30'
              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">New Queue</div>
          <div className="text-2xl font-extrabold font-mono mt-1">{newCount}</div>
        </button>

        <button
          onClick={() => setActiveQueueFilter('assigned_to_me')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeQueueFilter === 'assigned_to_me'
              ? 'bg-cyan-950 text-cyan-100 border-cyan-700 ring-2 ring-cyan-500/30'
              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-600">Assigned To Me</div>
          <div className="text-2xl font-extrabold font-mono mt-1 text-cyan-700">{assignedToMe}</div>
        </button>

        <button
          onClick={() => setActiveQueueFilter('high_priority')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeQueueFilter === 'high_priority'
              ? 'bg-rose-950 text-rose-100 border-rose-700 ring-2 ring-rose-500/30'
              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-rose-600">High Priority</div>
          <div className="text-2xl font-extrabold font-mono mt-1 text-rose-700">{highPriorityCount}</div>
        </button>

        <button
          onClick={() => setActiveQueueFilter('sla_risk')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeQueueFilter === 'sla_risk'
              ? 'bg-amber-950 text-amber-100 border-amber-700 ring-2 ring-amber-500/30'
              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600">SLA At Risk</div>
          <div className="text-2xl font-extrabold font-mono mt-1 text-amber-700">{slaRiskCount}</div>
        </button>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 text-slate-800">
          <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600">In Progress</div>
          <div className="text-2xl font-extrabold font-mono mt-1 text-blue-700">{inProgressCount}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 text-slate-800">
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Resolved Today</div>
          <div className="text-2xl font-extrabold font-mono mt-1 text-emerald-700">{resolvedTodayCount}</div>
        </div>

      </div>

      {/* IT Support Operational Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Operational Service Queue ({filteredTickets.length} active)
          </h3>
          <span className="text-xs text-slate-400">Click row to open details or use quick actions</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="px-6 py-3">Ticket</th>
                <th className="px-6 py-3">Requester & Location</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Priority</th>
                <th className="px-6 py-3">Assigned Technician</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">SLA Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-slate-400">
                    No tickets in this queue view.
                  </td>
                </tr>
              ) : (
                filteredTickets.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => onSelectTicket(t.id)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 font-mono font-bold text-cyan-700">
                      {t.number}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 line-clamp-1">{t.shortDescription}</div>
                      <div className="text-[10px] text-slate-400">{t.caller} ({t.department || 'Hospital'})</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-600">
                      {t.category}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getPriorityBadge(t.priority)}`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800">
                      {t.assignedTo}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(t.status)}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                        t.slaStatus === 'At Risk' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        t.slaStatus === 'Breached' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {t.slaStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {t.assignedTo === 'Unassigned' && (
                          <button
                            onClick={(e) => handleAssignToMe(t.id, e)}
                            className="px-2.5 py-1 rounded-md bg-cyan-50 text-cyan-700 hover:bg-cyan-100 text-[11px] font-semibold transition-colors"
                            title="Assign to Me"
                          >
                            Assign Me
                          </button>
                        )}
                        {t.status === 'New' || t.status === 'Assigned' ? (
                          <button
                            onClick={(e) => handleStartWork(t.id, e)}
                            className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 text-[11px] font-semibold transition-colors"
                          >
                            Start Work
                          </button>
                        ) : null}
                        <button
                          onClick={() => onSelectTicket(t.id)}
                          className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default ITSupportDashboard;
