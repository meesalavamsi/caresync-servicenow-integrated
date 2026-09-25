import React from 'react';
import { SystemNotification } from '../../types';
import { Bell, CheckCircle2, AlertTriangle, Activity, ArrowRight } from 'lucide-react';

interface NotificationsViewProps {
  notifications: SystemNotification[];
  onSelectTicket: (ticketId: string) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  notifications,
  onSelectTicket
}) => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">System & Service Notifications</h2>
        <p className="text-xs text-slate-500">Real-time alerts for ticket state changes, assignment updates, and SLA warnings</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden divide-y divide-slate-100">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">No notifications available.</div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => onSelectTicket(n.ticketId)}
              className="p-5 hover:bg-slate-50 cursor-pointer transition-colors flex items-start justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                <div className="mt-0.5">
                  {n.type === 'warning' ? (
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                  ) : n.type === 'success' ? (
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Activity className="w-5 h-5" />
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{n.title}</span>
                    <span className="text-xs font-mono font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-200">
                      #{n.ticketNumber}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{n.message}</p>
                  <span className="text-[10px] text-slate-400 font-medium mt-1 block">{n.timestamp}</span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs font-semibold text-cyan-600 flex items-center gap-1 hover:underline">
                  View Ticket
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};

export default NotificationsView;
