import React, { useState } from 'react';
import { UserSession, UserRole } from '../../types';
import { ShieldCheck, Stethoscope, HeartPulse, UserCheck, Wrench, ShieldAlert, LogIn, Server, Activity } from 'lucide-react';

interface EnterpriseLoginProps {
  onLoginSuccess: (user: UserSession) => void;
}

export const EnterpriseLogin: React.FC<EnterpriseLoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('sarah.jenkins@caresync.org');
  const [password, setPassword] = useState('••••••••••••');
  const [selectedRole, setSelectedRole] = useState<UserRole>('doctor');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const quickRoles: { role: UserRole; title: string; desc: string; icon: React.ReactNode; color: string }[] = [
    {
      role: 'doctor',
      title: 'Doctor',
      desc: 'Raise & track hospital IT / equipment issues',
      icon: <Stethoscope className="w-5 h-5" />,
      color: 'border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-100/50'
    },
    {
      role: 'nurse',
      title: 'Nurse',
      desc: 'Report telemetry & ward workstation issues',
      icon: <HeartPulse className="w-5 h-5" />,
      color: 'border-teal-200 text-teal-700 bg-teal-50/50 hover:bg-teal-100/50'
    },
    {
      role: 'receptionist',
      title: 'Receptionist',
      desc: 'Intake kiosk, printer & access requests',
      icon: <UserCheck className="w-5 h-5" />,
      color: 'border-purple-200 text-purple-700 bg-purple-50/50 hover:bg-purple-100/50'
    },
    {
      role: 'staff',
      title: 'Hospital Staff',
      desc: 'Facilities & operational support requests',
      icon: <ShieldCheck className="w-5 h-5" />,
      color: 'border-slate-200 text-slate-700 bg-slate-50/50 hover:bg-slate-100/50'
    },
    {
      role: 'it_support',
      title: 'IT Support',
      desc: 'Manage tickets, SLA, work notes & resolve',
      icon: <Wrench className="w-5 h-5" />,
      color: 'border-amber-200 text-amber-700 bg-amber-50/50 hover:bg-amber-100/50'
    },
    {
      role: 'admin',
      title: 'Administrator',
      desc: 'System performance, SLA breaches & ServiceNow status',
      icon: <ShieldAlert className="w-5 h-5" />,
      color: 'border-rose-200 text-rose-700 bg-rose-50/50 hover:bg-rose-100/50'
    },
  ];

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: username, password, role: selectedRole }),
      });
      const data = await res.json();

      if (data.success && data.user) {
        onLoginSuccess(data.user);
      } else {
        setError(data.message || 'Login failed. Please check credentials.');
      }
    } catch {
      setError('Unable to connect to CareSync authentication service.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    const mockEmails: Record<UserRole, string> = {
      doctor: 'sarah.jenkins@caresync.org',
      nurse: 'emily.vance@caresync.org',
      receptionist: 'intake@caresync.org',
      staff: 'david.ray@caresync.org',
      it_support: 'alex.rivers@caresync.org',
      admin: 'admin@caresync.org',
      patient: 'patient@caresync.org'
    };
    setUsername(mockEmails[role]);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-xl shadow-cyan-950/50 mb-4 ring-1 ring-cyan-400/30">
          <Activity className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white font-sans">
          CareSync
        </h1>
        <p className="mt-1 text-sm text-cyan-400 font-medium tracking-wide uppercase">
          Hospital Service Management Platform
        </p>
        <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300">
          <Server className="w-3.5 h-3.5 text-emerald-400" />
          <span>Powered by ServiceNow ITSM Backend</span>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-slate-800/90 backdrop-blur-md py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-700/80">
          
          <div className="mb-6">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Select Role to Test Interface
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {quickRoles.map((r) => (
                <button
                  key={r.role}
                  type="button"
                  onClick={() => handleQuickRoleSelect(r.role)}
                  className={`p-3 text-left rounded-xl border transition-all duration-150 flex flex-col justify-between ${
                    selectedRole === r.role
                      ? 'border-cyan-500 bg-cyan-950/40 text-cyan-200 ring-2 ring-cyan-500/30 shadow-md'
                      : 'border-slate-700/60 bg-slate-900/50 text-slate-300 hover:border-slate-600 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={selectedRole === r.role ? 'text-cyan-400' : 'text-slate-400'}>
                      {r.icon}
                    </span>
                    {selectedRole === r.role && (
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-slate-200">{r.title}</div>
                    <div className="text-[10px] text-slate-400 leading-tight mt-0.5 line-clamp-1">{r.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <form className="space-y-5" onSubmit={handleLoginSubmit}>
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/50 text-rose-300 text-xs font-medium flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Username / Email / Hospital ID
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-colors"
                placeholder="e.g. sarah.jenkins@caresync.org"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Password
                </label>
                <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Please contact Hospital IT Service Desk to reset password.'); }} className="text-xs text-cyan-400 hover:underline">
                  Forgot Password?
                </a>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-sm shadow-lg shadow-cyan-900/40 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Authenticating with ServiceNow...</span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Log In to CareSync Portal</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-700/60 text-center text-xs text-slate-400">
            CareSync Service Management Platform &bull; Built for Hospital Operations
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnterpriseLogin;
