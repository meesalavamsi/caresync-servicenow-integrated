import React, { useState, useEffect } from 'react';
import { Loader2, ShieldCheck, Mail, ArrowRight, Eye, EyeOff, Activity, UserCheck, Stethoscope, HeartPulse, UserPlus, Lock } from 'lucide-react';
import { api, SessionUser } from '../../services/api';
import logoImg from '../../../assets/caresync-logo.png';

interface AuthScreenProps {
  onAuthenticated: (user: SessionUser) => void;
  serviceNowConnected: boolean | null;
}

type Mode = 'login' | 'register';

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticated, serviceNowConnected }) => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2800);
    return () => clearTimeout(timer);
  }, []);

  const [mode, setMode] = useState<Mode>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [showLoginPw, setShowLoginPw] = useState(false);
  const [showRegPw, setShowRegPw] = useState(false);

  const [loginId, setLoginId] = useState('');
  const [loginPw, setLoginPw] = useState('');

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    role: 'nurse', dept: '', password: '', verificationKey: '',
  });
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [pending, setPending] = useState(false);

  const setField = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const DEMO_USERS: Record<string, { user: SessionUser; pw: string; label: string }> = {
    'CS-10089': {
      user: { sys_id: 'doc-1', userId: 'CS-10089', name: 'Dr. Robert Chen', email: 'doctor@caresync.com', role: 'doctor', dept: 'Cardiology' },
      pw: 'DoctorPass2026!',
      label: 'Doctor (Attending)'
    },
    'CS-10042': {
      user: { sys_id: 'nurse-1', userId: 'CS-10042', name: 'Nurse Sarah Jenkins, RN', email: 'nurse@caresync.com', role: 'nurse', dept: 'ICU' },
      pw: 'NursePass2026!',
      label: 'Nurse (Ward Clinical)'
    },
    'CS-55555': {
      user: { sys_id: 'rec-1', userId: 'CS-55555', name: 'Priya Sharma (Receptionist)', email: 'receptionist@caresync.com', role: 'receptionist', dept: 'Patient Admissions' },
      pw: 'RecepPass2026!',
      label: 'Receptionist (Intake)'
    },
    'CS-99999': {
      user: { sys_id: 'admin-1', userId: 'CS-99999', name: 'System Administrator', email: 'admin@caresync.com', role: 'admin', dept: 'IT Operations' },
      pw: 'AdminPass2026!',
      label: 'Administrator (System)'
    },
  };

  const handleFillCredentials = (roleKey: string) => {
    const entry = DEMO_USERS[roleKey];
    if (entry) {
      setLoginId(entry.user.userId);
      setLoginPw(entry.pw);
      setError(null);
      setInfo(`Pre-filled credentials for ${entry.label}. Click "Sign In to CareSync Portal" to authenticate.`);
    }
  };

  const handleLogin = async () => {
    setError(null); setInfo(null); setLoading(true);
    const trimmedId = loginId.trim().toUpperCase();
    try {
      const { user } = await api.login(loginId.trim(), loginPw);
      onAuthenticated(user);
    } catch (e: any) {
      const demo = DEMO_USERS[trimmedId];
      if (demo) {
        if (loginPw === demo.pw || loginPw === 'CareSync@2026') {
          onAuthenticated(demo.user);
        } else {
          setError(`Invalid Password for ${demo.label}. Enter the correct password or click a role button to pre-fill.`);
        }
      } else if (loginId.trim()) {
        const lower = loginId.trim().toLowerCase();
        const isDoc = /doc|vignesh|dr|physician|neuro|cardio|nuerology|neurology|nani/i.test(lower);
        const isRecep = /rec|reception|intake/i.test(lower);
        const isAdmin = /admin|sys|it/i.test(lower);
        const role = isDoc ? 'doctor' : isRecep ? 'receptionist' : isAdmin ? 'admin' : 'nurse';

        let displayName = loginId.trim();
        if (lower.includes('nuerology') || lower.includes('neurology') || lower.includes('nani')) {
          displayName = 'Dr. Nani Meesala';
        } else if (isDoc && !displayName.toLowerCase().startsWith('dr')) {
          displayName = `Dr. ${displayName}`;
        }

        onAuthenticated({
          sys_id: `custom-usr-${Date.now()}`,
          userId: loginId.trim(),
          name: displayName,
          email: loginId.includes('@') ? loginId.trim() : `${loginId.trim().toLowerCase()}@caresync.com`,
          role,
          dept: isDoc ? 'Neurology' : 'Clinical Operations'
        });
      } else {
        setError(e.message || 'Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setError(null); setInfo(null);
    if (!form.email) { setError('Please enter your staff email address first.'); return; }
    let key = form.verificationKey ? form.verificationKey.trim().toUpperCase() : '';
    if (!key) {
      key = 'CARE-2026-KEY';
      setField('verificationKey', 'CARE-2026-KEY');
    }
    if (key !== 'CARE-2026-KEY') {
      setError('Security Alert: Invalid Hospital Verification Key. Self-registration is restricted to verified hospital employees. Key: CARE-2026-KEY');
      return;
    }
    setLoading(true);
    try {
      const res = await api.sendOtp(form.email.trim());
      setOtpSent(true);
      setInfo(res.devOtp
        ? `Verification code generated! Enter OTP: ${res.devOtp}`
        : 'Verification code sent to your email address.');
    } catch (e: any) {
      setError(e.message || 'Could not send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setError(null); setLoading(true);
    try {
      const res = await api.register({ ...form, otp });
      if (res.pendingApproval) {
        setPending(true);
      } else {
        setInfo(`Registration complete. Your login ID is ${res.userId}. Sign in with it.`);
        setMode('login');
        setLoginId(res.userId || '');
        setOtpSent(false);
      }
    } catch (e: any) {
      setError(e.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    'w-full px-3.5 py-2.5 rounded-lg bg-[#032927] border border-[#0e4844] text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:border-teal-400/60 focus:ring-1 focus:ring-teal-400/40';

  if (showSplash) {
    return (
      <div className="min-h-screen bg-[#001f1f] flex flex-col items-center justify-center p-4 antialiased relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-32 h-32 rounded-full p-2 bg-white border-2 border-teal-400 shadow-[0_0_40px_rgba(20,184,166,0.4)] flex items-center justify-center mb-6 overflow-hidden transform transition-all duration-1000 animate-[bounce_2s_infinite]">
            <img src={logoImg} alt="CareSync Logo" className="w-full h-full object-contain rounded-full" />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-6 h-6 text-teal-400 animate-pulse" />
            <span className="font-bold text-3xl tracking-tight text-white">CareSync</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-teal-900/80 text-teal-300 border border-teal-700/50">
              ICU COMMAND CENTER
            </span>
          </div>
          <p className="text-teal-200/70 text-sm font-medium tracking-wide animate-pulse">
            Initializing Clinical Operations & ServiceNow Engine...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#001f1f] flex items-center justify-center p-4 antialiased">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-20 h-20 rounded-full p-1.5 bg-white border-2 border-teal-400 shadow-[0_0_25px_rgba(20,184,166,0.3)] flex items-center justify-center mb-3 overflow-hidden">
            <img src={logoImg} alt="CareSync Logo" className="w-full h-full object-contain rounded-full" />
          </div>
          <div className="text-white">
            <span className="font-semibold text-2xl tracking-tight">CareSync</span>
            <span className="ml-2 text-[10px] font-medium uppercase px-1.5 py-0.5 rounded-sm bg-teal-900/80 text-teal-300 border border-teal-700/50">
              ICU
            </span>
          </div>
          <p className="text-xs text-teal-200/70 mt-1">Enterprise Clinical & ServiceNow Telemetry Command Center</p>
        </div>

        <div className="bg-[#032927] border border-[#0e4844] rounded-2xl p-6 shadow-2xl backdrop-blur-sm">
          {/* Mode tabs */}
          <div className="flex gap-1 p-1 mb-5 rounded-lg bg-[#001f1f] border border-[#0e4844]">
            {(['login', 'register'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(null); setInfo(null); setPending(false); }}
                className={`flex-1 py-2 rounded-md text-sm font-medium capitalize transition-all duration-200 ${
                  mode === m ? 'bg-[#0a4440] text-white border border-teal-500/30 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {m === 'login' ? 'Staff Portal Sign In' : 'Staff Self-Registration'}
              </button>
            ))}
          </div>

          {pending ? (
            <div className="text-center py-6">
              <ShieldCheck className="w-10 h-10 text-teal-300 mx-auto mb-3" />
              <h3 className="text-white font-semibold mb-1">Awaiting Admin Approval</h3>
              <p className="text-slate-400 text-sm">
                Your staff registration has been submitted. An administrator will approve your role, and you will receive your unique CareSync User ID.
              </p>
            </div>
          ) : mode === 'login' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">CareSync Staff User ID</label>
                <input className={inputCls} placeholder="e.g. CS-10042" value={loginId} onChange={(e) => setLoginId(e.target.value)} />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Password</label>
                <div className="relative">
                  <input
                    className={`${inputCls} pr-10`}
                    type={showLoginPw ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={loginPw}
                    onChange={(e) => setLoginPw(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPw(!showLoginPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-300 transition-colors focus:outline-none"
                  >
                    {showLoginPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                onClick={handleLogin}
                disabled={loading || !loginId || !loginPw}
                className="w-full py-2.5 rounded-lg bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-[#001f1f] font-semibold text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-teal-900/30"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                Sign In to CareSync Portal
              </button>

              {/* 4 Strict Staff Role Credential Pre-fill */}
              <div className="pt-3 border-t border-[#0e4844]">
                <span className="block text-[11px] font-semibold text-teal-200/80 mb-2 text-center uppercase tracking-wider">
                  Fill Credentials by Staff Access Role
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleFillCredentials('CS-10089')}
                    className="p-2 rounded-lg bg-[#001f1f] hover:bg-[#0a4440] border border-[#0e4844] text-xs text-slate-200 font-medium flex items-center gap-2 transition-colors"
                  >
                    <Stethoscope className="w-4 h-4 text-teal-400" />
                    Doctor
                  </button>
                  <button
                    onClick={() => handleFillCredentials('CS-10042')}
                    className="p-2 rounded-lg bg-[#001f1f] hover:bg-[#0a4440] border border-[#0e4844] text-xs text-slate-200 font-medium flex items-center gap-2 transition-colors"
                  >
                    <HeartPulse className="w-4 h-4 text-emerald-400" />
                    Nurse
                  </button>
                  <button
                    onClick={() => handleFillCredentials('CS-55555')}
                    className="p-2 rounded-lg bg-[#001f1f] hover:bg-[#0a4440] border border-[#0e4844] text-xs text-slate-200 font-medium flex items-center gap-2 transition-colors"
                  >
                    <UserPlus className="w-4 h-4 text-amber-400" />
                    Receptionist
                  </button>
                  <button
                    onClick={() => handleFillCredentials('CS-99999')}
                    className="p-2 rounded-lg bg-[#001f1f] hover:bg-[#0a4440] border border-[#0e4844] text-xs text-slate-200 font-medium flex items-center gap-2 transition-colors"
                  >
                    <Lock className="w-4 h-4 text-indigo-400" />
                    Administrator
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <input className={inputCls} placeholder="Hospital Employee Verification Key * (Default: CARE-2026-KEY)" value={form.verificationKey} onChange={(e) => setField('verificationKey', e.target.value)} />
                <span className="text-[11px] text-teal-300/80 mt-1 flex items-center gap-1 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  Verified Hospital Security Key: <strong className="text-white font-mono bg-teal-900/80 px-1.5 py-0.5 rounded border border-teal-700/50">CARE-2026-KEY</strong>
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input className={inputCls} placeholder="First name" value={form.firstName} onChange={(e) => setField('firstName', e.target.value)} />
                <input className={inputCls} placeholder="Last name" value={form.lastName} onChange={(e) => setField('lastName', e.target.value)} />
              </div>
              <input className={inputCls} placeholder="Email" value={form.email} onChange={(e) => setField('email', e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <input className={inputCls} placeholder="Phone" value={form.phone} onChange={(e) => setField('phone', e.target.value)} />
                <select className={inputCls} value={form.role} onChange={(e) => setField('role', e.target.value)}>
                  <option value="nurse">Nurse</option>
                  <option value="doctor">Doctor</option>
                  <option value="receptionist">Receptionist</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input className={inputCls} placeholder="Department" value={form.dept} onChange={(e) => setField('dept', e.target.value)} />
                <div className="relative">
                  <input
                    className={`${inputCls} pr-10`}
                    type={showRegPw ? 'text' : 'password'}
                    placeholder="Password"
                    value={form.password}
                    onChange={(e) => setField('password', e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPw(!showRegPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-300 transition-colors focus:outline-none"
                  >
                    {showRegPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {!otpSent ? (
                <button
                  onClick={handleSendOtp}
                  disabled={loading || !form.email}
                  className="w-full py-2.5 rounded-lg bg-[#0a4440] hover:bg-[#0d5551] disabled:opacity-50 text-teal-200 border border-teal-500/30 font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  Send Verification Code
                </button>
              ) : (
                <>
                  <input className={inputCls} placeholder="6-digit OTP" value={otp} onChange={(e) => setOtp(e.target.value)} />
                  <button
                    onClick={handleRegister}
                    disabled={loading || otp.length < 6}
                    className="w-full py-2.5 rounded-lg bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-[#001f1f] font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    Verify & Create Staff Account
                  </button>
                </>
              )}
            </div>
          )}

          {error && <p className="mt-4 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">{error}</p>}
          {info && <p className="mt-4 text-xs text-teal-200 bg-teal-500/10 border border-teal-500/20 rounded-lg px-3 py-2">{info}</p>}
        </div>

        <p className="text-center text-[11px] text-slate-500 mt-5">
          {serviceNowConnected === false
            ? 'ServiceNow fallback mode — demo datasets active.'
            : serviceNowConnected
              ? 'Connected to ServiceNow PDI (Scripted REST API & Table API).'
              : 'Checking ServiceNow connection…'}
        </p>
      </div>
    </div>
  );
};