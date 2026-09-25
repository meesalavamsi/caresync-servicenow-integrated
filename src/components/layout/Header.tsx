import React, { useState } from 'react';
import { UserSession, SystemNotification } from '../../types';
import { Bell, Activity, LogOut, Search, PlusCircle, CheckCircle2, AlertTriangle, Shield, User } from 'lucide-react';

interface HeaderProps {
  user: UserSession;
  onLogout: () => void;
  onRaiseTicketClick: () => void;
  notifications: SystemNotification[];
  onSelectTicket?: (id: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onLogout,
  onRaiseTicketClick,
  notifications,
  onSelectTicket
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  const roleColors: Record<string, string> = {
    doctor: 'bg-blue-100 text-blue-800 border-blue-200',
    nurse: 'bg-teal-100 text-teal-800 border-teal-200',
    receptionist: 'bg-purple-100 text-purple-800 border-purple-200',
    staff: 'bg-slate-100 text-slate-800 border-slate-200',
    it_support: 'bg-amber-100 text-amber-800 border-amber-200',
    admin: 'bg-rose-100 text-rose-800 border-rose-200'
  };

  const roleLabels: Record<string, string> = {
    doctor: 'Doctor',
    nurse: 'Nurse',
    receptionist: 'Receptionist',
    staff: 'Hospital Staff',
    it_support: 'IT Support Staff',
    admin: 'Hospital Administrator'
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand & Platform Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-700 text-white flex items-center justify-center shadow-md shadow-cyan-900/20">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-slate-900 font-sans">CareSync</span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                  ITSM
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-none hidden sm:block">
                Hospital Service Management
              </p>
            </div>
          </div>

          {/* Quick Actions & Search */}
          <div className="flex items-center gap-3">
            <button
              onClick={onRaiseTicketClick}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Raise Ticket</span>
            </button>

            {/* Notifications Dropdown Toggle */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors relative"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Popover */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Notifications</span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded-full">
                      {notifications.length} alerts
                    </span>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400">No active notifications</div>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          onClick={() => {
                            setShowNotifications(false);
                            if (onSelectTicket) onSelectTicket(n.ticketId);
                          }}
                          className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors ${!n.read ? 'bg-cyan-50/30' : ''}`}
                        >
                          <div className="flex items-start gap-2.5">
                            {n.type === 'warning' ? (
                              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                            ) : n.type === 'success' ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                            ) : (
                              <Activity className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between text-xs font-semibold text-slate-900">
                                <span>{n.title}</span>
                                <span className="text-[10px] text-slate-400 font-normal">{n.timestamp}</span>
                              </div>
                              <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{n.message}</p>
                              <div className="mt-1 text-[10px] font-mono font-medium text-cyan-700">
                                #{n.ticketNumber}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

            {/* Profile & Role Info */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>

              <div className="hidden md:block text-left">
                <div className="text-xs font-bold text-slate-900 line-clamp-1">{user.name}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${roleColors[user.role] || 'bg-slate-100 text-slate-700'}`}>
                    {roleLabels[user.role] || user.role}
                  </span>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Log Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};

export default Header;
