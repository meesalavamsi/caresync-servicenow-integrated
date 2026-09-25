import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { 
  BedDouble, 
  Bed as BedIcon, 
  User, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  RefreshCw, 
  Plus, 
  ArrowRightLeft, 
  LogOut, 
  Server, 
  Sparkles,
  Loader2,
  ShieldCheck,
  Search,
  Filter,
  Info,
  BellRing
} from 'lucide-react';
import { Bed, BedStatus, Patient, NavTab } from '../../types';
import { BedStatusLogo } from '../common/BedStatusLogo';

interface BedManagementViewProps {
  beds: Bed[];
  patients: Patient[];
  onSelectBed: (bed: Bed) => void;
  onNewAdmission: () => void;
  onDischargeBed: (bedId: string) => void;
  onCleanBed: (bedId: string) => void;
  onSelectTab: (tab: NavTab) => void;
  onSelectPatient: (patientId: string) => void;
  onShowToast?: (message: string) => void;
}

export const BedManagementView: React.FC<BedManagementViewProps> = ({
  beds,
  patients,
  onSelectBed,
  onNewAdmission,
  onDischargeBed,
  onCleanBed,
  onSelectTab,
  onSelectPatient,
  onShowToast
}) => {
  const [selectedBedId, setSelectedBedId] = useState<string>('402');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [predicting, setPredicting] = useState(false);
  const [prediction, setPrediction] = useState<{ eta?: string; isBottleneck?: boolean; bottleneckDept?: string; confidence?: string } | null>(null);
  const [predictError, setPredictError] = useState<string | null>(null);
  const [notifying, setNotifying] = useState(false);
  const [notifySent, setNotifySent] = useState(false);

  const selectedBed = beds.find(b => b.number === selectedBedId) || beds[0];

  // A prediction (and any "notified" state) belongs to the bed it was run
  // for — clear both when the inspector switches to a different bed so a
  // stale bottleneck from bed A can't be "notified" while bed B is selected.
  useEffect(() => {
    setPrediction(null);
    setPredictError(null);
    setNotifySent(false);
  }, [selectedBedId]);

  const handleRunPrediction = async () => {
    if (!selectedBed) return;
    setPredicting(true);
    setPredictError(null);
    setPrediction(null);
    setNotifySent(false);
    try {
      const patient = patients.find(p => p.id === selectedBed.patient?.id || p.name === selectedBed.patient?.name);
      const res = await api.predictBed(selectedBed.id, {
        bedNumber: selectedBed.number,
        ward: selectedBed.ward || 'Cardiac ICU - Ward 4',
        age: patient?.age || (selectedBed.patient ? 58 : 'n/a'),
        patientName: selectedBed.patient?.name || 'Unoccupied',
        mrn: selectedBed.patient?.mrn || 'N/A',
        diagnosis: selectedBed.patient?.condition || patient?.admittingDx || 'N/A',
        currentStatus: selectedBed.status,
        equipmentCount: selectedBed.equipment?.length || 0,
        pendingTasks: selectedBed.status === 'available'
          ? 'Bed is sanitized and ready for immediate admission.'
          : selectedBed.status === 'cleaning'
          ? 'EVS deep sanitization and terminal cleaning in progress.'
          : selectedBed.status === 'freeing-soon'
          ? 'Physician discharge paperwork completed, awaiting family transportation pickup.'
          : selectedBed.patient?.condition === 'Critical' || selectedBed.status === 'critical'
          ? 'ICU stabilization, continuous cardiac telemetry monitoring, and lab clearance pending.'
          : 'Routine ward monitoring and pending pharmacy discharge reconciliation.',
      });
      setPrediction(res.aiAnalysis);
    } catch (e: any) {
      setPredictError('Prediction unavailable (AI/ServiceNow not reachable from this environment).');
    } finally {
      setPredicting(false);
    }
  };

  const handleNotifyBottleneck = async () => {
    if (!selectedBed || !prediction?.bottleneckDept) return;
    setNotifying(true);
    try {
      const res = await api.notifyBottleneck(selectedBed.id, {
        bedNumber: selectedBed.number,
        bottleneckDept: prediction.bottleneckDept,
        eta: prediction.eta,
        confidence: prediction.confidence,
      });
      setNotifySent(true);
      onShowToast?.(
        res.emailSent
          ? `${prediction.bottleneckDept} notified by email and logged to ServiceNow.`
          : `${prediction.bottleneckDept} notified — logged to ServiceNow (email not configured).`
      );
    } catch (e: any) {
      onShowToast?.(`Failed to notify ${prediction.bottleneckDept}.`);
    } finally {
      setNotifying(false);
    }
  };

  const totalBeds = beds.length;
  const occupiedBeds = beds.filter(b => b.status === 'occupied' || b.status === 'critical').length;
  const availableBeds = beds.filter(b => b.status === 'available').length;
  const freeingSoonBeds = beds.filter(b => b.status === 'freeing-soon').length;

  const filteredBeds = beds.filter(b => {
    if (statusFilter === 'all') return true;
    return b.status === statusFilter;
  });

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Header matching Image 7 */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Bed Management & Ward Floorplan</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 text-xs font-bold border border-teal-200">
              Cardiac ICU - Ward 4
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time census tracking, bed turnover management, and Environmental Services (EVS) automated dispatch
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onNewAdmission}
            className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Admit Patient
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metrics with Bed Status Logos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Total Capacity</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{totalBeds} Beds</div>
            <span className="text-[11px] text-slate-400">All ICU equipped</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200">
            <BedDouble className="w-5 h-5 text-slate-700" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Occupied (With Person)</span>
            <div className="text-2xl font-black text-teal-700 mt-1">{occupiedBeds} Beds</div>
            <span className="text-[11px] text-teal-600 font-medium">{Math.round((occupiedBeds/totalBeds)*100)}% Census</span>
          </div>
          <BedStatusLogo status="occupied" size="sm" />
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Available (Empty Bed)</span>
            <div className="text-2xl font-black text-emerald-700 mt-1">{availableBeds} Beds</div>
            <span className="text-[11px] text-emerald-600 font-medium">Ready for admissions</span>
          </div>
          <BedStatusLogo status="available" size="sm" />
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Leaving in Few Hours</span>
            <div className="text-2xl font-black text-sky-700 mt-1">{freeingSoonBeds} Beds</div>
            <span className="text-[11px] text-sky-600 font-medium">Discharge turnover</span>
          </div>
          <BedStatusLogo status="freeing-soon" size="sm" />
        </div>
      </div>

      {/* Visual Status Legend */}
      <div className="bg-white px-5 py-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <Info className="w-4 h-4 text-teal-700" />
          <span>Bed Status Visual Legend:</span>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <BedStatusLogo status="occupied" size="xs" />
            <span className="font-semibold text-slate-700">Occupied <span className="text-slate-400 font-normal">(Bed with person)</span></span>
          </div>
          <div className="flex items-center gap-2">
            <BedStatusLogo status="freeing-soon" size="xs" />
            <span className="font-semibold text-sky-800">Leaving in few hours <span className="text-slate-400 font-normal">(Bed with person + timer)</span></span>
          </div>
          <div className="flex items-center gap-2">
            <BedStatusLogo status="available" size="xs" />
            <span className="font-semibold text-emerald-800">Available <span className="text-slate-400 font-normal">(Empty bed, ready)</span></span>
          </div>
          <div className="flex items-center gap-2">
            <BedStatusLogo status="critical" size="xs" />
            <span className="font-semibold text-rose-800">Critical <span className="text-slate-400 font-normal">(Bed with person + alert)</span></span>
          </div>
        </div>
      </div>

      {/* Main Section: Interactive Ward Grid + Selected Bed Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Floorplan Grid (Matching Image 7 layout) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <BedIcon className="w-4 h-4 text-teal-700" />
              Ward 4 Bed Layout Grid
            </h2>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
              {[
                { id: 'all', label: 'All Beds' },
                { id: 'occupied', label: 'Occupied' },
                { id: 'freeing-soon', label: 'Leaving in Few Hrs' },
                { id: 'available', label: 'Available' },
                { id: 'critical', label: 'Critical' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                    statusFilter === f.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Bed Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
            {filteredBeds.map(bed => {
              const isSelected = bed.number === selectedBedId;
              let styleClasses = 'bg-white border-slate-200 text-slate-700 hover:border-slate-400';
              let badgeColor = 'bg-slate-100 text-slate-600';
              let statusLabel = bed.status.replace('-', ' ');
              let animClass = '';

              if (bed.status === 'available') {
                styleClasses = 'bg-emerald-50/40 border-emerald-300 text-emerald-950 hover:border-emerald-500';
                badgeColor = 'bg-emerald-100 text-emerald-800 border border-emerald-200';
                statusLabel = 'Available (Empty)';
                animClass = 'bed-available-card';
              } else if (bed.status === 'critical') {
                styleClasses = 'bg-rose-50/40 border-rose-300 text-rose-950 hover:border-rose-500 ring-1 ring-rose-500/20';
                badgeColor = 'bg-rose-100 text-rose-800 border border-rose-200';
                statusLabel = 'Critical ICU';
              } else if (bed.status === 'occupied') {
                styleClasses = 'bg-teal-50/30 border-teal-300 text-teal-950 hover:border-teal-500';
                badgeColor = 'bg-teal-100 text-teal-800 border border-teal-200';
                statusLabel = 'Occupied';
                animClass = 'bed-occupied-card';
              } else if (bed.status === 'freeing-soon') {
                styleClasses = 'bg-sky-50/40 border-sky-300 text-sky-950 hover:border-sky-500';
                badgeColor = 'bg-sky-100 text-sky-800 border border-sky-200';
                statusLabel = 'Leaving in ~2h';
              } else if (bed.status === 'cleaning') {
                styleClasses = 'bg-amber-50/40 border-amber-300 text-amber-950 hover:border-amber-500';
                badgeColor = 'bg-amber-100 text-amber-800 border border-amber-200';
                statusLabel = 'Cleaning';
                animClass = 'bed-cleaning-card';
              }

              return (
                <div
                  key={bed.id}
                  onClick={() => setSelectedBedId(bed.number)}
                  className={`relative overflow-hidden p-3 rounded-xl border-2 transition-all cursor-pointer shadow-2xs flex flex-col justify-between min-h-[145px] ${styleClasses} ${animClass} ${
                    isSelected ? 'ring-3 ring-teal-600 shadow-md scale-102' : ''
                  }`}
                >
                  {bed.status === 'cleaning' && (
                    <>
                      <div className="bed-cleaning-stripe-bar" />
                      <div className="bed-cleaning-sweep" />
                      <div className="bed-shockwave bed-shockwave-amber" />
                    </>
                  )}
                  {bed.status === 'occupied' && <div className="bed-shockwave bed-shockwave-teal" />}
                  {bed.status === 'available' && <div className="bed-shockwave bed-shockwave-emerald" />}
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <BedStatusLogo status={bed.status} size="xs" />
                      <span className="font-black text-sm text-slate-900">Bed {bed.number}</span>
                    </div>
                    <span className={`text-[8.5px] font-extrabold px-1.5 py-0.5 rounded capitalize whitespace-nowrap ${badgeColor} ${animClass ? 'bed-badge-pulse' : ''}`}>
                      {statusLabel}
                    </span>
                  </div>

                  <div className="py-2">
                    {bed.patient ? (
                      <div>
                        <div className="font-bold text-xs text-slate-900 line-clamp-1">{bed.patient.name}</div>
                        <div className="text-[10px] text-slate-500">MRN: {bed.patient.mrn}</div>
                        {bed.status === 'freeing-soon' && (
                          <div className="text-[9.5px] text-sky-700 font-bold mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-sky-600" />
                            Leaving in few hours
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-[11px] text-emerald-700 font-semibold flex flex-col gap-0.5">
                        <span>Ready for Admission</span>
                        <span className="text-[9.5px] text-slate-400 font-normal">Sanitized & Calibrated</span>
                      </div>
                    )}
                  </div>

                  <div className="text-[10px] text-slate-500 font-medium flex items-center justify-between border-t border-slate-200/60 pt-1.5">
                    <span className="font-semibold text-slate-600">
                      {bed.patient ? bed.patient.condition : bed.status === 'cleaning' ? 'Cleaning…' : 'Clean'}
                    </span>
                    <span className="text-teal-700 font-bold hover:underline">Select →</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-center justify-between">
            <span>💡 Click any bed card to inspect telemetry sensors, connected biomedical equipment, or initiate transfer</span>
            <span className="text-teal-700 font-bold">Total: {beds.length} Bed Stations</span>
          </div>
        </div>

        {/* Right 1 Col: Selected Bed Detail Inspector */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                Bed Station #{selectedBed.number}
              </h3>
              <span className="text-xs text-slate-400">{selectedBed.ward}</span>
            </div>
            <BedStatusLogo status={selectedBed.status} size="sm" showBadge={false} />
          </div>

          {/* Prominent Visual Status Banner in Inspector */}
          <div className={`p-3.5 rounded-xl border flex items-center gap-3 ${
            selectedBed.status === 'available' ? 'bg-emerald-50 border-emerald-200 text-emerald-950' :
            selectedBed.status === 'critical' ? 'bg-rose-50 border-rose-200 text-rose-950' :
            selectedBed.status === 'freeing-soon' ? 'bg-sky-50 border-sky-200 text-sky-950' :
            'bg-teal-50 border-teal-200 text-teal-950'
          }`}>
            <BedStatusLogo status={selectedBed.status} size="md" />
            <div>
              <div className="font-bold text-xs uppercase tracking-wide">
                {selectedBed.status === 'available' ? 'Available Bed (Empty)' :
                 selectedBed.status === 'freeing-soon' ? 'Occupied - Leaving in Few Hours' :
                 selectedBed.status === 'critical' ? 'Critical High Acuity Occupied' :
                 'Occupied (Bed with Person)'}
              </div>
              <div className="text-[11px] opacity-80 mt-0.5">
                {selectedBed.status === 'available' ? 'Bed without person. Sanitized and ready for patient intake.' :
                 selectedBed.status === 'freeing-soon' ? 'Bed with person. Discharge orders approved, room freeing in ~2 hours.' :
                 selectedBed.status === 'critical' ? 'Bed with person. Continuous invasive monitoring & ventilator support.' :
                 'Bed with person. Patient actively admitted and monitored.'}
              </div>
            </div>
          </div>

          {/* Patient Details or Available state */}
          {selectedBed.patient ? (
            <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-500 text-[11px]">OCCUPANT</span>
                <button
                  onClick={() => {
                    const pt = patients.find(p => p.roomNumber === selectedBed.number || p.name === selectedBed.patient?.name);
                    if (pt) {
                      onSelectPatient(pt.id);
                      onSelectTab('patient-360');
                    }
                  }}
                  className="text-teal-700 font-bold hover:underline"
                >
                  View 360 Profile →
                </button>
              </div>
              <div className="text-sm font-black text-slate-900">{selectedBed.patient.name}</div>
              <div className="text-slate-600">MRN: <strong className="font-mono text-slate-800">{selectedBed.patient.mrn}</strong></div>
              <div className="text-slate-600">Assigned Nurse: <strong className="text-slate-800">{selectedBed.patient.assignedNurse}</strong></div>
              <div className="text-slate-600">Clinical Status: <strong className="text-teal-800">{selectedBed.patient.condition}</strong></div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-2">
              <div className="font-bold">Bed Ready & Sanitized</div>
              <p className="text-[11px] text-emerald-700">
                Last cleaned: {selectedBed.lastCleaned || 'Today 08:00 AM'}. All telemetry sensors calibrated and ready for patient intake.
              </p>
              <button
                onClick={onNewAdmission}
                className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
              >
                + Admit Patient to Bed {selectedBed.number}
              </button>
            </div>
          )}

          {/* Biomedical Assets connected */}
          <div className="space-y-2 text-xs">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-teal-600" />
              Connected Equipment & ServiceNow Assets
            </h4>
            <div className="space-y-1.5">
              {selectedBed.equipment.map((eq, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-[11px]">
                  <div>
                    <div className="font-semibold text-slate-800">{eq.name}</div>
                    <div className="text-slate-400 font-mono">SN Tag: {eq.serviceNowAssetId}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                    eq.status === 'online' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {eq.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Predictive Bed Intelligence */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              Predictive Bed Intelligence
            </h4>
            <button
              onClick={handleRunPrediction}
              disabled={predicting}
              className="w-full py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              {predicting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {predicting ? 'Analyzing bed availability…' : 'Run AI Prediction'}
            </button>
            {prediction && (
              <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-[11px] text-teal-900 space-y-1">
                <div className="flex justify-between"><span>Estimated free in</span><strong>{prediction.eta || '—'}</strong></div>
                <div className="flex justify-between"><span>Confidence</span><strong>{prediction.confidence ? `${prediction.confidence}%` : '—'}</strong></div>
                {prediction.isBottleneck && (
                  <div className="mt-1 pt-1 border-t border-teal-200 space-y-2">
                    <div className="text-rose-700 font-semibold">
                      ⚠ Bottleneck: {prediction.bottleneckDept || 'cross-department delay'}
                    </div>
                    {prediction.bottleneckDept && (
                      <button
                        onClick={handleNotifyBottleneck}
                        disabled={notifying || notifySent}
                        className={`w-full py-1.5 font-bold rounded-lg text-[11px] flex items-center justify-center gap-1.5 transition-colors ${
                          notifySent
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default'
                            : 'bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white'
                        }`}
                      >
                        {notifying ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : notifySent ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <BellRing className="w-3.5 h-3.5" />
                        )}
                        {notifying
                          ? `Notifying ${prediction.bottleneckDept}…`
                          : notifySent
                          ? `${prediction.bottleneckDept} Notified`
                          : `Notify ${prediction.bottleneckDept}`}
                      </button>
                    )}
                  </div>
                )}
                <div className="text-[10px] text-teal-600 pt-1">Written back to ServiceNow bed_management record.</div>
              </div>
            )}
            {predictError && (
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
                {predictError}
              </div>
            )}
          </div>

          {/* Bed Action buttons */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            {selectedBed.patient && (
              <>
                <button
                  onClick={() => onDischargeBed(selectedBed.id)}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5 text-slate-600" />
                  Discharge & Trigger ServiceNow EVS Cleaning
                </button>
              </>
            )}

            <button
              onClick={() => onCleanBed(selectedBed.id)}
              className="w-full py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 border border-teal-200 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Mark Terminal Clean Complete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
