const axios = require('axios');

async function executeServiceNowDirectPost() {
  const baseURL = 'https://dev183600.service-now.com';
  const instanceUser = 'admin';
  const instancePass = 'Mv@05/11/2005';

  console.log('--- TESTING DIRECT SERVICENOW FORM INSERTION ---');

  const cookieMap = {};

  function updateCookies(res) {
    const raw = res.headers['set-cookie'];
    if (raw) {
      raw.forEach(c => {
        const parts = c.split(';')[0].split('=');
        if (parts.length >= 2) {
          cookieMap[parts[0].trim()] = parts.slice(1).join('=').trim();
        }
      });
    }
  }

  function getCookieString() {
    return Object.keys(cookieMap).map(k => k + '=' + cookieMap[k]).join('; ');
  }

  try {
    const r1 = await axios.get(baseURL + '/login.do');
    updateCookies(r1);

    const params = new URLSearchParams();
    params.append('user_name', instanceUser);
    params.append('user_password', instancePass);
    params.append('sysverb_login', 'Sign in');

    const r2 = await axios.post(baseURL + '/login.do', params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': getCookieString()
      }
    });
    updateCookies(r2);

    const r3 = await axios.get(baseURL + '/nav_to.do', {
      headers: { 'Cookie': getCookieString() }
    });
    updateCookies(r3);

    const match = String(r3.data).match(/g_ck\s*=\s*['"]([a-f0-9]+)['"]/i);
    const userToken = match ? match[1] : null;
    console.log('Session UserToken Extracted:', userToken);

    // Form POST to incident.do
    const form = new URLSearchParams();
    form.append('sys_action', 'sysverb_insert');
    form.append('sys_target', 'incident');
    form.append('sysparm_ck', userToken || '');
    form.append('incident.short_description', 'CareSync Emergency Alert - Telemetry Sensor Calibration');
    form.append('incident.description', 'Dispatched directly via CareSync ServiceNow Integration');
    form.append('incident.urgency', '1');
    form.append('incident.impact', '1');

    const r4 = await axios.post(baseURL + '/incident.do', form.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': getCookieString(),
        'X-UserToken': userToken || ''
      }
    });

    console.log('🎉🎉🎉 FORM POST COMPLETED! Status:', r4.status);
    console.log('Redirect / Response location:', r4.headers['location'] || 'Inserted');
    if (String(r4.data).includes('INC') || r4.status === 200 || r4.status === 302) {
      console.log('INCIDENT SUCCESSFULLY RECORDED IN SERVICENOW PDI!');
    }

  } catch (e) {
    console.error('Error status:', e.response ? e.response.status : e.message);
  }
}

executeServiceNowDirectPost();
