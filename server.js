const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const TG = require('./telegram');
const cache = require('./memory');

const app = express();
app.use(express.json());

const JWT_SECRET = 'XMN-SUPER-SECRET-KEY'; // hard-coded

// ---------- REST endpoints (same as before) ----------
app.get('/health', (_, res) => res.send('OK'));

// signup
app.post('/api/signup', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing fields' });

  const exists = cache.users.find(u => u.username === username);
  if (exists) return res.status(400).json({ error: 'User exists' });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = { id: Date.now().toString(), username, passwordHash, createdAt: new Date() };
  cache.users.push(user);

  await TG.save('user', user);     // permanent Telegram copy
  await TG.notify(username);       // admin ping

  res.json({ message: 'User created' });
});

// login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = cache.users.find(u => u.username === username);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ userId: user.id, username }, JWT_SECRET, { expiresIn: '7d' });
  cache.sessions.push({ userId: user.id, token, expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 });
  res.json({ token, username });
});

// messages
app.get('/api/messages', (req, res) => res.json(cache.messages.slice(-50)));
app.post('/api/messages', async (req, res) => {
  const msg = { id: Date.now().toString(), username: req.user.username, content: req.body.content, ts: new Date() };
  cache.messages.push(msg);
  await TG.save('msg', msg);
  res.json({ message: 'Sent' });
});

// online users
app.get('/api/users/online', (req, res) => {
  const fiveMin = Date.now() - 5 * 60 * 1000;
  const online = cache.sessions.filter(s => s.expiresAt > fiveMin).length;
  res.json({ count: online });
});

// ---------- webhook entry for Telegram ----------
// Render will call this once after deploy to set webhook
app.get('/set-webhook', async (req, res) => {
  const url = `${req.protocol}://${req.get('host')}/webhook`;
  await TG.api.post('/setWebhook', { url });
  res.send('Webhook set to ' + url);
});

// actual webhook payload (we ignore it, but keeps Render alive)
app.post('/webhook', (req, res) => res.sendStatus(200));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Listening ${PORT}`));
