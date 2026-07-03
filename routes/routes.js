const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { all, get, run } = require('../db/database');
const { authMiddleware, requireRole } = require('../middleware/auth');

async function enrichRoute(r) {
  if (!r) return null;
  const stops  = await all('SELECT * FROM route_stops WHERE route_id=$1 ORDER BY order_index', [r.id]);
  const booked = await get('SELECT COUNT(*) as cnt FROM bookings WHERE route_id=$1', [r.id]);
  const driver = await get('SELECT first_name,last_name FROM users WHERE id=$1', [r.driver_id]);
  const bookedCount = parseInt(booked?.cnt || 0);
  return {
    ...r,
    stops,
    booked_seats: bookedCount,
    available_seats: r.total_seats - bookedCount,
    driver_name: driver ? `${driver.first_name} ${driver.last_name}` : 'TBD',
  };
}

// GET /api/routes
router.get('/', async (req, res) => {
  try {
    const { from, to, date, date_from, date_to, min_seats, route_number } = req.query;
    let sql = `SELECT * FROM routes WHERE status != 'cancelled'`;
    const params = [];
    let i = 1;
    if (from)         { sql += ` AND LOWER(from_city) LIKE $${i++}`;   params.push(`%${from.toLowerCase()}%`); }
    if (to)           { sql += ` AND LOWER(to_city) LIKE $${i++}`;     params.push(`%${to.toLowerCase()}%`);   }
    if (date)         { sql += ` AND departure_date = $${i++}`;         params.push(date);                      }
    if (date_from)    { sql += ` AND departure_date >= $${i++}`;        params.push(date_from);                  }
    if (date_to)      { sql += ` AND departure_date <= $${i++}`;        params.push(date_to);                    }
    if (route_number) { sql += ` AND route_number LIKE $${i++}`;        params.push(`%${route_number.toUpperCase()}%`); }
    sql += ' ORDER BY departure_date, departure_time';
    let routes = await all(sql, params);
    console.log(`[ROUTES] RAW SQL returned ${routes.length} row(s) | sql="${sql}" params=${JSON.stringify(params)}`);
    routes.forEach(r => console.log(`[ROUTES]   raw row: id=${r.id} num=${r.route_number} from=${r.from_city} to=${r.to_city} date=${r.departure_date} status=${r.status}`));
    routes = await Promise.all(routes.map(enrichRoute));
    if (min_seats) routes = routes.filter(r => r.available_seats >= parseInt(min_seats));
    console.log(`[ROUTES] Returning ${routes.length} route(s) to client`);
    res.json(routes);
  } catch (e) {
    console.log(`[ROUTES] ERROR: ${e.message}`);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/routes/driver/mine — MUST be before /:id
router.get('/driver/mine', authMiddleware, requireRole('driver'), async (req, res) => {
  try {
    const routes = await all('SELECT * FROM routes WHERE driver_id=$1 ORDER BY departure_date DESC', [req.user.id]);
    res.json(await Promise.all(routes.map(enrichRoute)));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/routes/:id
router.get('/:id', async (req, res) => {
  try {
    const r = await get('SELECT * FROM routes WHERE id=$1 OR route_number=$2', [req.params.id, req.params.id]);
    if (!r) return res.status(404).json({ error: 'Route not found' });
    res.json(await enrichRoute(r));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/routes
router.post('/', authMiddleware, requireRole('driver'), async (req, res) => {
  try {
    const { from_city, from_zip, to_city, to_zip, departure_date, departure_time,
      arrival_time, duration, total_seats, price_per_seat, package_price, notes, stops } = req.body;
    if (!from_city || !to_city || !departure_date || !departure_time || !price_per_seat)
      return res.status(400).json({ error: 'Missing required fields' });

    const existing = await get('SELECT route_number FROM routes ORDER BY created_at DESC LIMIT 1');
    let nextNum = 201;
    if (existing) {
      const last = parseInt(existing.route_number.replace('DTH-', ''));
      if (!isNaN(last)) nextNum = last + 1;
    }
    const id = uuidv4();
    await run(
      `INSERT INTO routes (id,route_number,driver_id,from_city,from_zip,to_city,to_zip,departure_date,departure_time,arrival_time,duration,total_seats,price_per_seat,package_price,status,notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'active',$15)`,
      [id, `DTH-${nextNum}`, req.user.id, from_city, from_zip||'', to_city, to_zip||'',
       departure_date, departure_time, arrival_time||'', duration||'',
       total_seats||44, price_per_seat, package_price||15, notes||'']
    );
    if (Array.isArray(stops)) {
      for (let i = 0; i < stops.length; i++) {
        const s = stops[i];
        await run(`INSERT INTO route_stops (id,route_id,city,"type",order_index,scheduled_time,status) VALUES ($1,$2,$3,$4,$5,$6,'upcoming')`,
          [uuidv4(), id, s.city, s.type||'stop', i+1, s.time||null]);
      }
    }
    res.json(await enrichRoute(await get('SELECT * FROM routes WHERE id=$1', [id])));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/routes/:id
router.put('/:id', authMiddleware, requireRole('driver'), async (req, res) => {
  try {
    const r = await get('SELECT * FROM routes WHERE id=$1', [req.params.id]);
    if (!r) return res.status(404).json({ error: 'Not found' });
    if (r.driver_id !== req.user.id) return res.status(403).json({ error: 'Not your route' });
    const { from_city, to_city, departure_date, departure_time, arrival_time, total_seats, price_per_seat, status, notes } = req.body;
    await run(
      `UPDATE routes SET
       from_city=COALESCE($1,from_city), to_city=COALESCE($2,to_city),
       departure_date=COALESCE($3,departure_date), departure_time=COALESCE($4,departure_time),
       arrival_time=COALESCE($5,arrival_time), total_seats=COALESCE($6,total_seats),
       price_per_seat=COALESCE($7,price_per_seat), status=COALESCE($8,status), notes=COALESCE($9,notes)
       WHERE id=$10`,
      [from_city, to_city, departure_date, departure_time, arrival_time, total_seats, price_per_seat, status, notes, req.params.id]
    );
    res.json(await enrichRoute(await get('SELECT * FROM routes WHERE id=$1', [req.params.id])));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH /api/routes/:id/stops/:stopId
router.patch('/:id/stops/:stopId', authMiddleware, requireRole('driver'), async (req, res) => {
  try {
    const route = await get('SELECT driver_id FROM routes WHERE id=$1', [req.params.id]);
    if (!route) return res.status(404).json({ error: 'Route not found' });
    if (route.driver_id !== req.user.id) return res.status(403).json({ error: 'Not your route' });
    await run('UPDATE route_stops SET status=$1 WHERE id=$2 AND route_id=$3', [req.body.status, req.params.stopId, req.params.id]);
    res.json(await all('SELECT * FROM route_stops WHERE route_id=$1 ORDER BY order_index', [req.params.id]));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/routes/:id/manifest
router.get('/:id/manifest', authMiddleware, async (req, res) => {
  try {
    const manifest = await all(`
      SELECT b.id, b.seat_number, b.checkin_status, b.booking_type,
             u.first_name, u.last_name, u.phone
      FROM bookings b JOIN users u ON b.passenger_id=u.id
      WHERE b.route_id=$1 ORDER BY b.seat_number`, [req.params.id]);
    res.json(manifest);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;