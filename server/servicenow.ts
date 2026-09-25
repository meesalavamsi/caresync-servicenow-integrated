import 'dotenv/config';
import axios, { AxiosInstance } from 'axios';

/**
 * ServiceNowClient — single backend layer communicating with ServiceNow Table API and Scripted REST APIs.
 * Sourced from environment variables. Credentials live ONLY on server.
 */
class ServiceNowClient {
  instanceUrl: string;
  username: string;
  password: string;
  client: AxiosInstance;
  configured: boolean;
  mode: 'live' | 'mock';

  constructor() {
    const rawUrl = (process.env.SERVICENOW_INSTANCE || process.env.SERVICENOW_INSTANCE_URL || 'https://dev183600.service-now.com').trim();
    // Safely extract base origin (e.g. https://dev183600.service-now.com) even if a full UI URL was pasted
    this.instanceUrl = rawUrl.replace(/^(https?:\/\/[^\/]+).*/i, '$1').replace(/\/$/, '');
    
    this.username = (process.env.SERVICENOW_USERNAME || 'admin').trim();
    this.password = (process.env.SERVICENOW_PASSWORD || `XlC5a]MRWD5Arl{}1,seO^vh:JRa5<AT#H^{@j*Jr$=`).trim();
    
    // Explicit mode check
    this.mode = (process.env.SERVICE_NOW_MODE as 'live' | 'mock') || 'live';
    this.configured = Boolean(this.instanceUrl && this.username && this.password);

    this.client = axios.create({
      baseURL: `${this.instanceUrl}/api`,
      auth: { username: this.username, password: this.password },
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      timeout: 15000,
    });
  }

  /** Lightweight reachability probe used by /api/health and /api/servicenow/health */
  async ping(): Promise<{ ok: boolean; message: string }> {
    if (this.mode === 'mock') {
      return { ok: true, message: 'ServiceNow Operating in Mock Mode (Local Development)' };
    }

    try {
      await axios.get(`${this.instanceUrl}/api/x_1850353_caresy_0/caresync/dashboard`, { timeout: 8000 });
      return { ok: true, message: 'ServiceNow Scripted REST API Connected & Operational' };
    } catch (err: any) {
      if (this.configured) {
        try {
          await this.client.get('/now/table/sys_user', { params: { sysparm_limit: 1 } });
          return { ok: true, message: 'ServiceNow Table API reachable and authenticated' };
        } catch (e: any) {
          const status = e?.response?.status;
          return { ok: false, message: status ? `ServiceNow returned HTTP ${status}` : `ServiceNow unreachable: ${e?.message}` };
        }
      }
      return { ok: false, message: 'ServiceNow unreachable: ' + (err?.message || 'network error') };
    }
  }

  async getDashboardData() {
    try {
      const res = await axios.get(`${this.instanceUrl}/api/x_1850353_caresy_0/caresync/dashboard`, { timeout: 8000 });
      return res.data.result;
    } catch (err: any) {
      const res = await this.client.get('/x_1850353_caresy_0/caresync/dashboard');
      return res.data.result;
    }
  }

  private getCandidateTables(table: string): string[] {
    const TABLE_ALIASES: Record<string, string[]> = {
      'incident': ['incident', 'x_1850353_caresy_0_incident', 'x_1850353_caresy_0_caresync_incidents', 'x_1850353_caresy_0_clin_task', 'x_snc_caresync_1_incident'],
      'x_snc_caresync_1_patient': ['x_1850353_caresy_0_patient', 'x_snc_caresync_1_patient'],
      'x_snc_caresync_1_clinical_task': ['x_1850353_caresy_0_clin_task', 'x_snc_caresync_1_clinical_task'],
      'x_snc_caresync_1_bed_management': ['x_1850353_caresy_0_bed_mgmt', 'x_snc_caresync_1_bed_management'],
      'x_snc_caresync_1_medication_administration_record': ['x_1850353_caresy_0_med_admin', 'x_snc_caresync_1_med_admin', 'x_snc_caresync_1_medication_administration_record'],
      'x_snc_caresync_1_care_plan': ['x_1850353_caresy_0_care_plan', 'x_snc_caresync_1_care_plan'],
    };
    return TABLE_ALIASES[table] || [table];
  }

  async getTableRecords(table: string, query = '', displayValue: boolean | 'all' = true, limit = 200) {
    const candidates = this.getCandidateTables(table);
    let lastError: any = null;
    for (const t of candidates) {
      try {
        const response = await this.client.get(`/now/table/${t}`, {
          params: { sysparm_query: query, sysparm_limit: limit, sysparm_display_value: displayValue },
        });
        return response.data.result as any[];
      } catch (err: any) {
        lastError = err;
        if (err?.response?.status !== 404) throw err;
      }
    }
    throw lastError;
  }

  async getRecord(table: string, sysId: string, displayValue = true) {
    const candidates = this.getCandidateTables(table);
    let lastError: any = null;
    for (const t of candidates) {
      try {
        const response = await this.client.get(`/now/table/${t}/${sysId}`, {
          params: { sysparm_display_value: displayValue },
        });
        return response.data.result as any;
      } catch (err: any) {
        lastError = err;
        if (err?.response?.status !== 404) throw err;
      }
    }
    throw lastError;
  }

  async createRecord(table: string, data: Record<string, any>) {
    const candidates = this.getCandidateTables(table);
    let lastError: any = null;
    for (const t of candidates) {
      try {
        const response = await this.client.post(`/now/table/${t}`, data);
        return response.data.result as any;
      } catch (err: any) {
        lastError = err;
        if (err?.response?.status !== 404) throw err;
      }
    }
    throw lastError;
  }

  async updateRecord(table: string, sysId: string, data: Record<string, any>) {
    const candidates = this.getCandidateTables(table);
    let lastError: any = null;
    for (const t of candidates) {
      try {
        const response = await this.client.put(`/now/table/${t}/${sysId}`, data);
        return response.data.result as any;
      } catch (err: any) {
        lastError = err;
        if (err?.response?.status !== 404) throw err;
      }
    }
    throw lastError;
  }

  async deleteRecord(table: string, sysId: string) {
    const candidates = this.getCandidateTables(table);
    let lastError: any = null;
    for (const t of candidates) {
      try {
        await this.client.delete(`/now/table/${t}/${sysId}`);
        return { success: true };
      } catch (err: any) {
        lastError = err;
        if (err?.response?.status !== 404) throw err;
      }
    }
    throw lastError;
  }

  async findUserByEmail(email: string) {
    try {
      const response = await this.client.get('/now/table/sys_user', {
        params: { sysparm_query: `email=${email}`, sysparm_limit: 1 },
      });
      const result = response.data.result;
      return result && result.length > 0 ? result[0] : null;
    } catch {
      return null;
    }
  }

  async findUserByUsername(userId: string) {
    try {
      const response = await this.client.get('/now/table/sys_user', {
        params: { sysparm_query: `user_name=${userId}`, sysparm_limit: 1 },
      });
      const result = response.data.result;
      return result && result.length > 0 ? result[0] : null;
    } catch {
      return null;
    }
  }

  async assignRole(userSysId: string, roleName: string) {
    try {
      const roleRes = await this.client.get('/now/table/sys_user_role', {
        params: { sysparm_query: `name=x_snc_caresync_1.${roleName}`, sysparm_limit: 1 },
      });
      if (roleRes.data.result && roleRes.data.result.length > 0) {
        const roleSysId = roleRes.data.result[0].sys_id;
        await this.client.post('/now/table/sys_user_has_role', {
          user: userSysId,
          role: roleSysId,
        });
        return true;
      }
    } catch (e: any) {
      console.warn(`[ServiceNow] Role assignment skipped or warning: ${e?.message}`);
    }
    return false;
  }
}

export const snClient = new ServiceNowClient();
export default snClient;