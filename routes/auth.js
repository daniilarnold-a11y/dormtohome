const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { all, get, run } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const trimmedEmail = email.trim();
    if (!emailRegex.test(trimmedEmail))
      return res.status(400).json({ error: 'Invalid email format' });

    if (phone && phone.trim()) {
      const digits = phone.replace(/[\s\-\(\)\+\.]/g, '');
      if (!/^1?\d{10}$/.test(digits))
        return res.status(400).json({ error: 'Invalid phone number — must be 10 digits' });
    }

    if (guardian_email && guardian_email.trim() && !emailRegex.test(guardian_email.trim()))
      return res.status(400).json({ error: 'Invalid guardian email format' });
    if (guardian_phone && guardian_phone.trim()) {
      const gDigits = guardian_phone.replace(/[\s\-\(\)\+\.]/g, '');
      if (!/^1?\d{10}$/.test(gDigits))
        return res.status(400).json({ error: 'Invalid guardian phone number' });
    }

    console.log('[REGISTER] Checking existing user:', trimmedEmail);
    const existingUser = await get('SELECT id FROM users WHERE email = $1', [trimmedEmail]);
    if (existingUser) return res.status(409).json({ error: 'Email already registered' });

    console.log('[REGISTER] Creating user:', trimmedEmail);
    const userId = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);

    await run(
      `INSERT INTO users (id,first_name,last_name,email,phone,password,"role") VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [userId, first_name, last_name, trimmedEmail, phone || '', hashedPassword, role]
    );

    if (role === 'passenger' && (guardian_email || guardian_phone)) {
      await run(`INSERT INTO guardians (id,passenger_id,name,email,phone,checkpoint_notifs) VALUES ($1,$2,$3,$4,$5,$6)`,
        [uuidv4(), userId, guardian_name || 'Guardian', guardian_email || '', guardian_phone || '', checkpoint_notifs ? 1 : 0]);
    }

    console.log('[REGISTER] Success for:', trimmedEmail);
    res.json({ message: 'Registration successful. You can now sign in.' });
  } catch (e) { 
    console.error('[REGISTER] Exception:', e);
    res.status(500).json({ error: e.message }); 
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const trimmedEmail = email.trim();
    const user = await get(
      'SELECT id, first_name, last_name, email, phone, password, "role" FROM users WHERE email = $1',
      [trimmedEmail]
    );

    if (!user) return res.status(401).json({ error: 'Invalid email or password.' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password.' });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, first_name: user.first_name, last_name: user.last_name },
      getSecret(req), { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const profile = await get('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (!profile) return res.status(404).json({ error: 'User not found' });
    const { password, ...safe } = profile;
    res.json(safe);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/me', authMiddleware, async (req, res) => {
  try {
    const { first_name, last_name, phone } = req.body;
    if (!first_name || !last_name) return res.status(400).json({ error: 'Name required' });
    
    await run(
      'UPDATE users SET first_name = $1, last_name = $2, phone = $3 WHERE id = $4',
      [first_name, last_name, phone || '', req.user.id]
    );

    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/logout', async (req, res) => {
  res.json({ success: true });
});

module.exports = router;