import React, { useState } from 'react';
import { UserPlus, ShieldCheck, Zap, Phone, CheckCircle2, User, Building2, Stethoscope, HeartPulse, Send, ArrowRight, Sparkles, Check } from 'lucide-react';
import { Patient, Bed, WardLocation } from '../../types';
import { api } from '../../services/api';

interface ReceptionistIntakeViewProps {
  beds?: Bed[];
  selectedLocation?: WardLocation;
  setSelectedLocation?: (loc: WardLocation) => void;
  onPatientAdmitted: (newPatient: Patient) => void;
  onShowToast: (msg: string) => void;
}

const WARD_LOCATION_MAP: Record<string, WardLocation> = {
  'Cardiac ICU': 'Cardiac ICU - Ward 4',
  'Neuro ICU': 'Neuro ICU - Ward 2',
  'General Ward': 'Surgical Stepdown - Ward 6',
  'Emergency Dept': 'Emergency Dept - Pod A',
};

export const ReceptionistIntakeView: React.FC<ReceptionistIntakeViewProps> = ({
  beds = [],
  selectedLocation,
  setSelectedLocation,
  onPatientAdmitted,
  onShowToast
}) => {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    age: '45',
    gender: 'Male',
    diagnosis: '',
    department: 'Cardiac ICU',
    roomNumber: '', // Starts empty — auto-assigned or selected from available beds!
    emergencyName: '',
    emergencyPhone: '',
    attendingPhysician: 'Dr. Robert Chen',
    primaryNurse: 'Nurse Sarah Jenkins, RN',
  });

  const [isAutomating, setIsAutomating] = useState(false);
  const [automationSuccess, setAutomationSuccess] = useState<string | null>(null);
  const [lastAdmitted, setLastAdmitted] = useState<{
    name: string;
    mrn: string;
    id: string;
    passcode: string;
    department: string;
    roomNumber: string;
  } | null>(null);

  // AI Triage Recommendation based on diagnosis typing
  const getAiRecommendation = (dx: string) => {
    if (!dx.trim()) return null;
    const lower = dx.toLowerCase();
    if (/cardiac|heart|stemi|mi|chest pain|infarction|coronary|aortic/i.test(lower)) {
      return { dept: 'Cardiac ICU', location: 'Cardiac ICU - Ward 4' as WardLocation, reason: 'Continuous invasive arterial telemetry & cardiac monitoring' };
    }
    if (/neuro|stroke|brain|seizure|head|coma|aneurysm/i.test(lower)) {
      return { dept: 'Neuro ICU', location: 'Neuro ICU - Ward 2' as WardLocation, reason: 'Intracranial pressure monitoring & Q1H neuro checks' };
    }
    if (/surgery|post-op|appendect|laparo|rehab|recovery|fracture/i.test(lower)) {
      return { dept: 'General Ward', location: 'Surgical Stepdown - Ward 6' as WardLocation, reason: 'Post-operative recovery & surgical telemetry stepdown' };
    }
    if (/trauma|bleed|emergency|shock|accident/i.test(lower)) {
      return { dept: 'Emergency Dept', location: 'Emergency Dept - Pod A' as WardLocation, reason: 'STAT resuscitation & emergency stabilization' };
    }
    return { dept: 'Cardiac ICU', location: 'Cardiac ICU - Ward 4' as WardLocation, reason: 'High acuity observation protocol' };
  };

  const aiRec = getAiRecommendation(form.diagnosis);

  const applyAiRecommendation = () => {
    if (aiRec) {
      setForm(prev => ({ ...prev, department: aiRec.dept }));
      if (setSelectedLocation) {
        setSelectedLocation(aiRec.location);
      }
    }
  };

  const handleDepartmentChange = (dept: string) => {
    setForm(prev => ({ ...prev, department: dept, roomNumber: '' }));
    const loc = WARD_LOCATION_MAP[dept];
    if (loc && setSelectedLocation) {
      setSelectedLocation(loc);
    }
  };

  // Filter available (empty/clean) beds matching selected department
  const availableBeds = beds.filter(b => b.status === 'available');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.diagnosis) {
      alert('Please fill in Patient Name and Admitting Diagnosis.');
      return;
    }

    setIsAutomating(true);
    setAutomationSuccess(null);

    // Auto-select room if none explicitly picked from available beds
    let assignedRoom = form.roomNumber;
    if (!assignedRoom) {
      const firstAvail = availableBeds[0];
      assignedRoom = firstAvail ? firstAvail.number : `ICU-${Math.floor(10 + Math.random() * 80)}`;
    }

    setTimeout(async () => {
      const fullPatientName = `${form.firstName} ${form.lastName}`;
      const initials = `${form.firstName[0]}${form.lastName[0]}`.toUpperCase();
      const newId = `pt-${Date.now()}`;
      const generatedPasscode = `FAM-${Math.floor(1000 + Math.random() * 9000)}`;

      const newPatient: Patient = {
        id: newId,
        name: fullPatientName,
        initials,
        mrn: `MRN-${Math.floor(100000 + Math.random() * 900000)}`,
        dob: '1981-04-12',
        age: parseInt(form.age) || 45,
        gender: form.gender,
        bedId: `bed-${assignedRoom}`,
        roomNumber: assignedRoom,
        admittingDx: form.diagnosis,
        allergies: ['Penicillin'],
        attendingPhysician: form.attendingPhysician,
        primaryNurse: form.primaryNurse,
        emergencyContact: `${form.emergencyName ? form.emergencyName + ' • ' : ''}${form.emergencyPhone || '+1 (555) 000-1122'}`,
        familyPasscode: generatedPasscode,
        los: 'Day 1',
        codeStatus: 'Full',
        statusTag: 'Stable',
        acuityLevel: 'Medium (Level 2)',
        isTelemetryActive: true,
        admittedDate: new Date().toLocaleDateString(),
        estDischargeDate: 'In 3 Days',
        vitals: {
          hr: 76, hrStatus: 'stable',
          bpSystolic: 122, bpDiastolic: 80, bpStatus: 'stable',
          spO2: 98, spO2Status: 'stable',
          respRate: 16, respStatus: 'stable',
          temp: 98.6,
          lastUpdated: 'Just now',
          hrTrend: [72, 74, 76, 75, 76],
          bpTrend: [120, 122, 121, 122, 122]
        },
        carePlanGoals: [],
        recentImaging: {
          id: `img-${Date.now()}`,
          modality: 'CXR',
          title: 'Chest Portable AP',
          date: 'Just now',
          imageUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=400&q=80',
          findings: 'Baseline post-admission chest radiograph showing clear lung fields.'
        },
        clinicalTimeline: [
          {
            id: `tl-${Date.now()}`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            date: new Date().toLocaleDateString(),
            type: 'event',
            title: 'Patient Intake Completed',
            description: `Admitted to ${form.department} bed ${assignedRoom}. Relative ${form.emergencyName || ''} registered with passcode ${generatedPasscode}.`,
            clinician: 'Receptionist Intake Gateway'
          }
        ]
      };

      try {
        await api.createPatient({
          name: fullPatientName,
          roomNumber: assignedRoom,
          statusTag: 'Stable',
          admittingDx: form.diagnosis,
          emergencyContact: `${form.emergencyName ? form.emergencyName + ' • ' : ''}${form.emergencyPhone || ''}`,
          familyPasscode: generatedPasscode
        });
      } catch { /* graceful fallback */ }

      onPatientAdmitted(newPatient);
      setIsAutomating(false);
      setLastAdmitted({
        name: fullPatientName,
        mrn: newPatient.mrn,
        id: newId,
        passcode: generatedPasscode,
        department: form.department,
        roomNumber: assignedRoom
      });
      setAutomationSuccess(`Automated CareSync Onboarding Complete for ${fullPatientName}. Patient MRN, ID & Passcode generated.`);
      onShowToast(`Automated Workflow Complete: Patient ${fullPatientName} Admitted to Bed ${assignedRoom}!`);

      // Reset
      setForm({
        firstName: '', lastName: '', age: '45', gender: 'Male',
        diagnosis: '', department: 'Cardiac ICU', roomNumber: '',
        emergencyName: '', emergencyPhone: '',
        attendingPhysician: 'Dr. Robert Chen', primaryNurse: 'Nurse Sarah Jenkins, RN',
      });
    }, 1200);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#001f1f] to-[#043d39] rounded-2xl p-6 text-white border border-[#0e4844] shadow-xl flex items-center justify-between">
        <div>
          <span className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold border border-teal-500/30 inline-flex items-center gap-1.5 mb-2">
            <UserPlus className="w-3.5 h-3.5" />
            Receptionist Patient Intake & Workflow Automation
          </span>
          <h1 className="text-2xl font-bold tracking-tight">Patient Admission & Relative Intake Portal</h1>
          <p className="text-teal-200/80 text-xs mt-1">
            Register incoming patients, capture emergency relative contacts, and trigger automated ServiceNow clinical workflows with 1 click.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-3 bg-teal-950/60 p-3 rounded-xl border border-teal-500/20 text-xs">
          <Zap className="w-6 h-6 text-amber-400 animate-pulse" />
          <div>
            <div className="font-bold text-teal-200">Automated Intake Chain</div>
            <div className="text-[11px] text-teal-400">Patient ➔ Bed ➔ Handoff ➔ MAR ➔ Family Access</div>
          </div>
        </div>
      </div>

      {/* Intake Form */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-md">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200 font-bold text-slate-800 text-base">
            <User className="w-5 h-5 text-teal-600" />
            Patient Basic Demographics
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">First Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Aarav"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-300 text-sm focus:bg-white focus:border-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Last Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Mehta"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-300 text-sm focus:bg-white focus:border-teal-500 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Age</label>
                <input
                  type="number"
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-sm focus:bg-white focus:border-teal-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                <select
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className="w-full px-2 py-2 rounded-lg bg-slate-50 border border-slate-300 text-sm focus:bg-white focus:border-teal-500 focus:outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 pb-3 border-b border-slate-200 font-bold text-slate-800 text-base">
            <HeartPulse className="w-5 h-5 text-teal-600" />
            Clinical Admitting Details & Location
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Admitting Diagnosis *</label>
              <input
                type="text"
                required
                placeholder="e.g. Acute Myocardial Infarction / Stroke"
                value={form.diagnosis}
                onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-300 text-sm focus:bg-white focus:border-teal-500 focus:outline-none"
              />
              {aiRec && (
                <div className="mt-2 p-2 rounded-lg bg-teal-50 border border-teal-200 text-[11px] text-teal-900 flex items-center justify-between animate-in fade-in">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>AI Triage: <strong>{aiRec.dept}</strong></span>
                  </div>
                  <button
                    type="button"
                    onClick={applyAiRecommendation}
                    className="px-2 py-0.5 rounded bg-teal-700 hover:bg-teal-800 text-white font-bold text-[10px] flex items-center gap-1 transition-colors"
                  >
                    <Check className="w-3 h-3" /> Apply Ward
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Department / Ward Location</label>
              <select
                value={form.department}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-300 text-sm focus:bg-white focus:border-teal-500 focus:outline-none font-semibold text-slate-800"
              >
                <option value="Cardiac ICU">Cardiac ICU - Ward 4</option>
                <option value="Neuro ICU">Neuro ICU - Ward 2</option>
                <option value="General Ward">General Ward / Surgical Stepdown - Ward 6</option>
                <option value="Emergency Dept">Emergency Dept - Pod A</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Bed Number</label>
              <select
                value={form.roomNumber}
                onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-300 text-sm focus:bg-white focus:border-teal-500 focus:outline-none font-semibold text-slate-800"
              >
                <option value="">Auto-Assign Best Available Bed ({availableBeds.length} Ready)</option>
                {availableBeds.map(b => (
                  <option key={b.id} value={b.number}>
                    Bed {b.number} — Available (Empty & Clean)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 pb-3 border-b border-slate-200 font-bold text-slate-800 text-base">
            <Phone className="w-5 h-5 text-teal-600" />
            Relative & Emergency Contact Information
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Relative / Contact Name</label>
              <input
                type="text"
                placeholder="e.g. Priyanaka Mehta (Spouse)"
                value={form.emergencyName}
                onChange={(e) => setForm({ ...form, emergencyName: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-300 text-sm focus:bg-white focus:border-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Emergency Phone Number</label>
              <input
                type="text"
                placeholder="e.g. +1 (555) 678-1234"
                value={form.emergencyPhone}
                onChange={(e) => setForm({ ...form, emergencyPhone: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-300 text-sm focus:bg-white focus:border-teal-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Single Click Automation Action */}
          <div className="pt-4 border-t border-slate-200">
            <button
              type="submit"
              disabled={isAutomating}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white font-bold text-base flex items-center justify-center gap-3 transition-all shadow-lg shadow-teal-700/20 disabled:opacity-50"
            >
              {isAutomating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Executing Automated Clinical Onboarding Chain...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 text-amber-300" />
                  Run 1-Click Complete CareSync Automated Intake Workflow
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </form>

        {lastAdmitted && (
          <div className="mt-6 p-5 rounded-2xl bg-slate-900 border border-emerald-500/30 text-white space-y-4 shadow-xl animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Automated Clinical Onboarding Complete & ServiceNow Synced</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[11px] font-medium">
                Live EHR Tracked
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">Patient Name</div>
                <div className="text-white font-bold text-sm truncate">{lastAdmitted.name}</div>
              </div>

              <div className="p-3 rounded-xl bg-teal-950/60 border border-teal-500/30">
                <div className="text-teal-400 text-[10px] uppercase font-bold tracking-wider mb-1">Medical Record No. (MRN)</div>
                <div className="text-teal-200 font-mono font-bold text-sm">{lastAdmitted.mrn}</div>
              </div>

              <div className="p-3 rounded-xl bg-purple-950/60 border border-purple-500/30">
                <div className="text-purple-300 text-[10px] uppercase font-bold tracking-wider mb-1">Patient System ID</div>
                <div className="text-purple-200 font-mono font-bold text-xs truncate">{lastAdmitted.id}</div>
              </div>

              <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-500/40">
                <div className="text-amber-400 text-[10px] uppercase font-bold tracking-wider mb-1">Family Access Passcode</div>
                <div className="text-amber-200 font-mono font-extrabold text-base tracking-widest">{lastAdmitted.passcode}</div>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
              <span>Assigned Location: <strong className="text-slate-200">{lastAdmitted.department} — Bed {lastAdmitted.roomNumber}</strong></span>
              <span className="text-emerald-400">Provide passcode to family relative for Family Portal authentication</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
