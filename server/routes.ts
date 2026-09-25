import type { Express, Request, Response } from 'express';
import { randomInt } from 'node:crypto';
import snClient from './servicenow.js';
import { mockTicketStore } from './mockTickets.js';
import { sendEmail, emailConfigured } from './email.js';
import { evaluateHandoff, predictBed, familyVoiceReply, aiConfigured } from './ai.js';
import approvalManager from './approvals.js';
import { resolveDeptEmail } from './departments.js';

const otpStore: Record<string, string> = {};

function normalizeEmail(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Translate raw ServiceNow incident state into human readable string
function mapStateToString(state: any): string {
  const s = String(state);
  switch (s) {
    case '1': return 'New';
    case '2': return 'In Progress';
    case '3': return 'Waiting';
    case '6': return 'Resolved';
    case '7': return 'Closed';
    default: return typeof state === 'string' && state ? state : 'New';
  }
}

// Translate ServiceNow priority into readable string
function mapPriorityToString(priority: any): string {
  const p = String(priority);
  if (p.includes('1')) return 'Critical';
  if (p.includes('2')) return 'High';
  if (p.includes('3')) return 'Medium';
  if (p.includes('4')) return 'Low';
  return typeof priority === 'string' && priority ? priority : 'Medium';
}

function mapIncidentToTicket(r: any) {
  const dv = (v: any) => (v && typeof v === 'object' ? v.display_value : v);
  const sysId = r.sys_id || `sys_${Date.now()}`;
  const number = r.number || `INC00${Math.floor(1000 + Math.random() * 9000)}`;

  return {
    id: number,
    number,
    sysId,
    shortDescription: r.short_description || 'Hospital Service Issue',
    description: r.description || r.short_description || '',
    issueType: 'Incident',
    category: dv(r.category) || 'Hardware',
    subcategory: dv(r.subcategory) || dv(r.category) || 'General',
    priority: mapPriorityToString(dv(r.priority)),
    status: mapStateToString(dv(r.state)),
    caller: dv(r.caller_id) || 'CareSync User',
    callerRole: 'doctor',
    callerEmail: 'staff@caresync.org',
    assignedTo: dv(r.assigned_to) || 'Unassigned',
    assignedGroup: dv(r.assignment_group) || 'IT Support Team',
    department: dv(r.department) || 'Hospital Operations',
    location: dv(r.location) || 'Main Facility',
    created: dv(r.opened_at) || dv(r.sys_created_on) || new Date().toISOString(),
    updated: dv(r.sys_updated_on) || new Date().toISOString(),
    slaStatus: 'On Track',
    slaTimeLeft: '02:30 remaining',
    workNotes: r.work_notes ? String(r.work_notes).split('\n').filter(Boolean).map((n, idx) => ({
      id: `wn-${idx}`,
      author: 'IT Support',
      role: 'it_support',
      timestamp: 'Recently',
      text: n
    })) : [],
    timeline: [
      { id: 'tl-1', timestamp: r.opened_at || new Date().toISOString(), time: '09:00 AM', title: 'Ticket Created', actor: dv(r.caller_id) || 'User' }
    ],
    attachments: []
  };
}

export function registerRoutes(app: Express) {
  // ── 1. HEALTH & CONNECTIVITY ─────────────────────────────────────────────
  app.get('/api/health', async (_req: Request, res: Response) => {
    const sn = await snClient.ping();
    res.json({
      status: 'healthy',
      service: 'CareSync Service Management API',
      mode: snClient.mode,
      serviceNow: { connected: sn.ok, message: sn.message, configured: snClient.configured },
      ai: aiConfigured,
      email: { configured: emailConfigured },
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/servicenow/health', async (_req: Request, res: Response) => {
    const pingRes = await snClient.ping();
    res.json({
      success: true,
      instanceUrl: snClient.instanceUrl,
      mode: snClient.mode,
      connected: pingRes.ok,
      ping: pingRes.message,
    });
  });

  // ── 2. TICKETS & SERVICE MANAGEMENT ─────────────────────────────────────
  app.get('/api/tickets', async (req: Request, res: Response) => {
    const { role, status, category, search } = req.query as Record<string, string>;

    try {
      let ticketsList: any[] = [];

      if (snClient.mode === 'live' && snClient.configured) {
        try {
          const rows = await snClient.getTableRecords('incident', 'active=true', true, 100);
          ticketsList = rows.map(mapIncidentToTicket);
        } catch {
          // Fallback to mock ticket store if live ServiceNow query fails
          ticketsList = mockTicketStore.getAll();
        }
      } else {
        ticketsList = mockTicketStore.getAll();
      }

      // Apply filters if provided
      if (status && status !== 'All') {
        ticketsList = ticketsList.filter(t => t.status.toLowerCase() === status.toLowerCase());
      }
      if (category && category !== 'All') {
        ticketsList = ticketsList.filter(t => t.category.toLowerCase() === category.toLowerCase());
      }
      if (search) {
        const q = search.toLowerCase();
        ticketsList = ticketsList.filter(
          t => t.number.toLowerCase().includes(q) ||
               t.shortDescription.toLowerCase().includes(q) ||
               t.category.toLowerCase().includes(q) ||
               t.caller.toLowerCase().includes(q)
        );
      }

      res.json({ success: true, count: ticketsList.length, tickets: ticketsList });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch tickets', detail: error?.message });
    }
  });

  app.get('/api/tickets/:id', async (req: Request, res: Response) => {
    const { id } = req.params;

    if (snClient.mode === 'live' && snClient.configured) {
      try {
        const row = await snClient.getRecord('incident', id, true);
        if (row) return res.json({ success: true, ticket: mapIncidentToTicket(row) });
      } catch { /* fallback to mock store */ }
    }

    const mockTicket = mockTicketStore.getById(id);
    if (mockTicket) {
      return res.json({ success: true, ticket: mockTicket });
    }

    res.status(404).json({ success: false, message: 'Ticket not found' });
  });

  app.post('/api/tickets', async (req: Request, res: Response) => {
    const {
      issueType, category, subcategory, shortDescription, description,
      location, department, priority, caller, callerRole, callerEmail,
      patientId, patientName, attachment
    } = req.body;

    if (!shortDescription || !category) {
      return res.status(400).json({ success: false, message: 'Category and Short Description are required.' });
    }

    let createdTicket: any = null;

    if (snClient.mode === 'live' && snClient.configured) {
      try {
        const createdSN = await snClient.createRecord('incident', {
          short_description: shortDescription,
          description: description || '',
          category: category.toLowerCase(),
          subcategory: (subcategory || category).toLowerCase(),
          urgency: priority === 'Critical' || priority === 'High' ? '1' : '3',
          impact: priority === 'Critical' ? '1' : '3',
          location: location || '',
        });
        createdTicket = mapIncidentToTicket(createdSN);
      } catch (err: any) {
        console.warn('[ServiceNow Ticket Creation Warning]: Falling back to local store:', err?.message);
      }
    }

    // Fallback or Mock mode
    if (!createdTicket) {
      createdTicket = mockTicketStore.create({
        issueType, category, subcategory, shortDescription, description,
        location, department, priority, caller, callerRole, callerEmail,
        patientId, patientName,
        attachmentName: attachment ? attachment.fileName || 'attachment.pdf' : undefined
      });
    }

    res.status(201).json({
      success: true,
      message: 'Ticket created successfully',
      ticket: createdTicket
    });
  });

  app.patch('/api/tickets/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, assignedTo, priority, workNote, resolutionNotes, actor } = req.body;

    let updatedTicket: any = null;

    if (snClient.mode === 'live' && snClient.configured) {
      try {
        const payload: Record<string, any> = {};
        if (status) {
          if (status === 'In Progress') payload.state = '2';
          else if (status === 'Waiting') payload.state = '3';
          else if (status === 'Resolved') payload.state = '6';
          else if (status === 'Closed') payload.state = '7';
        }
        if (workNote) payload.work_notes = workNote;
        if (resolutionNotes) payload.close_notes = resolutionNotes;

        const updatedSN = await snClient.updateRecord('incident', id, payload);
        updatedTicket = mapIncidentToTicket(updatedSN);
      } catch (err: any) {
        console.warn('[ServiceNow Ticket Update Warning]: Falling back to local store:', err?.message);
      }
    }

    if (!updatedTicket) {
      updatedTicket = mockTicketStore.update(id, {
        status, assignedTo, priority, workNote, resolutionNotes, actor
      });
    }

    if (!updatedTicket) {
      return res.status(404).json({ success: false, message: 'Ticket not found for update' });
    }

    res.json({ success: true, message: 'Ticket updated successfully', ticket: updatedTicket });
  });

  app.post('/api/tickets/:id/comments', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { text, author, role } = req.body;

    if (!text) return res.status(400).json({ success: false, message: 'Comment text is required.' });

    const ticket = mockTicketStore.addWorkNote(id, author || 'User', role || 'staff', text);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    res.json({ success: true, ticket });
  });

  app.get('/api/dashboard', async (_req: Request, res: Response) => {
    let metrics = mockTicketStore.getMetrics();

    if (snClient.mode === 'live' && snClient.configured) {
      try {
        const snDash = await snClient.getDashboardData();
        if (snDash) {
          metrics = { ...metrics, ...snDash };
        }
      } catch { /* use calculated metrics */ }
    }

    res.json({ success: true, metrics });
  });

  app.get('/api/notifications', async (_req: Request, res: Response) => {
    const mockNotifications = [
      {
        id: 'notif-1',
        ticketNumber: 'INC0010245',
        ticketId: 'INC0010245',
        title: 'Work Started',
        message: 'Ticket INC0010245 (Radiology printer) has been assigned to Alex Rivers and work has started.',
        type: 'info',
        timestamp: '10:02 AM',
        read: false
      },
      {
        id: 'notif-2',
        ticketNumber: 'INC0010246',
        ticketId: 'INC0010246',
        title: 'SLA Warning',
        message: 'Ticket INC0010246 (EMR Login) SLA is approaching breach (45 mins remaining).',
        type: 'warning',
        timestamp: '10:15 AM',
        read: false
      },
      {
        id: 'notif-3',
        ticketNumber: 'INC0010248',
        ticketId: 'INC0010248',
        title: 'Ticket Resolved',
        message: 'Ticket INC0010248 (Bedside telemetry waveform lag) has been resolved by Biomedical Engineering.',
        type: 'success',
        timestamp: '08:45 AM',
        read: true
      }
    ];

    res.json({ success: true, notifications: mockNotifications });
  });

  // ── 3. AUTH & USER MANAGEMENT ──────────────────────────────────────────
  app.post('/api/auth/send-otp', async (req: Request, res: Response) => {
    const email = normalizeEmail(req.body?.email);
    if (!isValidEmail(email)) return res.status(400).json({ success: false, message: 'A valid email address is required.' });
    const otp = randomInt(100000, 1000000).toString();
    otpStore[email] = otp;
    setTimeout(() => delete otpStore[email], 5 * 60 * 1000);

    const sent = await sendEmail(
      email,
      'Your CareSync Verification Code',
      `Your verification code is: ${otp}\n\nThis code will expire in 5 minutes.`,
    );

    res.json({ success: true, message: 'OTP sent.', devOtp: emailConfigured ? undefined : otp });
  });

  app.post('/api/auth/login', async (req: Request, res: Response) => {
    const { userId, password, role } = req.body;

    // Quick role login fallback for testing/demo
    const defaultUsers: Record<string, any> = {
      doctor: { sys_id: 'usr_doc', userId: 'CS-DOC01', name: 'Dr. Sarah Jenkins', email: 'sarah.jenkins@caresync.org', role: 'doctor', dept: 'Radiology' },
      nurse: { sys_id: 'usr_nurse', userId: 'CS-NUR01', name: 'Nurse Emily Vance', email: 'emily.vance@caresync.org', role: 'nurse', dept: 'Cardiac ICU' },
      receptionist: { sys_id: 'usr_rec', userId: 'CS-REC01', name: 'Intake Desk', email: 'intake@caresync.org', role: 'receptionist', dept: 'Admissions' },
      staff: { sys_id: 'usr_staff', userId: 'CS-STF01', name: 'Officer David Ray', email: 'david.ray@caresync.org', role: 'staff', dept: 'Hospital Operations' },
      it_support: { sys_id: 'usr_it', userId: 'CS-IT01', name: 'Alex Rivers (IT)', email: 'alex.rivers@caresync.org', role: 'it_support', dept: 'IT Service Desk' },
      admin: { sys_id: 'usr_admin', userId: 'CS-ADM01', name: 'System Administrator', email: 'admin@caresync.org', role: 'admin', dept: 'Hospital Administration' }
    };

    if (role && defaultUsers[role]) {
      return res.json({ success: true, user: defaultUsers[role] });
    }

    if (snClient.mode === 'live' && snClient.configured) {
      try {
        const snUser = await snClient.findUserByUsername(userId);
        if (snUser) {
          return res.json({
            success: true,
            user: {
              sys_id: snUser.sys_id,
              userId: snUser.user_name,
              name: `${snUser.first_name || ''} ${snUser.last_name || ''}`.trim() || snUser.user_name,
              email: snUser.email,
              role: snUser.title ? String(snUser.title).toLowerCase() : 'doctor',
              dept: snUser.department ? (typeof snUser.department === 'object' ? snUser.department.display_value : snUser.department) : 'General'
            }
          });
        }
      } catch { /* fallback to default user */ }
    }

    // Default mock user matching login request
    const userRole = role || 'doctor';
    const fallbackUser = defaultUsers[userRole] || {
      sys_id: `sys_usr_${Date.now()}`,
      userId: userId || 'CS-1024',
      name: userId ? `User (${userId})` : 'Dr. Sarah Jenkins',
      email: 'user@caresync.org',
      role: userRole,
      dept: 'Clinical Operations'
    };

    res.json({ success: true, user: fallbackUser });
  });

  // ── 4. BACKWARD COMPATIBLE CLINICAL ENDPOINTS ────────────────────────────
  app.get('/api/patients', async (_req: Request, res: Response) => {
    try {
      if (snClient.mode === 'live' && snClient.configured) {
        const patients = await snClient.getTableRecords('x_snc_caresync_1_patient');
        return res.json({ success: true, patients });
      }
    } catch { /* fallback */ }
    res.json({
      success: true,
      patients: [
        { sys_id: 'pt-1', patient_name: 'Robert Vance', room_number: '14B', status: 'Stable', diagnosis: 'Post-op Cardiac' },
        { sys_id: 'pt-2', patient_name: 'Elena Rostova', room_number: '08A', status: 'Telemetry Monitoring', diagnosis: 'Arrhythmia' }
      ]
    });
  });

  app.get('/api/incidents', async (_req: Request, res: Response) => {
    const mockTickets = mockTicketStore.getAll();
    res.json({ success: true, configured: snClient.configured, incidents: mockTickets });
  });

  app.post('/api/incidents', async (req: Request, res: Response) => {
    const { title, description, priority, category, location } = req.body;
    const ticket = mockTicketStore.create({
      shortDescription: title || 'Clinical Incident',
      description: description || '',
      category: category || 'Hardware',
      priority: priority || 'Medium',
      location: location || 'Hospital Station'
    });
    res.status(201).json({ success: true, incident: ticket });
  });
}