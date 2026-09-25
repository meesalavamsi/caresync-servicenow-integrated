import React, { useState } from 'react';
import { CareSyncTicket, UserSession } from '../../types';
import { ArrowLeft, Clock, CheckCircle2, User, Building2, MapPin, Tag, AlertTriangle, Paperclip, Send, MessageSquare, ShieldCheck, Activity } from 'lucide-react';

interface TicketDetailsViewProps {
  ticket: CareSyncTicket;
  user: UserSession;
  onBack: () => void;
  onTicketUpdated: (updatedTicket: CareSyncTicket) => void;
}

export const TicketDetailsView: React.FC<TicketDetailsViewProps> = ({
  ticket,
  user,
  onBack,
  onTicketUpdated
}) => {
  const [newWorkNote, setNewWorkNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [resolutionText, setResolutionText] = useState('');
  const [showResolveModal, setShowResolveModal] = useState(false);

  const isITSupportOrAdmin = user.role === 'it_support' || user.role === 'admin';

  const handleAddWorkNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkNote.trim()) return;

    setAddingNote(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: newWorkNote,
          author: user.name,
          role: user.role
        }),
      });

      const data = await res.json();
      if (data.success && data.ticket) {
        onTicketUpdated(data.ticket);
        setNewWorkNote('');
      }
    } catch {
      alert('Failed to add work note');
    } finally {
      setAddingNote(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          actor: user.name,
          resolutionNotes: newStatus === 'Resolved' ? resolutionText || 'Issue resolved by IT technician.' : undefined
        }),
      });

      const data = await res.json();
      if (data.success && data.ticket) {
        onTicketUpdated(data.ticket);
        setShowResolveModal(false);
      }
    } catch {
      alert('Failed to update status');
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s.toLowerCase()) {
      case 'new': return 'bg-cyan-100 text-cyan-800 border-cyan-300';
      case 'in progress': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'waiting': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'resolved': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'closed': return 'bg-slate-200 text-slate-800 border-slate-300';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getSLAStyle = (sla: string) => {
    switch (sla.toLowerCase()) {
      case 'on track': case 'met': case 'within sla':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'at risk':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'breached':
        return 'text-rose-700 bg-rose-50 border-rose-200';
      default:
        return 'text-slate-700 bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-start gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors mt-0.5"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono font-extrabold text-sm text-cyan-700 bg-cyan-50 px-2.5 py-0.5 rounded-lg border border-cyan-200">
                {ticket.number}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadge(ticket.status)}`}>
                {ticket.status}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                {ticket.priority} Priority
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">{ticket.shortDescription}</h2>
          </div>
        </div>

        {/* Quick Tech Actions */}
        {isITSupportOrAdmin && (
          <div className="flex items-center gap-2 shrink-0">
            {ticket.status !== 'In Progress' && ticket.status !== 'Resolved' && ticket.status !== 'Closed' && (
              <button
                onClick={() => handleStatusChange('In Progress')}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-xs"
              >
                Start Work
              </button>
            )}
            {ticket.status !== 'Resolved' && ticket.status !== 'Closed' && (
              <button
                onClick={() => setShowResolveModal(true)}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-xs"
              >
                Resolve Ticket
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Details, Notes & Timeline */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Description */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Issue Description</h3>
            <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-100 font-sans">
              {ticket.description || 'No detailed description provided.'}
            </p>

            {ticket.patientName && (
              <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-blue-900 flex items-center justify-between">
                <span className="font-semibold">Attached Patient Context:</span>
                <span className="font-medium">{ticket.patientName} ({ticket.patientId || 'N/A'})</span>
              </div>
            )}

            {ticket.resolutionNotes && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-1">
                <span className="font-bold uppercase tracking-wider text-[10px] text-emerald-700 block">Resolution Notes</span>
                <p className="font-medium">{ticket.resolutionNotes}</p>
              </div>
            )}
          </div>

          {/* Work Notes / Activity Feed */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-cyan-600" />
                <span>Work Notes & Comments</span>
              </h3>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                {ticket.workNotes.length} entries
              </span>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {ticket.workNotes.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No work notes posted yet.</p>
              ) : (
                ticket.workNotes.map((note) => (
                  <div key={note.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">{note.author}</span>
                      <span className="text-[10px] text-slate-400 font-medium">{note.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-normal">{note.text}</p>
                  </div>
                ))
              )}
            </div>

            {/* Add Work Note Form */}
            <form onSubmit={handleAddWorkNote} className="pt-3 border-t border-slate-100 flex items-center gap-2">
              <input
                type="text"
                value={newWorkNote}
                onChange={(e) => setNewWorkNote(e.target.value)}
                placeholder="Add a work note or update..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <button
                type="submit"
                disabled={addingNote || !newWorkNote.trim()}
                className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Post Note</span>
              </button>
            </form>
          </div>

        </div>

        {/* Right Col: Metadata & Timeline */}
        <div className="space-y-6">
          
          {/* Ticket Metadata Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Service Metadata</h3>

            <div className="space-y-3 text-xs">
              
              {/* SLA Indicator */}
              <div className={`p-3 rounded-xl border flex items-center justify-between ${getSLAStyle(ticket.slaStatus)}`}>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span className="font-bold">SLA Status</span>
                </div>
                <span className="font-semibold text-[11px]">{ticket.slaStatus} ({ticket.slaTimeLeft})</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  Category
                </span>
                <span className="font-semibold text-slate-800">{ticket.category}</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  Subcategory
                </span>
                <span className="font-semibold text-slate-800">{ticket.subcategory}</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  Caller
                </span>
                <span className="font-semibold text-slate-800">{ticket.caller}</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                  Assigned To
                </span>
                <span className="font-semibold text-cyan-700">{ticket.assignedTo}</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  Location
                </span>
                <span className="font-semibold text-slate-800">{ticket.location || ticket.department}</span>
              </div>

              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-500">Created Date</span>
                <span className="font-medium text-slate-600">
                  {new Date(ticket.created).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

            </div>
          </div>

          {/* Timeline Breakdown */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Timeline Progress</h3>

            <div className="relative border-l-2 border-slate-200 ml-3 space-y-6 pl-4 py-1">
              {ticket.timeline.map((event) => (
                <div key={event.id} className="relative group">
                  <div className="absolute -left-[23px] top-0 w-3 h-3 rounded-full bg-cyan-600 ring-4 ring-white"></div>
                  <div className="text-[11px] font-bold text-slate-900">{event.title}</div>
                  <div className="text-[10px] text-slate-400 font-medium">{event.time} &bull; {event.actor || 'System'}</div>
                  {event.description && (
                    <div className="text-xs text-slate-600 mt-0.5">{event.description}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Resolve Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Resolve Ticket #{ticket.number}</h3>
            <p className="text-xs text-slate-500">Provide resolution notes before marking this ticket as resolved in ServiceNow.</p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Resolution Summary</label>
              <textarea
                rows={3}
                value={resolutionText}
                onChange={(e) => setResolutionText(e.target.value)}
                placeholder="e.g. Replaced printer toner cartridge and tested test print..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowResolveModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => handleStatusChange('Resolved')}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md"
              >
                Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default TicketDetailsView;
