const fs = require('fs');
const dotenv = fs.readFileSync('.env.local', 'utf8');
const lines = dotenv.split('\n');
let key = '';
for (const line of lines) {
  if (line.startsWith('GEMINI_API_KEY=')) {
    key = line.replace('GEMINI_API_KEY=', '').trim();
  }
}
console.log('Key length:', key.length);
console.log('Key prefix:', key.substring(0, 10));

const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(key);

async function test() {
  const models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash', 'gemini-pro'];
  for (const m of models) {
    try {
      console.log(`Testing model: ${m}...`);
      const model = genAI.getGenerativeModel({ model: m });
      const res = await model.generateContent('ping');
      console.log(`Success on ${m}:`, res.response.text());
      return;
    } catch (err) {
      console.error(`Error on ${m}:`, err.message);
    }
  }
}
test();
