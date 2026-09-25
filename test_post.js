const axios = require('axios');

async function executeServiceNowDirectPost() {
  const baseURL = 'https://dev183600.service-now.com';
  const instanceUser = 'admin';
  const instancePass = 'Mv@05/11/2005';

  console.log('--- STARTING SERVICENOW AUTOMATED INTEGRATION POST ---');

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

    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Cookie': getCookieString()
    };
    if (userToken) headers['X-UserToken'] = userToken;

    const r4 = await axios.post(baseURL + '/api/now/table/incident', {
      short_description: 'CareSync Automated Live Incident - ICU Telemetry Waveform Alert',
      description: 'Patient telemetry alert generated directly via CareSync ServiceNow Integration.',
      category: 'inpatient_care',
      urgency: '1',
      impact: '1',
      comments: 'Directly posted via CareSync Automation.'
    }, { headers });

    console.log('\n🎉🎉🎉 DIRECT POST SUCCESSFUL!');
    console.log('HTTP Status:', r4.status);
    console.log('New Incident Number :', r4.data.result.number);
    console.log('New Incident Sys ID :', r4.data.result.sys_id);
    console.log('Short Description   :', r4.data.result.short_description);
    console.log('State               :', r4.data.result.state);
    return r4.data.result;

  } catch (e) {
    console.error('Error status:', e.response ? e.response.status : e.message);
    if (e.response && e.response.data) {
      console.error('Response data:', JSON.stringify(e.response.data));
    }
  }
}

executeServiceNowDirectPost();
