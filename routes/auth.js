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

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { first_name, last_name, email, phone, password, role,
            guardian_name, guardian_contact, checkpoint_notifs } = req.body;

    if (!first_name || !last_name || !email || !password || !role)
      return res.status(400).json({ error: 'Missing required fields' });
    if (!['passenger', 'driver'].includes(role))
      return res.status(400).json({ error: 'Invalid role' });
    if (get('SELECT id FROM users WHERE email=?', [email]))
      return res.status(409).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 10);
    const id = uuidv4();
    run(`INSERT INTO users (id,first_name,last_name,email,phone,password_hash,role) VALUES (?,?,?,?,?,?,?)`,
      [id, first_name, last_name, email, phone||'', hash, role]);

    if (role === 'passenger' && guardian_contact) {
      run(`INSERT INTO guardians (id,passenger_id,name,contact,checkpoint_notifs) VALUES (?,?,?,?,?)`,
        [uuidv4(), id, guardian_name||'Guardian', guardian_contact, checkpoint_notifs ? 1 : 0]);
    }

    const token = jwt.sign({ id, email, role, first_name, last_name }, getSecret(req), { expiresIn: '30d' });
    res.json({ token, user: { id, first_name, last_name, email, role } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = get('SELECT * FROM users WHERE email=?', [email]);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, first_name: user.first_name, last_name: user.last_name },
      getSecret(req), { expiresIn: '30d' }
    );
    res.json({ token, user: { id: user.id, first_name: user.first_name, last_name: user.last_name, email: user.email, role: user.role } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  try {
    const user = get('SELECT id,first_name,last_name,email,phone,role FROM users WHERE id=?', [req.user.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/auth/me
router.put('/me', authMiddleware, (req, res) => {
  try {
    const { first_name, last_name, phone } = req.body;
    if (!first_name || !last_name) return res.status(400).json({ error: 'Name required' });
    run('UPDATE users SET first_name=?,last_name=?,phone=? WHERE id=?',
      [first_name, last_name, phone||'', req.user.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
