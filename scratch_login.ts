import axios from 'axios';

async function test() {
  const instanceUrl = 'https://dev183600.service-now.com';
  const username = 'admin';
  const tempPass = `XlC5a]MRWD5Arl{}1,seO^vh:JRa5<AT#H^{@j*Jr$=`;

  console.log('Testing /login.do with Developer Portal password...');
  try {
    const client = axios.create({
      baseURL: instanceUrl,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      maxRedirects: 5,
    });

    const body = new URLSearchParams({
      user_name: username,
      user_password: tempPass,
      sys_action: 'sysverb_login',
    }).toString();

    const res = await client.post('/login.do', body);
    console.log('Login POST Status:', res.status);
    console.log('Set-Cookie headers:', res.headers['set-cookie']);
  } catch (err: any) {
    console.error('ERROR:', err.message);
  }
}

test();
