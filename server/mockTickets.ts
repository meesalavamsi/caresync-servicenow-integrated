export interface MockTicket {
  id: string;
  number: string;
  sysId: string;
  shortDescription: string;
  description: string;
  issueType: string;
  category: string;
  subcategory: string;
  priority: string;
  status: string;
  caller: string;
  callerRole: string;
  callerEmail: string;
  assignedTo: string;
  assignedGroup: string;
  department: string;
  location: string;
  patientId?: string;
  patientName?: string;
  created: string;
  updated: string;
  resolvedAt?: string;
  closedAt?: string;
  slaStatus: string;
  slaTimeLeft: string;
  workNotes: Array<{
    id: string;
    author: string;
    role: string;
    timestamp: string;
    text: string;
  }>;
  timeline: Array<{
    id: string;
    timestamp: string;
    time: string;
    title: string;
    description?: string;
    actor?: string;
  }>;
  attachments: Array<{
    id: string;
    fileName: string;
    fileSize: string;
    fileType: string;
    uploadedAt: string;
  }>;
  resolutionNotes?: string;
}

declare global {
  var __ticketCounter: number | undefined;
}

const getNextTicketCounter = () => {
  if (typeof globalThis.__ticketCounter !== 'number') {
    globalThis.__ticketCounter = 10250;
  }
  globalThis.__ticketCounter += 1;
  return globalThis.__ticketCounter;
};

const initialTickets: MockTicket[] = [
  {
    id: 'INC0010245',
    number: 'INC0010245',
    sysId: 'sys_inc_10245',
    shortDescription: 'Radiology printer is not printing',
    description: 'The printer near Radiology workstation 2 is showing an error and is not printing patient diagnostic reports.',
    issueType: 'Incident',
    category: 'Hardware',
    subcategory: 'Printer',
    priority: 'High',
    status: 'In Progress',
    caller: 'Dr. Sarah Jenkins',
    callerRole: 'doctor',
    callerEmail: 'sarah.jenkins@caresync.org',
    assignedTo: 'Alex Rivers (IT Support)',
    assignedGroup: 'IT Field Support',
    department: 'Radiology',
    location: 'Radiology Dept - Room 2B',
    created: '2026-09-25T09:42:00.000Z',
    updated: '2026-09-25T10:02:00.000Z',
    slaStatus: 'On Track',
    slaTimeLeft: '02:14 remaining',
    workNotes: [
      {
        id: 'wn-1',
        author: 'System',
        role: 'system',
        timestamp: '09:42 AM',
        text: 'Ticket created via CareSync Portal. Routed to IT Field Support queue.'
      },
      {
        id: 'wn-2',
        author: 'Alex Rivers',
        role: 'it_support',
        timestamp: '09:48 AM',
        text: 'Ticket assigned to Alex Rivers. Investigating hardware spooler logs.'
      },
      {
        id: 'wn-3',
        author: 'Alex Rivers',
        role: 'it_support',
        timestamp: '10:02 AM',
        text: 'Work started. Dispatching technician to Radiology Room 2B to inspect paper jam and roller assembly.'
      }
    ],
    timeline: [
      { id: 'tl-1', timestamp: '2026-09-25T09:42:00Z', time: '09:42 AM', title: 'Ticket Created', description: 'Created by Dr. Sarah Jenkins', actor: 'Dr. Sarah Jenkins' },
      { id: 'tl-2', timestamp: '2026-09-25T09:48:00Z', time: '09:48 AM', title: 'Assigned to IT Support', description: 'Assigned to Alex Rivers', actor: 'System' },
      { id: 'tl-3', timestamp: '2026-09-25T10:02:00Z', time: '10:02 AM', title: 'Work Started', description: 'Status updated to In Progress', actor: 'Alex Rivers' }
    ],
    attachments: [
      { id: 'att-1', fileName: 'printer_error_screen.png', fileSize: '1.2 MB', fileType: 'image/png', uploadedAt: '09:42 AM' }
    ]
  },
  {
    id: 'INC0010246',
    number: 'INC0010246',
    sysId: 'sys_inc_10246',
    shortDescription: 'Unable to log into Epic EMR workstation',
    description: 'Login screen hangs after entering smartcard credentials on Ward 4 Cardiac ICU terminal 1.',
    issueType: 'Incident',
    category: 'Access & Authentication',
    subcategory: 'EMR Login',
    priority: 'Critical',
    status: 'New',
    caller: 'Nurse Emily Vance',
    callerRole: 'nurse',
    callerEmail: 'emily.vance@caresync.org',
    assignedTo: 'Unassigned',
    assignedGroup: 'Identity & Access Management',
    department: 'Cardiac ICU',
    location: 'Ward 4 - Nursing Station',
    patientId: 'PT-9982',
    patientName: 'Robert Vance',
    created: '2026-09-25T10:15:00.000Z',
    updated: '2026-09-25T10:15:00.000Z',
    slaStatus: 'At Risk',
    slaTimeLeft: '00:45 remaining',
    workNotes: [
      {
        id: 'wn-4',
        author: 'Nurse Emily Vance',
        role: 'nurse',
        timestamp: '10:15 AM',
        text: 'Critical issue: Unable to access patient chart prior to morning round.'
      }
    ],
    timeline: [
      { id: 'tl-4', timestamp: '2026-09-25T10:15:00Z', time: '10:15 AM', title: 'Ticket Created', description: 'Priority set to Critical', actor: 'Nurse Emily Vance' }
    ],
    attachments: []
  },
  {
    id: 'INC0010247',
    number: 'INC0010247',
    sysId: 'sys_inc_10247',
    shortDescription: 'Pediatric ward Wi-Fi network dropping connection',
    description: 'Wireless access points in Pod B are repeatedly disconnecting handheld scanners during patient vitals entry.',
    issueType: 'Incident',
    category: 'Network',
    subcategory: 'Wi-Fi',
    priority: 'Medium',
    status: 'Waiting',
    caller: 'Dr. Michael Chen',
    callerRole: 'doctor',
    callerEmail: 'michael.chen@caresync.org',
    assignedTo: 'David Miller (Network Operations)',
    assignedGroup: 'Network Infrastructure',
    department: 'Pediatrics',
    location: 'Pediatric Ward - Pod B',
    created: '2026-09-25T08:30:00.000Z',
    updated: '2026-09-25T09:15:00.000Z',
    slaStatus: 'On Track',
    slaTimeLeft: '04:30 remaining',
    workNotes: [
      { id: 'wn-5', author: 'System', role: 'system', timestamp: '08:30 AM', text: 'Ticket logged by Dr. Michael Chen' },
      { id: 'wn-6', author: 'David Miller', role: 'it_support', timestamp: '09:15 AM', text: 'Waiting for vendor diagnostic on AP-PodB-04 controller channel interference.' }
    ],
    timeline: [
      { id: 'tl-5', timestamp: '2026-09-25T08:30:00Z', time: '08:30 AM', title: 'Ticket Created', actor: 'Dr. Michael Chen' },
      { id: 'tl-6', timestamp: '2026-09-25T09:15:00Z', time: '09:15 AM', title: 'State changed to Waiting', actor: 'David Miller' }
    ],
    attachments: []
  },
  {
    id: 'INC0010248',
    number: 'INC0010248',
    sysId: 'sys_inc_10248',
    shortDescription: 'Bedside monitor telemetry feed lag',
    description: 'Telemetry monitor on Bed 14B was displaying 5-second waveform lag.',
    issueType: 'Incident',
    category: 'Medical Equipment',
    subcategory: 'Telemetry',
    priority: 'High',
    status: 'Resolved',
    caller: 'Nurse James Taylor',
    callerRole: 'nurse',
    callerEmail: 'james.taylor@caresync.org',
    assignedTo: 'Biomedical Support Team',
    assignedGroup: 'Biomedical Engineering',
    department: 'Cardiology',
    location: 'Ward 4 - Bed 14B',
    created: '2026-09-25T07:10:00.000Z',
    updated: '2026-09-25T08:45:00.000Z',
    resolvedAt: '2026-09-25T08:45:00.000Z',
    slaStatus: 'Met',
    slaTimeLeft: 'Resolved within SLA',
    resolutionNotes: 'Replaced telemetry transceiver cable and re-calibrated central station receiver module. Verification test passed.',
    workNotes: [
      { id: 'wn-7', author: 'Biomed Team', role: 'it_support', timestamp: '08:45 AM', text: 'Issue resolved. Hardware cable replaced.' }
    ],
    timeline: [
      { id: 'tl-7', timestamp: '2026-09-25T07:10:00Z', time: '07:10 AM', title: 'Ticket Created', actor: 'Nurse James Taylor' },
      { id: 'tl-8', timestamp: '2026-09-25T08:45:00Z', time: '08:45 AM', title: 'Resolved', actor: 'Biomedical Support Team' }
    ],
    attachments: []
  },
  {
    id: 'REQ0010249',
    number: 'REQ0010249',
    sysId: 'sys_req_10249',
    shortDescription: 'Request access to ICU Patient Transfer module',
    description: 'Requires read/write role access for new ICU shift coordination software.',
    issueType: 'Request',
    category: 'Access & Authentication',
    subcategory: 'Access Request',
    priority: 'Low',
    status: 'Closed',
    caller: 'Staff Officer David Ray',
    callerRole: 'staff',
    callerEmail: 'david.ray@caresync.org',
    assignedTo: 'System Administrator',
    assignedGroup: 'System Admin',
    department: 'Intensive Care Unit',
    location: 'ICU Administration',
    created: '2026-09-24T14:00:00.000Z',
    updated: '2026-09-24T16:30:00.000Z',
    closedAt: '2026-09-24T16:30:00.000Z',
    slaStatus: 'Met',
    slaTimeLeft: 'Completed within SLA',
    resolutionNotes: 'Role x_snc_caresync_1.icu_transfer assigned to user sys_id sys_user_davidray.',
    workNotes: [
      { id: 'wn-8', author: 'System Admin', role: 'admin', timestamp: '04:30 PM', text: 'Access granted and ticket closed.' }
    ],
    timeline: [
      { id: 'tl-9', timestamp: '2026-09-24T14:00:00Z', time: '02:00 PM', title: 'Request Submitted', actor: 'Staff Officer David Ray' },
      { id: 'tl-10', timestamp: '2026-09-24T16:30:00Z', time: '04:30 PM', title: 'Closed & Fulfilled', actor: 'System Admin' }
    ],
    attachments: []
  }
];

class MockTicketStore {
  private tickets: MockTicket[] = [...initialTickets];

  getAll(): MockTicket[] {
    return [...this.tickets];
  }

  getById(idOrNumber: string): MockTicket | undefined {
    const query = String(idOrNumber).trim().toLowerCase();
    return this.tickets.find(
      t => t.id.toLowerCase() === query || t.number.toLowerCase() === query || t.sysId.toLowerCase() === query
    );
  }

  create(data: {
    shortDescription: string;
    description: string;
    issueType?: string;
    category: string;
    subcategory?: string;
    priority?: string;
    location?: string;
    department?: string;
    caller?: string;
    callerRole?: string;
    callerEmail?: string;
    patientId?: string;
    patientName?: string;
    attachmentName?: string;
  }): MockTicket {
    const nextCount = getNextTicketCounter();
    const prefix = (data.issueType === 'Request') ? 'REQ' : 'INC';
    const num = `${prefix}00${nextCount}`;
    const now = new Date();
    const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newTicket: MockTicket = {
      id: num,
      number: num,
      sysId: `sys_${num.toLowerCase()}_${Date.now()}`,
      shortDescription: data.shortDescription,
      description: data.description || '',
      issueType: data.issueType || 'Incident',
      category: data.category || 'Other',
      subcategory: data.subcategory || data.category || 'General',
      priority: data.priority || 'Medium',
      status: 'New',
      caller: data.caller || 'Hospital Staff',
      callerRole: data.callerRole || 'staff',
      callerEmail: data.callerEmail || 'staff@caresync.org',
      assignedTo: 'Unassigned',
      assignedGroup: 'IT Support Team',
      department: data.department || 'General Operations',
      location: data.location || 'Hospital Main Facility',
      patientId: data.patientId,
      patientName: data.patientName,
      created: now.toISOString(),
      updated: now.toISOString(),
      slaStatus: 'On Track',
      slaTimeLeft: '04:00 remaining',
      workNotes: [
        {
          id: `wn-${Date.now()}`,
          author: data.caller || 'Requester',
          role: data.callerRole || 'user',
          timestamp: formattedTime,
          text: `Ticket created via CareSync Portal. Category: ${data.category}, Priority: ${data.priority || 'Medium'}`
        }
      ],
      timeline: [
        {
          id: `tl-${Date.now()}`,
          timestamp: now.toISOString(),
          time: formattedTime,
          title: 'Ticket Created',
          description: `Created ticket ${num} in ServiceNow`,
          actor: data.caller || 'CareSync User'
        }
      ],
      attachments: data.attachmentName ? [
        {
          id: `att-${Date.now()}`,
          fileName: data.attachmentName,
          fileSize: '850 KB',
          fileType: 'application/octet-stream',
          uploadedAt: formattedTime
        }
      ] : []
    };

    this.tickets.unshift(newTicket);
    return newTicket;
  }

  update(idOrNumber: string, updateData: {
    status?: string;
    assignedTo?: string;
    priority?: string;
    workNote?: string;
    resolutionNotes?: string;
    actor?: string;
  }): MockTicket | undefined {
    const ticket = this.getById(idOrNumber);
    if (!ticket) return undefined;

    const now = new Date();
    const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const actorName = updateData.actor || 'IT Support Technician';

    if (updateData.status && updateData.status !== ticket.status) {
      const oldStatus = ticket.status;
      ticket.status = updateData.status;
      ticket.timeline.push({
        id: `tl-${Date.now()}`,
        timestamp: now.toISOString(),
        time: formattedTime,
        title: `Status updated to ${updateData.status}`,
        description: `Changed from ${oldStatus} to ${updateData.status}`,
        actor: actorName
      });

      if (updateData.status === 'Resolved') {
        ticket.resolvedAt = now.toISOString();
        ticket.slaStatus = 'Met';
        ticket.slaTimeLeft = 'Resolved within SLA';
      } else if (updateData.status === 'Closed') {
        ticket.closedAt = now.toISOString();
        ticket.slaStatus = 'Met';
        ticket.slaTimeLeft = 'Closed';
      }
    }

    if (updateData.assignedTo && updateData.assignedTo !== ticket.assignedTo) {
      ticket.assignedTo = updateData.assignedTo;
      ticket.timeline.push({
        id: `tl-${Date.now()}`,
        timestamp: now.toISOString(),
        time: formattedTime,
        title: `Assigned to ${updateData.assignedTo}`,
        actor: actorName
      });
    }

    if (updateData.priority && updateData.priority !== ticket.priority) {
      ticket.priority = updateData.priority;
    }

    if (updateData.resolutionNotes) {
      ticket.resolutionNotes = updateData.resolutionNotes;
    }

    if (updateData.workNote) {
      ticket.workNotes.push({
        id: `wn-${Date.now()}`,
        author: actorName,
        role: 'it_support',
        timestamp: formattedTime,
        text: updateData.workNote
      });
    }

    ticket.updated = now.toISOString();
    return ticket;
  }

  addWorkNote(idOrNumber: string, author: string, role: string, text: string): MockTicket | undefined {
    const ticket = this.getById(idOrNumber);
    if (!ticket) return undefined;

    const now = new Date();
    const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    ticket.workNotes.push({
      id: `wn-${Date.now()}`,
      author,
      role,
      timestamp: formattedTime,
      text
    });

    ticket.updated = now.toISOString();
    return ticket;
  }

  getMetrics() {
    const total = this.tickets.length;
    const open = this.tickets.filter(t => t.status === 'New' || t.status === 'Assigned').length;
    const inProgress = this.tickets.filter(t => t.status === 'In Progress').length;
    const waiting = this.tickets.filter(t => t.status === 'Waiting').length;
    const resolved = this.tickets.filter(t => t.status === 'Resolved').length;
    const closed = this.tickets.filter(t => t.status === 'Closed').length;
    const highPriority = this.tickets.filter(t => t.priority === 'High' || t.priority === 'Critical').length;
    const slaBreaches = this.tickets.filter(t => t.slaStatus === 'Breached' || t.slaStatus === 'At Risk').length;

    const byCategory: Record<string, number> = {};
    const byDepartment: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    this.tickets.forEach(t => {
      byCategory[t.category] = (byCategory[t.category] || 0) + 1;
      byDepartment[t.department] = (byDepartment[t.department] || 0) + 1;
      byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;
      byStatus[t.status] = (byStatus[t.status] || 0) + 1;
    });

    return {
      totalTickets: total,
      openTickets: open + inProgress + waiting,
      inProgress,
      waiting,
      resolved,
      closed,
      highPriority,
      slaBreaches,
      avgResolutionTime: '38 mins',
      byCategory,
      byDepartment,
      byPriority,
      byStatus
    };
  }
}

export const mockTicketStore = new MockTicketStore();
