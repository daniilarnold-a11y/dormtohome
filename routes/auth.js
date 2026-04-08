const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { all, get, run } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');
const { sendVerificationEmail } = require('../utils/email');

const getSecret = (req) =>
  (req.app && req.app.locals.JWT_SECRET) ||
  process.env.JWT_SECRET ||
  'dormtohome-secret-change-in-production';

router.post('/register', async (req, res) => {
  try {
    const { first_name, last_name, email, phone, password, role,
            guardian_name, guardian_email, guardian_phone, checkpoint_notifs } = req.body;
    if (!first_name || !last_name || !email || !password || !role)
      return res.status(400).json({ error: 'Missing required fields' });
    if (!['passenger','driver'].includes(role))
      return res.status(400).json({ error: 'Invalid role' });
    if (await get('SELECT id FROM users WHERE email=$1', [email]))
      return res.status(409).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 10);
    const id = uuidv4();
    const verificationToken = uuidv4();
    await run(
      `INSERT INTO users (id,first_name,last_name,email,phone,password_hash,"role",verification_token) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [id, first_name, last_name, email, phone||'', hash, role, verificationToken]
    );
    if (role === 'passenger' && (guardian_email || guardian_phone)) {
      await run(`INSERT INTO guardians (id,passenger_id,name,email,phone,checkpoint_notifs) VALUES ($1,$2,$3,$4,$5,$6)`,
        [uuidv4(), id, guardian_name||'Guardian', guardian_email||'', guardian_phone||'', checkpoint_notifs ? 1 : 0]);
    }
    
    sendVerificationEmail(email, verificationToken).catch(console.error);
    
    res.json({ message: 'Registration successful. Please check your email to verify your account.' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/verify/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const user = await get('SELECT * FROM users WHERE verification_token=$1', [token]);
    if (!user) return res.status(400).json({ error: 'Invalid token' });
    
    await run('UPDATE users SET email_verified=TRUE, verification_token=NULL WHERE id=$1', [user.id]);
    res.redirect('/?verified=true');
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const user = await get('SELECT * FROM users WHERE email=$1', [email]);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (!user.email_verified) return res.status(403).json({ error: 'Please verify your email first. Check your inbox.' });
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, first_name: user.first_name, last_name: user.last_name },
      getSecret(req), { expiresIn: '30d' }
    );
    res.json({ token, user: { id: user.id, first_name: user.first_name, last_name: user.last_name, email: user.email, role: user.role } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await get('SELECT id,first_name,last_name,email,phone,role FROM users WHERE id=$1', [req.user.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/me', authMiddleware, async (req, res) => {
  try {
    const { first_name, last_name, phone } = req.body;
    if (!first_name || !last_name) return res.status(400).json({ error: 'Name required' });
    await run('UPDATE users SET first_name=$1,last_name=$2,phone=$3 WHERE id=$4',
      [first_name, last_name, phone||'', req.user.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;