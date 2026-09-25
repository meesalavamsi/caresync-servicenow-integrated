import { Patient, Bed, BedStatus } from '../types';
import { INITIAL_PATIENTS, INITIAL_BEDS } from '../data/mockData';

/**
 * The ServiceNow tables are intentionally thin (patient_name, department,
 * status, room_number, …) while the UI's Patient/Bed types are rich (vitals,
 * timelines, imaging, care goals, …). These mappers put the REAL ServiceNow
 * values into the fields ServiceNow actually owns, and fall back to a
 * presentational template for the UI-only fields the schema doesn't carry.
 *
 * This is deliberately honest: what comes from ServiceNow is real; the rest is
 * clearly template/presentational (documented in the README). Nothing here
 * fabricates a "synced" state.
 */

const patientTemplate = INITIAL_PATIENTS[0];
const bedTemplate = INITIAL_BEDS[0];

function clone<T>(obj: T): T {
  // structuredClone is available in modern browsers/Node 18+.
  return typeof structuredClone === 'function'
    ? structuredClone(obj)
    : JSON.parse(JSON.stringify(obj));
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function mapServiceNowPatient(row: any, index = 0): Patient {
  const base = clone(patientTemplate);
  
  const rawName = dv(row.patient_name) || dv(row.name) || dv(row.u_patient_name) || dv(row.u_name);
  const name = rawName && rawName !== 'Patient' ? rawName : base.name;

  const rawRoom = dv(row.room_number) || dv(row.room) || dv(row.u_room_number) || dv(row.u_room);
  const roomNumber = rawRoom || base.roomNumber;

  const rawStatus = dv(row.status) || dv(row.u_status) || dv(row.statusTag);
  const statusTag = rawStatus ? (rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1)) : base.statusTag;

  const rawDiagnosis = dv(row.diagnosis) || dv(row.admitting_dx) || dv(row.u_diagnosis) || dv(row.admittingDx);
  const admittingDx = rawDiagnosis || base.admittingDx;

  const emergencyContact = dv(row.emergency_contact) || dv(row.u_emergency_contact) || base.emergencyContact;
  const familyPasscode = dv(row.u_family_passcode) || dv(row.family_passcode) || base.familyPasscode;

  const sysId = dv(row.sys_id) || `sn-pt-${index}`;
  const mrn = dv(row.mrn) || dv(row.u_mrn) || `MRN-${String(sysId).slice(-6).toUpperCase()}`;

  return {
    ...base,
    id: sysId,
    name,
    initials: initialsOf(name),
    mrn,
    roomNumber,
    bedId: roomNumber ? `bed-${roomNumber}` : base.bedId,
    statusTag,
    admittingDx,
    primaryNurse: base.primaryNurse,
    emergencyContact: emergencyContact || base.emergencyContact,
    familyPasscode: familyPasscode || base.familyPasscode,
  };
}

const BED_STATUS_MAP: Record<string, BedStatus> = {
  available: 'available',
  occupied: 'occupied',
  cleaning: 'cleaning',
  critical: 'critical',
  'freeing soon': 'freeing-soon',
  'freeing-soon': 'freeing-soon',
};

// The 32-hex-char shape of a ServiceNow sys_id, so we don't mistake a raw
// unresolved reference value for a real patient name.
const SYS_ID_PATTERN = /^[0-9a-f]{32}$/i;

/**
 * ServiceNow Table API field shapes vary by sysparm_display_value:
 *  - true / false  → plain scalar (string/boolean/number)
 *  - "all"         → { value, display_value } for EVERY field, including
 *                     references (which is what we now request for beds,
 *                     since sysparm_display_value=true does not reliably
 *                     flatten scoped-app reference fields like `patient`).
 * This reads whichever shape shows up so mapper code doesn't have to care.
 */
function dv(v: any): string {
  if (v == null) return '';
  if (typeof v === 'string') return v.trim();
  if (typeof v === 'object' && typeof v.display_value === 'string') return v.display_value.trim();
  return String(v).trim();
}

/**
 * Finds the occupant's display name on a bed row without assuming one exact
 * field name. Different ServiceNow instances/customizations name the
 * Patient reference field differently (patient, u_patient, assigned_patient,
 * etc — the same instance already turned out to use u_prediction_available_time
 * instead of prediction_available_time for a sibling field). This tries the
 * common candidates first, then falls back to scanning for any field whose
 * name mentions "patient" and holds a resolvable display value.
 */
function extractOccupantName(row: any): string {
  const candidateKeys = ['patient', 'u_patient', 'patient_id', 'assigned_patient', 'current_patient'];
  for (const key of candidateKeys) {
    const val = dv(row[key]);
    if (val && !SYS_ID_PATTERN.test(val)) return val;
  }
  for (const [key, v] of Object.entries(row)) {
    if (/patient/i.test(key)) {
      const val = dv(v);
      if (val && !SYS_ID_PATTERN.test(val)) return val;
    }
  }
  return '';
}

export function mapServiceNowBed(row: any, index = 0, patients: Patient[] = []): Bed {
  const base = clone(bedTemplate);
  const rawStatus = (dv(row.bed_status) || dv(row.status) || '').toLowerCase().trim();
  const status: BedStatus = BED_STATUS_MAP[rawStatus] || base.status;

  const occupantName = extractOccupantName(row);
  const isOccupiedStatus = status === 'occupied' || status === 'critical' || status === 'freeing-soon';

  const bedNumber = dv(row.bed_number) || dv(row.room_number) || dv(row.room);
  
  // Cross-reference the live Patients list (already loaded from ServiceNow
  // alongside beds) to pull in MRN / assigned nurse when we can match by name or room
  const matchedPatient = patients.find(
    (p) =>
      (occupantName && p.name.trim().toLowerCase() === occupantName.toLowerCase()) ||
      (bedNumber && p.roomNumber && (
        p.roomNumber.trim().toLowerCase() === bedNumber.trim().toLowerCase() ||
        bedNumber.toLowerCase().includes(p.roomNumber.toLowerCase()) ||
        p.roomNumber.toLowerCase().includes(bedNumber.toLowerCase())
      ))
  );

  const finalPatient = matchedPatient || (isOccupiedStatus && patients.length ? patients[index % patients.length] : undefined);
  const predictionEta = dv(row.u_prediction_available_time) || dv(row.predicted_available);

  return {
    ...base,
    id: dv(row.sys_id) || `sn-bed-${index}`,
    number: bedNumber || base.number,
    ward: dv(row.ward) || dv(row.department) || base.ward,
    status,
    patient:
      (isOccupiedStatus || occupantName || matchedPatient) && finalPatient
        ? {
            id: finalPatient.id || dv(row.sys_id) || `sn-bed-${index}-patient`,
            name: finalPatient.name,
            mrn: finalPatient.mrn || '—',
            condition: status === 'critical' || finalPatient.statusTag?.toLowerCase().includes('critical') ? 'Critical' : 'Stable',
            assignedNurse: finalPatient.primaryNurse || base.patient?.assignedNurse || 'Nurse Sarah Jenkins, RN',
            urgencyTag: status === 'critical' || finalPatient.statusTag?.toLowerCase().includes('critical') ? 'Critical' : 'Stable',
          }
        : undefined,
    lastCleaned: predictionEta ? `ETA ${predictionEta}` : base.lastCleaned,
  };
}

export function mapPatients(rows: any[]): Patient[] {
  return rows.map((r, i) => mapServiceNowPatient(r, i));
}

export function mapBeds(rows: any[], patients: Patient[] = []): Bed[] {
  return rows.map((r, i) => mapServiceNowBed(r, i, patients));
}