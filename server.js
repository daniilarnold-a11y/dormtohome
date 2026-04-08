require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const { initDatabase, all, get, run } = require('./db/database');
const { v4: uuidv4 } = require('uuid');

const JWT_SECRET = process.env.JWT_SECRET || 'dormtohome-secret-change-in-production';
if (process.env.NODE_ENV === 'production' && JWT_SECRET === 'dormtohome-secret-change-in-production') {
  console.warn('\n⚠️  WARNING: Using default JWT_SECRET. Set JWT_SECRET environment variable in production!\n');
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Expose JWT_SECRET to routes via app.locals
app.locals.JWT_SECRET = JWT_SECRET;

app.use('/api/auth', require('./routes/auth'));
app.use('/api/routes', require('./routes/routes'));
app.use('/api', require('./routes/api'));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// ─── SOCKET.IO ────────────────────────────────────────────
const connectedUsers = new Map();

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('No token'));
  try { socket.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { next(new Error('Invalid token')); }
});

io.on('connection', (socket) => {
  const user = socket.user;
  connectedUsers.set(socket.id, { userId: user.id, role: user.role });

  socket.on('join_route_room',  (routeId) => socket.join(`route:${routeId}`));
  socket.on('leave_route_room', (routeId) => socket.leave(`route:${routeId}`));

  socket.on('send_message', ({ routeId, content }) => {
    if (!routeId || !content) return;
    try {
      const id = uuidv4();
      run(`INSERT INTO messages (id,route_id,sender_id,content,message_type) VALUES ($1,$2,$3,$4,'text')`, [id, routeId, user.id, content]);
      const msg = get(`SELECT m.*, u.first_name||' '||u.last_name as sender_name, u."role" as sender_role FROM messages m JOIN users u ON m.sender_id=u.id WHERE m.id=$1`, [id]);
      io.to(`route:${routeId}`).emit('new_message', msg);
    } catch (e) { console.error('[socket] send_message:', e.message); }
  });

  socket.on('driver_location_update', ({ latitude, longitude, routeId }) => {
    if (user.role !== 'driver') return;
    try {
      run(`INSERT INTO driver_location (driver_id,latitude,longitude,updated_at) VALUES ($1,$2,$3,CURRENT_TIMESTAMP)
          ON CONFLICT (driver_id) DO UPDATE SET latitude=$2, longitude=$3, updated_at=CURRENT_TIMESTAMP`, [user.id, latitude, longitude]);
      if (routeId) io.to(`route:${routeId}`).emit('bus_location', { driverId: user.id, latitude, longitude });
    } catch (e) { console.error('[socket] location:', e.message); }
  });

  socket.on('checkin_passenger', ({ bookingId, routeId }) => {
    if (user.role !== 'driver') return;
    try {
      run('UPDATE bookings SET checkin_status=$1 WHERE id=$2', ['checked', bookingId]);
      const booking = get(`SELECT b.*, u.first_name, u.last_name, u.id as uid FROM bookings b JOIN users u ON b.passenger_id=u.id WHERE b.id=?`, [bookingId]);
      run(`INSERT INTO notifications (id,user_id,title,body,"type") VALUES ($1,$2,$3,$4,$5)`, [uuidv4(), booking.uid, 'Checked In', 'You have been checked in. Have a great ride!', 'success']);
      io.to(`route:${routeId}`).emit('passenger_checked_in', { bookingId, passengerName: `${booking.first_name} ${booking.last_name}`, seat: booking.seat_number });
      for (const [sid, info] of connectedUsers.entries()) {
        if (info.userId === booking.uid) io.to(sid).emit('new_notification', { title: 'Checked In', body: 'You have been checked in!' });
      }
    } catch (e) { console.error('[socket] checkin:', e.message); }
  });

  socket.on('driver_broadcast', ({ routeId, message }) => {
    if (user.role !== 'driver') return;
    try {
      const passengers = all(`SELECT DISTINCT b.passenger_id FROM bookings b WHERE b.route_id=?`, [routeId]);
      for (const p of passengers) {
        run(`INSERT INTO notifications (id,user_id,title,body,"type") VALUES ($1,$2,$3,$4,$5)`, [uuidv4(), p.passenger_id, 'Driver Update', message, 'alert']);
        for (const [sid, info] of connectedUsers.entries()) {
          if (info.userId === p.passenger_id) io.to(sid).emit('new_notification', { title: 'Driver Update', body: message });
        }
      }
      const id = uuidv4();
      run(`INSERT INTO messages (id,route_id,sender_id,content,message_type) VALUES ($1,$2,$3,$4,'notification')`, [id, routeId, user.id, `📢 ${message}`]);
      const msg = get(`SELECT m.*, u.first_name||' '||u.last_name as sender_name, u."role" as sender_role FROM messages m JOIN users u ON m.sender_id=u.id WHERE m.id=$1`, [id]);
      io.to(`route:${routeId}`).emit('new_message', msg);
    } catch (e) { console.error('[socket] broadcast:', e.message); }
  });

  socket.on('stop_completed', ({ routeId, stopId }) => {
    if (user.role !== 'driver') return;
    try {
      run('UPDATE route_stops SET status=$1 WHERE id=$2', ['done', stopId]);
      const stops = all('SELECT * FROM route_stops WHERE route_id=$1 ORDER BY order_index', [routeId]);
      const doneIdx = stops.findIndex(s => s.id === stopId);
      if (doneIdx >= 0 && stops[doneIdx + 1]) run('UPDATE route_stops SET status=$1 WHERE id=$2', ['active', stops[doneIdx + 1].id]);
      io.to(`route:${routeId}`).emit('route_progress', { stops: all('SELECT * FROM route_stops WHERE route_id=$1 ORDER BY order_index', [routeId]) });
      const stop = stops.find(s => s.id === stopId);
      if (stop?.type === 'checkpoint') {
        const passengers = all(`SELECT DISTINCT b.passenger_id FROM bookings b WHERE b.route_id=$1`, [routeId]);
        for (const p of passengers) {
          run(`INSERT INTO notifications (id,user_id,title,body,"type") VALUES ($1,$2,$3,$4,$5)`, [uuidv4(), p.passenger_id, `Checkpoint: ${stop.city}`, `Your bus has passed through ${stop.city}.`, 'info']);
          for (const [sid, info] of connectedUsers.entries()) {
            if (info.userId === p.passenger_id) io.to(sid).emit('new_notification', { title: 'Checkpoint', body: `Bus passed through ${stop.city}` });
          }
        }
      }
    } catch (e) { console.error('[socket] stop_completed:', e.message); }
  });

  socket.on('disconnect', () => connectedUsers.delete(socket.id));
});

// ─── GRACEFUL SHUTDOWN ────────────────────────────────────
function shutdown(signal) {
  console.log(`\n[${signal}] Shutting down gracefully...`);
  const { saveToDisk } = require('./db/database');
  if (saveToDisk) saveToDisk();
  server.close(() => { console.log('Server closed'); process.exit(0); });
  setTimeout(() => process.exit(1), 5000);
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

// ─── START ────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
initDatabase().then(() => {
  server.listen(PORT, () => {
    console.log(`\n🚌  DormToHome running on http://localhost:${PORT}`);
    console.log(`    ENV: ${process.env.NODE_ENV || 'development'}`);
    console.log(`    Demo accounts (password: password123)`);
    console.log(`    Passenger → alex@tamu.edu`);
    console.log(`    Driver    → marcus@dormtohome.com\n`);
  });
}).catch(err => { console.error('Failed to start:', err); process.exit(1); });
