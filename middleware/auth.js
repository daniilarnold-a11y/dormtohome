const jwt = require('jsonwebtoken');

function getSecret(req) {
  // Prefer app-level secret (set from env in server.js), fall back to env direct
  return (req.app && req.app.locals.JWT_SECRET) || process.env.JWT_SECRET || 'dormtohome-secret-change-in-production';
}

function authMiddleware(req, res, next) {
  const header = req.headers['authorization'];
  if (!header) return res.status(401).json({ error: 'No token provided' });
  const token = header.startsWith('Bearer ') ? header.slice(7) : header;
  try {
    req.user = jwt.verify(token, getSecret(req));
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

module.exports = { authMiddleware, requireRole };
