import axios from 'axios';

async function testAi() {
  const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-pro'];
  const envKey = process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_MAIN || '';

  console.log('Testing Gemini API key availability...');
  console.log('Environment GEMINI_API_KEY set:', Boolean(envKey));

  if (!envKey) {
    console.log('No GEMINI_API_KEY in process.env. Testing API without key...');
  }

  for (const m of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${envKey}`;
      console.log(`Testing model ${m}...`);
      const res = await axios.post(url, {
        contents: [{ parts: [{ text: 'Hello, respond with: "CareSync AI Active"' }] }]
      }, { timeout: 10000 });
      console.log(`🎉 SUCCESS with ${m}!`);
      console.log('Response:', JSON.stringify(res.data.candidates[0].content.parts[0].text));
      break;
    } catch (err: any) {
      console.error(`❌ Model ${m} error:`, err.response?.status, err.response?.data?.error?.message || err.message);
    }
  }
}

testAi();
