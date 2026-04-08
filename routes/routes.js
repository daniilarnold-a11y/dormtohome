const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { all, get, run } = require('../db/database');
const { authMiddleware, requireRole } = require('../middleware/auth');

function enrichRoute(r) {
  if (!r) return null;
  const stops = all('SELECT * FROM route_stops WHERE route_id=? ORDER BY order_index', [r.id]);
  const booked = get('SELECT COUNT(*) as cnt FROM bookings WHERE route_id=?', [r.id]);
  const driver = get('SELECT first_name, last_name FROM users WHERE id=?', [r.driver_id]);
  const bookedCount = booked?.cnt || 0;
  return {
    ...r,
    stops,
    booked_seats: bookedCount,
    available_seats: r.total_seats - bookedCount,
    driver_name: driver ? `${driver.first_name} ${driver.last_name}` : 'TBD',
  };
}

// GET /api/routes — list routes with filters
router.get('/', (req, res) => {
  try {
    const { from, to, date, min_seats, route_number } = req.query;
    let sql = 'SELECT * FROM routes WHERE status != ?';
    const params = ['cancelled'];
    if (from)         { sql += ' AND LOWER(from_city) LIKE ?'; params.push(`%${from.toLowerCase()}%`); }
    if (to)           { sql += ' AND LOWER(to_city) LIKE ?';   params.push(`%${to.toLowerCase()}%`);   }
    if (date)         { sql += ' AND departure_date = ?';       params.push(date);                      }
    if (route_number) { sql += ' AND route_number LIKE ?';      params.push(`%${route_number.toUpperCase()}%`); }
    sql += ' ORDER BY departure_date, departure_time';
    let routes = all(sql, params).map(enrichRoute);
    if (min_seats) routes = routes.filter(r => r.available_seats >= parseInt(min_seats));
    res.json(routes);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── SPECIFIC NAMED ROUTES MUST COME BEFORE /:id ──────────

// GET /api/routes/driver/mine — driver's own routes
router.get('/driver/mine', authMiddleware, requireRole('driver'), (req, res) => {
  try {
    const routes = all('SELECT * FROM routes WHERE driver_id=? ORDER BY departure_date DESC', [req.user.id]);
    res.json(routes.map(enrichRoute));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── PARAMETERISED ROUTES BELOW ───────────────────────────

// GET /api/routes/:id
router.get('/:id', (req, res) => {
  try {
    const r = get('SELECT * FROM routes WHERE id=? OR route_number=?', [req.params.id, req.params.id]);
    if (!r) return res.status(404).json({ error: 'Route not found' });
    res.json(enrichRoute(r));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/routes — driver creates route
router.post('/', authMiddleware, requireRole('driver'), (req, res) => {
  try {
    const { from_city, from_zip, to_city, to_zip, departure_date, departure_time,
      arrival_time, duration, total_seats, price_per_seat, package_price, notes, stops } = req.body;
    if (!from_city || !to_city || !departure_date || !departure_time || !price_per_seat)
      return res.status(400).json({ error: 'Missing required fields' });

    const existing = all('SELECT route_number FROM routes ORDER BY created_at DESC LIMIT 1');
    let nextNum = 201;
    if (existing.length) {
      const last = parseInt(existing[0].route_number.replace('DTH-', ''));
      if (!isNaN(last)) nextNum = last + 1;
    }
    const routeNumber = `DTH-${nextNum}`;
    const id = uuidv4();

    run(`INSERT INTO routes (id,route_number,driver_id,from_city,from_zip,to_city,to_zip,departure_date,departure_time,arrival_time,duration,total_seats,price_per_seat,package_price,status,notes)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, routeNumber, req.user.id, from_city, from_zip||'', to_city, to_zip||'',
       departure_date, departure_time, arrival_time||'', duration||'',
       total_seats||44, price_per_seat, package_price||15, 'active', notes||'']);

    if (Array.isArray(stops)) {
      stops.forEach((s, i) => {
        run(`INSERT INTO route_stops (id,route_id,city,stop_type,order_index,scheduled_time,status) VALUES (?,?,?,?,?,?,?)`,
          [uuidv4(), id, s.city, s.type||'stop', i+1, s.time||null, 'upcoming']);
      });
    }
    res.json(enrichRoute(get('SELECT * FROM routes WHERE id=?', [id])));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/routes/:id — update route
router.put('/:id', authMiddleware, requireRole('driver'), (req, res) => {
  try {
    const r = get('SELECT * FROM routes WHERE id=?', [req.params.id]);
    if (!r) return res.status(404).json({ error: 'Not found' });
    if (r.driver_id !== req.user.id) return res.status(403).json({ error: 'Not your route' });
    const { from_city, to_city, departure_date, departure_time, arrival_time, total_seats, price_per_seat, status, notes } = req.body;
    run(`UPDATE routes SET
         from_city=COALESCE(?,from_city), to_city=COALESCE(?,to_city),
         departure_date=COALESCE(?,departure_date), departure_time=COALESCE(?,departure_time),
         arrival_time=COALESCE(?,arrival_time), total_seats=COALESCE(?,total_seats),
         price_per_seat=COALESCE(?,price_per_seat), status=COALESCE(?,status), notes=COALESCE(?,notes)
         WHERE id=?`,
      [from_city, to_city, departure_date, departure_time, arrival_time,
       total_seats, price_per_seat, status, notes, req.params.id]);
    res.json(enrichRoute(get('SELECT * FROM routes WHERE id=?', [req.params.id])));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH /api/routes/:id/stops/:stopId — mark stop done/active
router.patch('/:id/stops/:stopId', authMiddleware, requireRole('driver'), (req, res) => {
  try {
    const { status } = req.body;
    run('UPDATE route_stops SET status=? WHERE id=? AND route_id=?', [status, req.params.stopId, req.params.id]);
    res.json(all('SELECT * FROM route_stops WHERE route_id=? ORDER BY order_index', [req.params.id]));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/routes/:id/manifest — passenger list for check-in
router.get('/:id/manifest', authMiddleware, (req, res) => {
  try {
    const manifest = all(`
      SELECT b.id, b.seat_number, b.checkin_status, b.booking_type,
             u.first_name, u.last_name, u.phone
      FROM bookings b
      JOIN users u ON b.passenger_id = u.id
      WHERE b.route_id = ?
      ORDER BY b.seat_number`, [req.params.id]);
    res.json(manifest);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
