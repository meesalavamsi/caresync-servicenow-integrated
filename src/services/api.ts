import { CareSyncTicket, UserSession, DashboardMetrics, IntegrationHealth, SLAStatus, SystemNotification } from '../types';

export type SessionUser = UserSession;

export interface HealthStatus {
  status: string;
  service: string;
  mode: 'live' | 'mock';
  serviceNow: { connected: boolean; message: string; configured: boolean };
  ai: { main: boolean; voice: boolean };
  email: { configured: boolean };
  timestamp: string;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.success === false) {
    throw new Error(data?.message || `Request failed (${res.status})`);
  }
  return data as T;
}

export const api = {
  // Health checks
  health: () => request<HealthStatus>('/api/health'),
  getServiceNowHealth: () => request<{ success: boolean; instanceUrl: string; mode: 'live' | 'mock'; connected: boolean; ping: string }>('/api/servicenow/health'),

  // Auth
  login: (userId: string, password?: string, role?: string) =>
    request<{ success: boolean; user: UserSession }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ userId, password, role }),
    }),
  sendOtp: (email: string) =>
    request<{ success: boolean; devOtp?: string }>('/api/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  register: (payload: Record<string, any>) =>
    request<{ success: boolean; pendingApproval: boolean; userId?: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Tickets
  getTickets: (params?: { role?: string; status?: string; category?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.role) query.append('role', params.role);
    if (params?.status) query.append('status', params.status);
    if (params?.category) query.append('category', params.category);
    if (params?.search) query.append('search', params.search);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<{ success: boolean; count: number; tickets: CareSyncTicket[] }>(`/api/tickets${qs}`);
  },

  getTicketById: (id: string) =>
    request<{ success: boolean; ticket: CareSyncTicket }>(`/api/tickets/${id}`),

  createTicket: (payload: {
    issueType?: string;
    category: string;
    subcategory?: string;
    shortDescription: string;
    description: string;
    location?: string;
    department?: string;
    priority?: string;
    caller?: string;
    callerRole?: string;
    callerEmail?: string;
    patientId?: string;
    patientName?: string;
    attachment?: { fileName: string; fileSize?: string };
  }) =>
    request<{ success: boolean; message: string; ticket: CareSyncTicket }>('/api/tickets', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateTicket: (id: string, payload: {
    status?: string;
    assignedTo?: string;
    priority?: string;
    workNote?: string;
    resolutionNotes?: string;
    actor?: string;
  }) =>
    request<{ success: boolean; message: string; ticket: CareSyncTicket }>(`/api/tickets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  addComment: (id: string, text: string, author: string, role: string) =>
    request<{ success: boolean; ticket: CareSyncTicket }>(`/api/tickets/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text, author, role }),
    }),

  // Dashboard & Notifications
  getDashboardMetrics: () =>
    request<{ success: boolean; metrics: DashboardMetrics }>('/api/dashboard'),

  getDashboard: () => request<{ success: boolean; result: any }>('/api/dashboard'),

  getNotifications: () =>
    request<{ success: boolean; notifications: SystemNotification[] }>('/api/notifications'),

  // Legacy Patient & Incident & Clinical helpers
  getPatients: () => request<{ success: boolean; patients: any[] }>('/api/patients'),
  createPatient: (data: Record<string, any>) =>
    request<{ success: boolean; patient: any }>('/api/patients', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getIncidents: () => request<{ success: boolean; configured: boolean; incidents: any[] }>('/api/incidents'),
  createIncident: (payload: Record<string, any>) =>
    request<{ success: boolean; incident: any }>('/api/incidents', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateIncident: (sysId: string, body: { state?: string; workNote?: string }) =>
    request<{ success: boolean; incident: any }>(`/api/incidents/${sysId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  predictBed: (sysId: string, payload: Record<string, any>) =>
    request<{ success: boolean; aiAnalysis: any }>(`/api/beds/predict/${sysId}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  notifyBottleneck: (sysId: string, payload: any) =>
    request<{ success: boolean; snTaskId: string | null; emailSent: boolean; emailConfigured: boolean }>(`/api/beds/notify-bottleneck/${sysId}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  evaluateHandoff: (dictation: string) =>
    request<{ success: boolean; aiAnalysis: any }>('/api/handoffs/ai-evaluate', {
      method: 'POST',
      body: JSON.stringify({ dictation }),
    }),
  submitHandoff: (payload: Record<string, any>) =>
    request<{ success: boolean; recordId: string }>('/api/handoffs/final-submit', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  familyVoice: (payload: any) =>
    request<{ success: boolean; reply: string; source: 'ai' | 'fallback' }>('/api/family-voice/chat', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  verifyMedication: (payload: any) =>
    request<{ success: boolean; match: boolean; escalated: boolean; message: string }>('/api/medications/verify', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

export default api;
