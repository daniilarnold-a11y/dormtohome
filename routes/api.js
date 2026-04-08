const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { all, get, run } = require('../db/database');
const { authMiddleware, requireRole } = require('../middleware/auth');

// ===== BOOKINGS =====

// GET /api/bookings/mine
router.get('/bookings/mine', authMiddleware, (req, res) => {
  try {
    const bookings = all(`
      SELECT b.*, r.route_number, r.from_city, r.to_city, r.departure_date,
             r.departure_time, r.arrival_time, r.duration,
             u.first_name || ' ' || u.last_name as driver_name
      FROM bookings b
      JOIN routes r ON b.route_id = r.id
      JOIN users u ON r.driver_id = u.id
      WHERE b.passenger_id = ?
      ORDER BY r.departure_date DESC`, [req.user.id]);
    res.json(bookings);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/bookings
router.post('/bookings', authMiddleware, requireRole('passenger'), (req, res) => {
  try {
    const { route_id, seat_number, booking_type } = req.body;
    if (!route_id || !seat_number) return res.status(400).json({ error: 'Missing fields' });

    const existing = get('SELECT id FROM bookings WHERE route_id=? AND seat_number=?', [route_id, seat_number]);
    if (existing) return res.status(409).json({ error: 'Seat already taken' });

    const alreadyBooked = get('SELECT id FROM bookings WHERE route_id=? AND passenger_id=? AND booking_type=?',
      [route_id, req.user.id, booking_type || 'seat']);
    if (alreadyBooked) return res.status(409).json({ error: 'Already booked on this route' });

    const route = get('SELECT price_per_seat, package_price FROM routes WHERE id=?', [route_id]);
    if (!route) return res.status(404).json({ error: 'Route not found' });

    const amount = booking_type === 'package' ? route.package_price : route.price_per_seat;
    const id = uuidv4();
    run(`INSERT INTO bookings (id,route_id,passenger_id,seat_number,checkin_status,booking_type,amount_paid) VALUES (?,?,?,?,?,?,?)`,
      [id, route_id, req.user.id, seat_number, 'pending', booking_type || 'seat', amount]);

    // Notify passenger
    run(`INSERT INTO notifications (id,user_id,title,body,type) VALUES (?,?,?,?,?)`,
      [uuidv4(), req.user.id, 'Booking Confirmed!',
        `Seat ${seat_number} booked successfully.`, 'success']);

    res.json({ id, seat_number, amount_paid: amount, checkin_status: 'pending' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/bookings/taken/:routeId
router.get('/bookings/taken/:routeId', (req, res) => {
  try {
    const seats = all('SELECT seat_number FROM bookings WHERE route_id=?', [req.params.routeId]);
    res.json(seats.map(s => s.seat_number));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/bookings/:id/checkin - driver checks in a passenger
router.patch('/bookings/:id/checkin', authMiddleware, requireRole('driver'), (req, res) => {
  try {
    run('UPDATE bookings SET checkin_status=? WHERE id=?', ['checked', req.params.id]);
    const booking = get(`SELECT b.*, u.first_name, u.last_name, u.id as uid
      FROM bookings b JOIN users u ON b.passenger_id=u.id WHERE b.id=?`, [req.params.id]);
    // Notify guardian
    const guardians = all('SELECT * FROM guardians WHERE passenger_id=?', [booking.uid]);
    for (const g of guardians) {
      run(`INSERT INTO notifications (id,user_id,title,body,type) VALUES (?,?,?,?,?)`,
        [uuidv4(), booking.uid, 'Checked In', `${booking.first_name} ${booking.last_name} has boarded the bus.`, 'success']);
    }
    res.json({ success: true, booking });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ===== ROUTE REQUESTS =====

// GET /api/requests
router.get('/requests', (req, res) => {
  try {
    const reqs = all(`
      SELECT rr.*, u.first_name || ' ' || u.last_name as requester_name
      FROM route_requests rr
      JOIN users u ON rr.requester_id = u.id
      WHERE rr.status='open'
      ORDER BY rr.supporter_count DESC, rr.created_at DESC`);
    res.json(reqs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/requests
router.post('/requests', authMiddleware, requireRole('passenger'), (req, res) => {
  try {
    const { from_city, to_city, requested_date, requested_time } = req.body;
    if (!from_city || !to_city) return res.status(400).json({ error: 'Missing fields' });
    const id = uuidv4();
    run(`INSERT INTO route_requests (id,requester_id,from_city,to_city,requested_date,requested_time,supporter_count,status) VALUES (?,?,?,?,?,?,1,'open')`,
      [id, req.user.id, from_city, to_city, requested_date || '', requested_time || '']);
    res.json({ id, from_city, to_city, supporter_count: 1 });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/requests/:id/support
router.post('/requests/:id/support', authMiddleware, (req, res) => {
  try {
    const already = get('SELECT 1 FROM route_request_supports WHERE request_id=? AND user_id=?',
      [req.params.id, req.user.id]);
    if (already) return res.status(409).json({ error: 'Already supported' });
    run('INSERT INTO route_request_supports VALUES (?,?)', [req.params.id, req.user.id]);
    run('UPDATE route_requests SET supporter_count=supporter_count+1 WHERE id=?', [req.params.id]);
    const req2 = get('SELECT supporter_count FROM route_requests WHERE id=?', [req.params.id]);
    res.json({ supporter_count: req2.supporter_count });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ===== MESSAGES =====

// GET /api/messages/:routeId
router.get('/messages/:routeId', authMiddleware, (req, res) => {
  try {
    const msgs = all(`
      SELECT m.*, u.first_name || ' ' || u.last_name as sender_name, u.role as sender_role
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.route_id = ?
      ORDER BY m.sent_at ASC`, [req.params.routeId]);
    res.json(msgs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/messages/:routeId
router.post('/messages/:routeId', authMiddleware, (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Empty message' });
    const id = uuidv4();
    run(`INSERT INTO messages (id,route_id,sender_id,content,message_type) VALUES (?,?,?,?,'text')`,
      [id, req.params.routeId, req.user.id, content]);
    const msg = get(`SELECT m.*, u.first_name || ' ' || u.last_name as sender_name, u.role as sender_role
      FROM messages m JOIN users u ON m.sender_id=u.id WHERE m.id=?`, [id]);
    res.json(msg);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ===== NOTIFICATIONS =====

// GET /api/notifications
router.get('/notifications', authMiddleware, (req, res) => {
  try {
    const notifs = all('SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 30', [req.user.id]);
    res.json(notifs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/notifications/read-all
router.patch('/notifications/read-all', authMiddleware, (req, res) => {
  try {
    run('UPDATE notifications SET is_read=1 WHERE user_id=?', [req.user.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ===== GUARDIANS =====

// GET /api/guardians
router.get('/guardians', authMiddleware, requireRole('passenger'), (req, res) => {
  try {
    const gs = all('SELECT * FROM guardians WHERE passenger_id=?', [req.user.id]);
    res.json(gs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/guardians
router.post('/guardians', authMiddleware, requireRole('passenger'), (req, res) => {
  try {
    const { name, contact, checkpoint_notifs } = req.body;
    const id = uuidv4();
    run('INSERT INTO guardians (id,passenger_id,name,contact,checkpoint_notifs) VALUES (?,?,?,?,?)',
      [id, req.user.id, name, contact, checkpoint_notifs ? 1 : 0]);
    res.json({ id, name, contact, checkpoint_notifs });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/guardians/:id
router.delete('/guardians/:id', authMiddleware, requireRole('passenger'), (req, res) => {
  try {
    run('DELETE FROM guardians WHERE id=? AND passenger_id=?', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/guardians/:id
router.patch('/guardians/:id', authMiddleware, requireRole('passenger'), (req, res) => {
  try {
    const { name, contact, checkpoint_notifs } = req.body;
    run('UPDATE guardians SET name=COALESCE(?,name), contact=COALESCE(?,contact), checkpoint_notifs=COALESCE(?,checkpoint_notifs) WHERE id=? AND passenger_id=?',
      [name, contact, checkpoint_notifs != null ? (checkpoint_notifs ? 1 : 0) : null, req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ===== DRIVER ANALYTICS =====
router.get('/analytics/driver', authMiddleware, requireRole('driver'), (req, res) => {
  try {
    const totalRoutes = get('SELECT COUNT(*) as cnt FROM routes WHERE driver_id=?', [req.user.id]);
    const totalPassengers = get(`SELECT COUNT(*) as cnt FROM bookings b
      JOIN routes r ON b.route_id=r.id WHERE r.driver_id=?`, [req.user.id]);
    const revenue = get(`SELECT COALESCE(SUM(b.amount_paid),0) as total FROM bookings b
      JOIN routes r ON b.route_id=r.id WHERE r.driver_id=?`, [req.user.id]);
    const upcomingRoutes = all(`SELECT * FROM routes WHERE driver_id=? AND status='active'
      ORDER BY departure_date LIMIT 5`, [req.user.id]);
    res.json({
      total_routes: totalRoutes.cnt,
      total_passengers: totalPassengers.cnt,
      total_revenue: revenue.total,
      upcoming_routes: upcomingRoutes,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ===== DRIVER LOCATION =====
router.patch('/location', authMiddleware, requireRole('driver'), (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    run(`INSERT OR REPLACE INTO driver_location (driver_id,latitude,longitude,updated_at) VALUES (?,?,?,CURRENT_TIMESTAMP)`,
      [req.user.id, latitude, longitude]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/location/:driverId', (req, res) => {
  try {
    const loc = get('SELECT * FROM driver_location WHERE driver_id=?', [req.params.driverId]);
    res.json(loc || { latitude: 30.6280, longitude: -96.3344 });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ===== DRIVER SEND NOTIFICATION =====
router.post('/driver-notification', authMiddleware, requireRole('driver'), (req, res) => {
  try {
    const { route_id, message } = req.body;
    // Get all passengers on this route
    const passengers = all(`SELECT DISTINCT b.passenger_id FROM bookings b WHERE b.route_id=?`, [route_id]);
    for (const p of passengers) {
      run(`INSERT INTO notifications (id,user_id,title,body,type) VALUES (?,?,?,?,?)`,
        [uuidv4(), p.passenger_id, 'Driver Update', message, 'alert']);
    }
    // Post as system message too
    run(`INSERT INTO messages (id,route_id,sender_id,content,message_type) VALUES (?,?,?,?,'notification')`,
      [uuidv4(), route_id, req.user.id, `📢 ${message}`]);
    res.json({ success: true, notified: passengers.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
