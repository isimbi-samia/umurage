const express = require('express');
const bodyParser = require('body-parser');
const webpush = require('web-push');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 4000;
const DATA_DIR = path.join(__dirname, '..', 'data');
const SUB_FILE = path.join(DATA_DIR, 'subscriptions.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(SUB_FILE)) fs.writeFileSync(SUB_FILE, '[]');

const app = express();
app.use(bodyParser.json());

const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY || 'BD7fxgtBIQsrHD-Jt2PLADHwOIWCQnWfp8BW2LLUgCCO3PcNZbng174cTNFdMQsqxFf5nbFJQ0hqLY7-tzY_PIo';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || 'Sy2mZipMTlShe79vw7a-_3vIqqx37vFdSvEPaCyqsOw';

webpush.setVapidDetails(
  'mailto:admin@example.com',
  VAPID_PUBLIC,
  VAPID_PRIVATE
);

function readSubs() {
  try { return JSON.parse(fs.readFileSync(SUB_FILE, 'utf8') || '[]'); } catch (e) { return []; }
}
function writeSubs(s) { fs.writeFileSync(SUB_FILE, JSON.stringify(s, null, 2)); }

app.post('/subscribe', (req, res) => {
  const sub = req.body;
  if (!sub || !sub.endpoint) return res.status(400).send({ error: 'Invalid subscription' });
  const subs = readSubs();
  if (!subs.find(s => s.endpoint === sub.endpoint)) {
    subs.push(sub);
    writeSubs(subs);
  }
  res.send({ ok: true, publicKey: VAPID_PUBLIC });
});

app.post('/send', async (req, res) => {
  const { title = 'Umurage', body = 'Test notification', url = '/' } = req.body || {};
  const payload = JSON.stringify({ title, body, url });
  const subs = readSubs();
  const results = await Promise.all(subs.map(async (s) => {
    try {
      await webpush.sendNotification(s, payload);
      return { endpoint: s.endpoint, status: 'ok' };
    } catch (err) {
      return { endpoint: s.endpoint, status: 'error', error: String(err) };
    }
  }));
  res.send({ results });
});

app.get('/keys', (req, res) => res.send({ publicKey: VAPID_PUBLIC }));

app.listen(PORT, () => console.log(`Push server listening on http://localhost:${PORT}`));
