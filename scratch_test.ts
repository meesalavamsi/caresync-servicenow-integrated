import axios from 'axios';

async function test() {
  const instanceUrl = 'https://dev183600.service-now.com';
  const username = 'admin';
  const password = `XlC5a]MRWD5Arl{}1,seO^vh:JRa5<AT#H^{@j*Jr$=`;

  console.log('Testing admin authentication with Developer Portal password...');
  try {
    const client = axios.create({
      baseURL: instanceUrl + '/api',
      auth: { username, password },
      headers: { Accept: 'application/json' },
      timeout: 15000,
    });
    const res = await client.get('/now/table/sys_user', { params: { sysparm_limit: 1 } });
    console.log('===================================================');
    console.log('🎉 SUCCESS! CONNECTED AND AUTHENTICATED SUCCESSFULLY!');
    console.log('HTTP STATUS:', res.status);
    console.log('SYS_USER RETURNED:', res.data.result ? res.data.result.length : 0);
    console.log('===================================================');
  } catch (err: any) {
    console.error('ERROR:', err.response ? err.response.status + ' ' + JSON.stringify(err.response.data) : err.message);
  }
}

test();
