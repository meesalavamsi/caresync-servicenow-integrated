import React, { useState } from 'react';
import { UserSession, CareSyncTicket, TicketCategory, TicketPriority, TicketIssueType } from '../../types';
import { CheckCircle2, Upload, AlertCircle, ArrowLeft, Send, FileText, Sparkles, Building2, MapPin } from 'lucide-react';

interface RaiseTicketViewProps {
  user: UserSession;
  onTicketCreated: (newTicket: CareSyncTicket) => void;
  onCancel: () => void;
}

export const RaiseTicketView: React.FC<RaiseTicketViewProps> = ({
  user,
  onTicketCreated,
  onCancel
}) => {
  const [issueType, setIssueType] = useState<TicketIssueType>('Incident');
  const [category, setCategory] = useState<TicketCategory>('Hardware');
  const [subcategory, setSubcategory] = useState('Printer');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('Radiology Department - Workstation 2');
  const [department, setDepartment] = useState(user.dept || 'Radiology');
  const [priority, setPriority] = useState<TicketPriority>('High');
  const [patientId, setPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<CareSyncTicket | null>(null);
  const [error, setError] = useState('');

  const categories: { name: TicketCategory; icon: string; subcategories: string[] }[] = [
    { name: 'Hardware', icon: '💻', subcategories: ['Workstation', 'Monitor', 'Scanner', 'Bar Code Reader', 'Keyboard/Mouse'] },
    { name: 'Printer', icon: '🖨️', subcategories: ['Printer', 'Label Maker', 'Wristband Printer', 'Toner/Paper Jam'] },
    { name: 'Software', icon: '💿', subcategories: ['OS Crash', 'Software Install', 'Epic/EMR Bug', 'PACS Viewer'] },
    { name: 'Network', icon: '🌐', subcategories: ['Wi-Fi', 'LAN Cable', 'VPN', 'Server Connection'] },
    { name: 'Access & Authentication', icon: '🔑', subcategories: ['EMR Login', 'Smartcard Reader', 'Password Reset', 'Role Permission'] },
    { name: 'Application', icon: '📱', subcategories: ['Clinical Portal', 'Bed Management App', 'Pharmacy Pyxis', 'Lab System'] },
    { name: 'Patient Information System', icon: '🏥', subcategories: ['Patient Search', 'MRN Lookup', 'Admission Record'] },
    { name: 'Medical Equipment', icon: '🩺', subcategories: ['Bedside Telemetry', 'Infusion Pump', 'ECG Machine', 'Vital Monitor'] },
    { name: 'Bed Management', icon: '🛏️', subcategories: ['Bed Status Sensor', 'Turnover Queue', 'Transfer Alert'] },
    { name: 'Other', icon: '⚙️', subcategories: ['General Facilities', 'Electrical', 'HVAC/Temp', 'Unlisted Issue'] },
  ];

  const subcategoryOptions = categories.find(c => c.name === category)?.subcategories || ['General'];

  const handleCategoryChange = (cat: TicketCategory) => {
    setCategory(cat);
    const subOpts = categories.find(c => c.name === cat)?.subcategories || ['General'];
    setSubcategory(subOpts[0] || 'General');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issueType,
          category,
          subcategory,
          shortDescription,
          description,
          location,
          department,
          priority,
          caller: user.name,
          callerRole: user.role,
          callerEmail: user.email,
          patientId: patientId || undefined,
          patientName: patientName || undefined,
          attachment: selectedFile ? { fileName: selectedFile.name, fileSize: `${(selectedFile.size / 1024).toFixed(0)} KB` } : undefined
        }),
      });

      const data = await res.json();

      if (data.success && data.ticket) {
        setSubmittedTicket(data.ticket);
        onTicketCreated(data.ticket);
      } else {
        setError(data.message || 'Failed to submit ticket to ServiceNow.');
      }
    } catch {
      setError('Network error while connecting to CareSync service endpoint.');
    } finally {
      setLoading(false);
    }
  };

  // Success view post-submission
  if (submittedTicket) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">Ticket Created Successfully</h2>
            <p className="text-xs text-slate-500 mt-1">
              Your service request has been logged and routed in ServiceNow.
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-left space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ServiceNow Ticket Number</span>
              <span className="text-lg font-mono font-extrabold text-cyan-700 bg-cyan-50 px-3 py-1 rounded-xl border border-cyan-200">
                {submittedTicket.number}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Issue</span>
                <span className="font-semibold text-slate-800">{submittedTicket.shortDescription}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Category / Subcategory</span>
                <span className="font-semibold text-slate-800">{submittedTicket.category} / {submittedTicket.subcategory}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Status</span>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800">
                  {submittedTicket.status}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Priority</span>
                <span className="font-semibold text-slate-800">{submittedTicket.priority}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={onCancel}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">How can we help?</h2>
            <p className="text-xs text-slate-500">Submit a service or incident ticket to Hospital IT & Operational Support</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
        
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Issue Type & Category Selection */}
        <div className="space-y-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
            1. Select Category & Issue Type
          </label>

          <div className="grid grid-cols-3 gap-3 mb-2">
            {(['Incident', 'Request', 'Support Task'] as TicketIssueType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setIssueType(type)}
                className={`py-2.5 px-4 rounded-xl border text-xs font-bold transition-all ${
                  issueType === type
                    ? 'border-cyan-600 bg-cyan-50 text-cyan-800 shadow-xs ring-2 ring-cyan-500/20'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {categories.map((cat) => (
              <button
                key={cat.name}
                type="button"
                onClick={() => handleCategoryChange(cat.name)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  category === cat.name
                    ? 'border-cyan-600 bg-cyan-50/70 text-cyan-900 ring-2 ring-cyan-500/20 shadow-xs'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div className="text-xl mb-1">{cat.icon}</div>
                <div className="font-bold text-xs line-clamp-1">{cat.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Subcategory & Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Subcategory
            </label>
            <select
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {subcategoryOptions.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Priority Level
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TicketPriority)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="Low">Low - Minor inconvenience</option>
              <option value="Medium">Medium - Standard operational issue</option>
              <option value="High">High - Impairing clinical workflow</option>
              <option value="Critical">Critical - Patient care impacted</option>
            </select>
          </div>
        </div>

        {/* Problem Description */}
        <div className="space-y-4 pt-2 border-t border-slate-100">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
            2. Describe the Problem
          </label>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Short Summary / Title *
            </label>
            <input
              type="text"
              required
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="e.g. Radiology printer is not printing reports"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Full Description & Details
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide specific error codes, workstation IDs, or symptoms..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>

        {/* Location & Department */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Hospital Location / Room Number
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Radiology Dept - Workstation 2"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Department
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Radiology"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* Optional Patient Context */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <span className="text-xs font-bold text-slate-700 block">
            Optional Patient Context (Minimum Necessary Info)
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              placeholder="Patient ID / MRN (Optional)"
              className="px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-800"
            />
            <input
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="Patient Name (Optional)"
              className="px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-800"
            />
          </div>
        </div>

        {/* File Attachment Dropzone */}
        <div className="pt-2 border-t border-slate-100">
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Attachment (Optional Screenshot / Photo of Error)
          </label>
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center bg-slate-50 hover:bg-slate-100/60 transition-colors">
            <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
            <input
              type="file"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer text-xs font-semibold text-cyan-600 hover:underline">
              {selectedFile ? selectedFile.name : 'Click to attach image or document'}
            </label>
            <p className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, PDF up to 10MB</p>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span>Submitting to ServiceNow...</span>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Ticket</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};

export default RaiseTicketView;
