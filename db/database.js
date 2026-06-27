const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

function generateToken() {
  return 'tk_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
}
module.exports.generateToken = generateToken;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('[DB] FATAL: DATABASE_URL environment variable is not set');
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL && DATABASE_URL.includes('supabase.co')
    ? { rejectUnauthorized: false, require: true }
    : DATABASE_URL
      ? { rejectUnauthorized: false }
      : undefined,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('[DB] Pool error:', err.message);
});

// ─── QUERY HELPERS ───────────────────────────────────────
async function all(sql, params = []) {
  const { rows } = await pool.query(sql, params);
  return rows;
}

async function get(sql, params = []) {
  const { rows } = await pool.query(sql, params);
  return rows[0] || null;
}

async function run(sql, params = []) {
  await pool.query(sql, params);
}

// ─── SCHEMA ──────────────────────────────────────────────
async function createSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      "role" TEXT NOT NULL CHECK("role" IN ('passenger','driver')),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS guardians (
      id TEXT PRIMARY KEY,
      passenger_id TEXT NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      checkpoint_notifs INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS routes (
      id TEXT PRIMARY KEY,
      route_number TEXT UNIQUE NOT NULL,
      driver_id TEXT NOT NULL REFERENCES users(id),
      from_city TEXT NOT NULL,
      from_zip TEXT,
      to_city TEXT NOT NULL,
      to_zip TEXT,
      departure_date TEXT NOT NULL,
      departure_time TEXT NOT NULL,
      arrival_time TEXT NOT NULL,
      duration TEXT NOT NULL,
      total_seats INTEGER NOT NULL DEFAULT 44,
      price_per_seat NUMERIC NOT NULL,
      package_price NUMERIC DEFAULT 15,
      status TEXT DEFAULT 'active' CHECK(status IN ('draft','active','in_progress','completed','cancelled')),
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS route_stops (
      id TEXT PRIMARY KEY,
      route_id TEXT NOT NULL REFERENCES routes(id),
      city TEXT NOT NULL,
      "type" TEXT NOT NULL CHECK("type" IN ('stop','checkpoint')),
      order_index INTEGER NOT NULL,
      scheduled_time TEXT,
      status TEXT DEFAULT 'upcoming' CHECK(status IN ('upcoming','active','done'))
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      route_id TEXT NOT NULL REFERENCES routes(id),
      passenger_id TEXT NOT NULL REFERENCES users(id),
      seat_number TEXT NOT NULL,
      checkin_status TEXT DEFAULT 'pending' CHECK(checkin_status IN ('pending','checked','missing')),
      booking_type TEXT DEFAULT 'seat' CHECK(booking_type IN ('seat','package')),
      amount_paid NUMERIC NOT NULL,
      ticket_token TEXT UNIQUE,
      checked_in INTEGER DEFAULT 0,
      checked_in_at TEXT,
      booked_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS route_requests (
      id TEXT PRIMARY KEY,
      requester_id TEXT NOT NULL REFERENCES users(id),
      from_city TEXT NOT NULL,
      to_city TEXT NOT NULL,
      requested_date TEXT,
      requested_time TEXT,
      supporter_count INTEGER DEFAULT 1,
      status TEXT DEFAULT 'open' CHECK(status IN ('open','fulfilled','declined')),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS route_request_supports (
      request_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      PRIMARY KEY(request_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      route_id TEXT NOT NULL REFERENCES routes(id),
      sender_id TEXT NOT NULL REFERENCES users(id),
      content TEXT NOT NULL,
      message_type TEXT DEFAULT 'text' CHECK(message_type IN ('text','system','notification')),
      sent_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      "type" TEXT DEFAULT 'info',
      is_read INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS driver_location (
      driver_id TEXT PRIMARY KEY REFERENCES users(id),
      latitude NUMERIC,
      longitude NUMERIC,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}

// ─── SEED ────────────────────────────────────────────────
async function seedDatabase() {
  const existing = await get('SELECT id FROM routes WHERE id = $1', ['r-001']);
  if (existing) { console.log('[DB] Already seeded, skipping'); return; }

  console.log('[DB] Seeding demo data...');
  const pw = 'password123';

  const users = [
    { id:'u-passenger-1', first:'Alex',   last:'Johnson', email:'alex@tamu.edu',         role:'passenger' },
    { id:'u-passenger-2', first:'Maria',  last:'Garcia',  email:'maria@tamu.edu',        role:'passenger' },
    { id:'u-driver-1',    first:'Marcus', last:'Davis',   email:'marcus@dormtohome.com', role:'driver'    },
    { id:'u-driver-2',    first:'Sandra', last:'Reyes',   email:'sandra@dormtohome.com', role:'driver'    },
  ];
  for (const u of users) {
    await run(
      `INSERT INTO users (id,first_name,last_name,email,phone,"role") VALUES ($1,$2,$3,$4,$5,$6)`,
      [u.id, u.first, u.last, u.email, '5550000000', u.role]
    );
  }

  await run(`INSERT INTO guardians (id,passenger_id,name,email,phone,checkpoint_notifs) VALUES ($1,$2,$3,$4,$5,$6)`,
    [uuidv4(), 'u-passenger-1', 'Linda Johnson', 'linda@gmail.com', '5551234567', 1]);

  const routes = [
    { id:'r-001',num:'DTH-201',driver:'u-driver-1',from:'College Station',fz:'77840',to:'Houston',    tz:'77001',date:'2025-05-10',dep:'08:00 AM',arr:'11:30 AM',dur:'3h 30m',price:28 },
    { id:'r-002',num:'DTH-202',driver:'u-driver-2',from:'College Station',fz:'77840',to:'Austin',     tz:'78701',date:'2025-05-10',dep:'09:00 AM',arr:'12:30 PM',dur:'3h 30m',price:32 },
    { id:'r-003',num:'DTH-203',driver:'u-driver-1',from:'College Station',fz:'77840',to:'Dallas',     tz:'75201',date:'2025-05-11',dep:'07:00 AM',arr:'11:00 AM',dur:'4h 0m', price:35 },
    { id:'r-004',num:'DTH-204',driver:'u-driver-2',from:'Houston',        fz:'77001',to:'College Station',tz:'77840',date:'2025-05-12',dep:'02:00 PM',arr:'05:30 PM',dur:'3h 30m',price:28 },
    { id:'r-005',num:'DTH-205',driver:'u-driver-1',from:'College Station',fz:'77840',to:'San Antonio',tz:'78201',date:'2025-05-13',dep:'10:00 AM',arr:'03:00 PM',dur:'5h 0m', price:42 },
  ];
  for (const r of routes) {
    await run(
      `INSERT INTO routes (id,route_number,driver_id,from_city,from_zip,to_city,to_zip,departure_date,departure_time,arrival_time,duration,total_seats,price_per_seat,package_price,status,notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,44,$12,15,'active',null)`,
      [r.id,r.num,r.driver,r.from,r.fz,r.to,r.tz,r.date,r.dep,r.arr,r.dur,r.price]
    );
  }

  for (const s of [
    { city:'Bryan, TX',      type:'stop',       idx:1, time:'8:20 AM'  },
    { city:'Huntsville, TX', type:'checkpoint', idx:2, time:null       },
    { city:'Conroe, TX',     type:'stop',       idx:3, time:'10:00 AM' },
  ]) {
    await run(`INSERT INTO route_stops VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [uuidv4(), 'r-001', s.city, s.type, s.idx, s.time, 'upcoming']);
  }

  await run(`INSERT INTO bookings (id,route_id,passenger_id,seat_number,checkin_status,booking_type,amount_paid) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [uuidv4(),'r-001','u-passenger-1','3A','checked','seat',28]);
  await run(`INSERT INTO bookings (id,route_id,passenger_id,seat_number,checkin_status,booking_type,amount_paid) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [uuidv4(),'r-003','u-passenger-1','7C','pending','seat',35]);

  for (const q of [
    { from:'College Station',to:'Houston',         date:'May 15',time:'8:00 AM',count:14 },
    { from:'Houston',        to:'College Station', date:'May 17',time:'3:00 PM',count:9  },
    { from:'College Station',to:'Dallas',          date:'May 18',time:'7:00 AM',count:22 },
    { from:'College Station',to:'Austin',          date:'May 20',time:'9:00 AM',count:7  },
  ]) {
    await run(`INSERT INTO route_requests (id,requester_id,from_city,to_city,requested_date,requested_time,supporter_count,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [uuidv4(),'u-passenger-2',q.from,q.to,q.date,q.time,q.count,'open']);
  }

  for (const m of [
    { sender:'u-driver-1',    content:'Good morning everyone! Bus is fueled up and ready. We depart at 8:00 AM sharp.' },
    { sender:'u-passenger-1', content:"Great, I'll be there by 7:50. Is parking available nearby?" },
    { sender:'u-driver-1',    content:'Yes, free 24-hour parking in Lot 15 across the street.' },
  ]) {
    await run(`INSERT INTO messages (id,route_id,sender_id,content,message_type) VALUES ($1,$2,$3,$4,$5)`,
      [uuidv4(),'r-001',m.sender,m.content,'text']);
  }

  await run(`INSERT INTO notifications (id,user_id,title,body,"type") VALUES ($1,$2,$3,$4,$5)`,
    [uuidv4(),'u-passenger-1','Bus DTH-201 approaching','Your bus is 15 minutes from Houston stop.','alert']);
  await run(`INSERT INTO notifications (id,user_id,title,body,"type") VALUES ($1,$2,$3,$4,$5)`,
    [uuidv4(),'u-passenger-1','Check-in Confirmed','You have been successfully checked in for DTH-201.','success']);

  await run(`INSERT INTO driver_location VALUES ($1,$2,$3,NOW())`,
    ['u-driver-1', 30.6280, -96.3344]);

  console.log('[DB] Seed complete');
}

// ─── INIT ────────────────────────────────────────────────
async function initDatabase() {
  try {
    await createSchema();
    await seedDatabase();
    console.log('[DB] Ready');
  } catch (err) {
    console.error('[DB] initDatabase failed:', err.message);
    if (err.stack) console.error('[DB] Stack:', err.stack.split('\n').slice(0, 4).join('\n'));
    throw err;
  }
}

module.exports = { initDatabase, all, get, run, pool };