import React from 'react';
import { NavTab, UserRole } from '../../types';
import { LayoutDashboard, PlusCircle, Ticket, Wrench, ShieldAlert, Bell, Server, Activity } from 'lucide-react';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  userRole: UserRole;
  openTicketsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  userRole,
  openTicketsCount
}) => {
  const isITSupport = userRole === 'it_support' || userRole === 'admin';
  const isAdmin = userRole === 'admin';

  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: number; roles?: UserRole[] }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'raise-ticket', label: 'Raise a Ticket', icon: <PlusCircle className="w-4 h-4" /> },
    { id: 'my-tickets', label: 'My Tickets', icon: <Ticket className="w-4 h-4" />, badge: openTicketsCount },
    ...(isITSupport ? [{ id: 'it-support' as NavTab, label: 'IT Support Queue', icon: <Wrench className="w-4 h-4" /> }] : []),
    ...(isAdmin ? [{ id: 'admin-dashboard' as NavTab, label: 'Admin SLA Dashboard', icon: <ShieldAlert className="w-4 h-4" /> }] : []),
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between shrink-0 font-sans border-r border-slate-800">
      <div className="space-y-6">
        
        {/* Navigation Group Header */}
        <div>
          <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Service Management
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-cyan-600 text-white font-semibold shadow-md shadow-cyan-950/40 ring-1 ring-cyan-400/30'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-cyan-400 border border-slate-700'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

      </div>

      {/* ServiceNow Connection Footer Widget */}
      <div className="mt-8 pt-4 border-t border-slate-800/80">
        <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider">ServiceNow Status</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Target PDI: <span className="font-mono text-cyan-400">dev183600</span>
          </p>
          <div className="mt-2 text-[10px] text-emerald-400 font-medium flex items-center gap-1">
            <Server className="w-3 h-3" />
            <span>Table API Connected</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
