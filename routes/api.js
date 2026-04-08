const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { all, get, run } = require('../db/database');
const { authMiddleware, requireRole } = require('../middleware/auth');

// ── BOOKINGS ──────────────────────────────────────────────

router.get('/bookings/mine', authMiddleware, async (req, res) => {
  try {
    const bookings = await all(`
      SELECT b.*, r.route_number, r.from_city, r.to_city, r.departure_date,
             r.departure_time, r.arrival_time, r.duration,
             u.first_name || ' ' || u.last_name as driver_name
      FROM bookings b
      JOIN routes r ON b.route_id=r.id
      JOIN users u ON r.driver_id=u.id
      WHERE b.passenger_id=$1
      ORDER BY r.departure_date DESC`, [req.user.id]);
    res.json(bookings);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/bookings/taken/:routeId', async (req, res) => {
  try {
    const seats = await all('SELECT seat_number FROM bookings WHERE route_id=$1', [req.params.routeId]);
    res.json(seats.map(s => s.seat_number));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/bookings', authMiddleware, requireRole('passenger'), async (req, res) => {
  try {
    const { route_id, seat_number, booking_type } = req.body;
    if (!route_id || !seat_number) return res.status(400).json({ error: 'Missing fields' });

    if (await get('SELECT id FROM bookings WHERE route_id=$1 AND seat_number=$2', [route_id, seat_number]))
      return res.status(409).json({ error: 'Seat already taken' });

    const route = await get('SELECT price_per_seat, package_price FROM routes WHERE id=$1', [route_id]);
    if (!route) return res.status(404).json({ error: 'Route not found' });

    const amount = booking_type === 'package' ? route.package_price : route.price_per_seat;
    const id = uuidv4();
    await run(
      `INSERT INTO bookings (id,route_id,passenger_id,seat_number,checkin_status,booking_type,amount_paid) VALUES ($1,$2,$3,$4,'pending',$5,$6)`,
      [id, route_id, req.user.id, seat_number, booking_type||'seat', amount]
    );
    await run(`INSERT INTO notifications (id,user_id,title,body,"type") VALUES ($1,$2,$3,$4,$5)`,
      [uuidv4(), req.user.id, 'Booking Confirmed!', `Seat ${seat_number} booked successfully.`, 'success']);
    res.json({ id, seat_number, amount_paid: amount, checkin_status: 'pending' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/bookings/:id/checkin', authMiddleware, requireRole('driver'), async (req, res) => {
  try {
    await run('UPDATE bookings SET checkin_status=$1 WHERE id=$2', ['checked', req.params.id]);
    const booking = await get(`SELECT b.*, u.first_name, u.last_name, u.id as uid
      FROM bookings b JOIN users u ON b.passenger_id=u.id WHERE b.id=$1`, [req.params.id]);
    await run(`INSERT INTO notifications (id,user_id,title,body,"type") VALUES ($1,$2,$3,$4,$5)`,
      [uuidv4(), booking.uid, 'Checked In', `${booking.first_name} ${booking.last_name} has boarded.`, 'success']);
    res.json({ success: true, booking });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── REQUESTS ──────────────────────────────────────────────

router.get('/requests', async (req, res) => {
  try {
    const reqs = await all(`
      SELECT rr.*, u.first_name || ' ' || u.last_name as requester_name
      FROM route_requests rr JOIN users u ON rr.requester_id=u.id
      WHERE rr.status='open'
      ORDER BY rr.supporter_count DESC, rr.created_at DESC`);
    res.json(reqs);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/requests', authMiddleware, requireRole('passenger'), async (req, res) => {
  try {
    const { from_city, to_city, requested_date, requested_time } = req.body;
    if (!from_city || !to_city) return res.status(400).json({ error: 'Missing fields' });
    const id = uuidv4();
    await run(
      `INSERT INTO route_requests (id,requester_id,from_city,to_city,requested_date,requested_time,supporter_count,status) VALUES ($1,$2,$3,$4,$5,$6,1,'open')`,
      [id, req.user.id, from_city, to_city, requested_date||'', requested_time||'']
    );
    res.json({ id, from_city, to_city, supporter_count: 1 });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/requests/:id/support', authMiddleware, async (req, res) => {
  try {
    if (await get('SELECT 1 FROM route_request_supports WHERE request_id=$1 AND user_id=$2', [req.params.id, req.user.id]))
      return res.status(409).json({ error: 'Already supported' });
    await run('INSERT INTO route_request_supports VALUES ($1,$2)', [req.params.id, req.user.id]);
    await run('UPDATE route_requests SET supporter_count=supporter_count+1 WHERE id=$1', [req.params.id]);
    const r = await get('SELECT supporter_count FROM route_requests WHERE id=$1', [req.params.id]);
    res.json({ supporter_count: r.supporter_count });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── MESSAGES ──────────────────────────────────────────────

router.get('/messages/:routeId', authMiddleware, async (req, res) => {
  try {
    const msgs = await all(`
      SELECT m.*, u.first_name || ' ' || u.last_name as sender_name, u."role" as sender_role
      FROM messages m JOIN users u ON m.sender_id=u.id
      WHERE m.route_id=$1 ORDER BY m.sent_at ASC`, [req.params.routeId]);
    res.json(msgs);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/messages/:routeId', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Empty message' });
    const id = uuidv4();
    await run(`INSERT INTO messages (id,route_id,sender_id,content,message_type) VALUES ($1,$2,$3,$4,'text')`,
      [id, req.params.routeId, req.user.id, content]);
    const msg = await get(`SELECT m.*, u.first_name || ' ' || u.last_name as sender_name, u."role" as sender_role
      FROM messages m JOIN users u ON m.sender_id=u.id WHERE m.id=$1`, [id]);
    res.json(msg);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── NOTIFICATIONS ─────────────────────────────────────────

router.get('/notifications', authMiddleware, async (req, res) => {
  try {
    const notifs = await all('SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 30', [req.user.id]);
    res.json(notifs);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/notifications/read-all', authMiddleware, async (req, res) => {
  try {
    await run('UPDATE notifications SET is_read=1 WHERE user_id=$1', [req.user.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── GUARDIANS ─────────────────────────────────────────────

router.get('/guardians', authMiddleware, requireRole('passenger'), async (req, res) => {
  try {
    res.json(await all('SELECT * FROM guardians WHERE passenger_id=$1', [req.user.id]));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/guardians', authMiddleware, requireRole('passenger'), async (req, res) => {
  try {
    const { name, email, phone, checkpoint_notifs } = req.body;
    const id = uuidv4();
    await run('INSERT INTO guardians (id,passenger_id,name,email,phone,checkpoint_notifs) VALUES ($1,$2,$3,$4,$5,$6)',
      [id, req.user.id, name, email||'', phone||'', checkpoint_notifs ? 1 : 0]);
    res.json({ id, name, email, phone, checkpoint_notifs });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/guardians/:id', authMiddleware, requireRole('passenger'), async (req, res) => {
  try {
    await run('DELETE FROM guardians WHERE id=$1 AND passenger_id=$2', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/guardians/:id', authMiddleware, requireRole('passenger'), async (req, res) => {
  try {
    const { name, email, phone, checkpoint_notifs } = req.body;
    await run(
      `UPDATE guardians SET
       name=COALESCE($1,name), email=COALESCE($2,email), phone=COALESCE($3,phone),
       checkpoint_notifs=COALESCE($4,checkpoint_notifs)
       WHERE id=$5 AND passenger_id=$6`,
      [name, email, phone, checkpoint_notifs != null ? (checkpoint_notifs ? 1 : 0) : null, req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── DRIVER ANALYTICS ──────────────────────────────────────

router.get('/analytics/driver', authMiddleware, requireRole('driver'), async (req, res) => {
  try {
    const totalRoutes    = await get('SELECT COUNT(*) as cnt FROM routes WHERE driver_id=$1', [req.user.id]);
    const totalPassengers= await get('SELECT COUNT(*) as cnt FROM bookings b JOIN routes r ON b.route_id=r.id WHERE r.driver_id=$1', [req.user.id]);
    const revenue        = await get('SELECT COALESCE(SUM(b.amount_paid),0) as total FROM bookings b JOIN routes r ON b.route_id=r.id WHERE r.driver_id=$1', [req.user.id]);
    const upcomingRoutes = await all(`SELECT * FROM routes WHERE driver_id=$1 AND status='active' ORDER BY departure_date LIMIT 5`, [req.user.id]);
    res.json({ total_routes: parseInt(totalRoutes.cnt), total_passengers: parseInt(totalPassengers.cnt), total_revenue: parseFloat(revenue.total), upcoming_routes: upcomingRoutes });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── LOCATION ──────────────────────────────────────────────

router.patch('/location', authMiddleware, requireRole('driver'), async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    await run(
      `INSERT INTO driver_location (driver_id,latitude,longitude,updated_at) VALUES ($1,$2,$3,NOW())
       ON CONFLICT (driver_id) DO UPDATE SET latitude=EXCLUDED.latitude, longitude=EXCLUDED.longitude, updated_at=NOW()`,
      [req.user.id, latitude, longitude]
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/location/:driverId', async (req, res) => {
  try {
    const loc = await get('SELECT * FROM driver_location WHERE driver_id=$1', [req.params.driverId]);
    res.json(loc || { latitude: 30.6280, longitude: -96.3344 });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── DRIVER NOTIFICATION ───────────────────────────────────

router.post('/driver-notification', authMiddleware, requireRole('driver'), async (req, res) => {
  try {
    const { route_id, message } = req.body;
    const passengers = await all(`SELECT DISTINCT b.passenger_id FROM bookings b WHERE b.route_id=$1`, [route_id]);
    for (const p of passengers) {
      await run(`INSERT INTO notifications (id,user_id,title,body,"type") VALUES ($1,$2,$3,$4,$5)`,
        [uuidv4(), p.passenger_id, 'Driver Update', message, 'alert']);
    }
    await run(`INSERT INTO messages (id,route_id,sender_id,content,message_type) VALUES ($1,$2,$3,$4,'notification')`,
      [uuidv4(), route_id, req.user.id, `📢 ${message}`]);
    res.json({ success: true, notified: passengers.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;