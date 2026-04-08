const initSqlJs = require('sql.js');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'dormtohome.db');
let db;
let saveTimer = null;

function scheduleSave() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => { saveTimer = null; saveToDisk(); }, 500);
}

function saveToDisk() {
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const data = db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  } catch (e) { console.error('[DB] Save error:', e.message); }
}

async function initDatabase() {
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    console.log('[DB] Loading from', DB_PATH);
    const buf = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buf);
    return;
  }
  console.log('[DB] Creating new database at', DB_PATH);
  db = new SQL.Database();
  createSchema();
  await seedDatabase();
  saveToDisk();
  console.log('[DB] Database initialized and saved');
}

function createSchema() {
  db.run(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, first_name TEXT NOT NULL, last_name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, phone TEXT, password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('passenger','driver')), created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
  db.run(`CREATE TABLE IF NOT EXISTS guardians (id TEXT PRIMARY KEY, passenger_id TEXT NOT NULL, name TEXT NOT NULL, contact TEXT NOT NULL, checkpoint_notifs INTEGER DEFAULT 1, FOREIGN KEY(passenger_id) REFERENCES users(id))`);
  db.run(`CREATE TABLE IF NOT EXISTS routes (id TEXT PRIMARY KEY, route_number TEXT UNIQUE NOT NULL, driver_id TEXT NOT NULL, from_city TEXT NOT NULL, from_zip TEXT, to_city TEXT NOT NULL, to_zip TEXT, departure_date TEXT NOT NULL, departure_time TEXT NOT NULL, arrival_time TEXT NOT NULL, duration TEXT NOT NULL, total_seats INTEGER NOT NULL DEFAULT 44, price_per_seat REAL NOT NULL, package_price REAL DEFAULT 15, status TEXT DEFAULT 'active' CHECK(status IN ('draft','active','in_progress','completed','cancelled')), notes TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(driver_id) REFERENCES users(id))`);
  db.run(`CREATE TABLE IF NOT EXISTS route_stops (id TEXT PRIMARY KEY, route_id TEXT NOT NULL, city TEXT NOT NULL, stop_type TEXT NOT NULL CHECK(stop_type IN ('stop','checkpoint')), order_index INTEGER NOT NULL, scheduled_time TEXT, status TEXT DEFAULT 'upcoming' CHECK(status IN ('upcoming','active','done')), FOREIGN KEY(route_id) REFERENCES routes(id))`);
  db.run(`CREATE TABLE IF NOT EXISTS bookings (id TEXT PRIMARY KEY, route_id TEXT NOT NULL, passenger_id TEXT NOT NULL, seat_number TEXT NOT NULL, checkin_status TEXT DEFAULT 'pending' CHECK(checkin_status IN ('pending','checked','missing')), booking_type TEXT DEFAULT 'seat' CHECK(booking_type IN ('seat','package')), amount_paid REAL NOT NULL, booked_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(route_id) REFERENCES routes(id), FOREIGN KEY(passenger_id) REFERENCES users(id))`);
  db.run(`CREATE TABLE IF NOT EXISTS route_requests (id TEXT PRIMARY KEY, requester_id TEXT NOT NULL, from_city TEXT NOT NULL, to_city TEXT NOT NULL, requested_date TEXT, requested_time TEXT, supporter_count INTEGER DEFAULT 1, status TEXT DEFAULT 'open' CHECK(status IN ('open','fulfilled','declined')), created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(requester_id) REFERENCES users(id))`);
  db.run(`CREATE TABLE IF NOT EXISTS route_request_supports (request_id TEXT NOT NULL, user_id TEXT NOT NULL, PRIMARY KEY(request_id, user_id))`);
  db.run(`CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, route_id TEXT NOT NULL, sender_id TEXT NOT NULL, content TEXT NOT NULL, message_type TEXT DEFAULT 'text' CHECK(message_type IN ('text','system','notification')), sent_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(route_id) REFERENCES routes(id), FOREIGN KEY(sender_id) REFERENCES users(id))`);
  db.run(`CREATE TABLE IF NOT EXISTS notifications (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, title TEXT NOT NULL, body TEXT NOT NULL, type TEXT DEFAULT 'info', is_read INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(user_id) REFERENCES users(id))`);
  db.run(`CREATE TABLE IF NOT EXISTS driver_location (driver_id TEXT PRIMARY KEY, latitude REAL, longitude REAL, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(driver_id) REFERENCES users(id))`);
}

async function seedDatabase() {
  const pw = await bcrypt.hash('password123', 10);
  const users = [
    { id:'u-passenger-1', first:'Alex',   last:'Johnson', email:'alex@tamu.edu',         role:'passenger' },
    { id:'u-passenger-2', first:'Maria',  last:'Garcia',  email:'maria@tamu.edu',        role:'passenger' },
    { id:'u-driver-1',    first:'Marcus', last:'Davis',   email:'marcus@dormtohome.com', role:'driver'    },
    { id:'u-driver-2',    first:'Sandra', last:'Reyes',   email:'sandra@dormtohome.com', role:'driver'    },
  ];
  for (const u of users) db.run(`INSERT INTO users VALUES (?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`,[u.id,u.first,u.last,u.email,'5550000000',pw,u.role]);
  db.run(`INSERT INTO guardians VALUES (?,?,?,?,?)`,[uuidv4(),'u-passenger-1','Linda Johnson','linda@gmail.com',1]);

  const routes = [
    { id:'r-001',num:'DTH-201',driver:'u-driver-1',from:'College Station',fz:'77840',to:'Houston',    tz:'77001',date:'2025-05-10',dep:'08:00 AM',arr:'11:30 AM',dur:'3h 30m',price:28 },
    { id:'r-002',num:'DTH-202',driver:'u-driver-2',from:'College Station',fz:'77840',to:'Austin',     tz:'78701',date:'2025-05-10',dep:'09:00 AM',arr:'12:30 PM',dur:'3h 30m',price:32 },
    { id:'r-003',num:'DTH-203',driver:'u-driver-1',from:'College Station',fz:'77840',to:'Dallas',     tz:'75201',date:'2025-05-11',dep:'07:00 AM',arr:'11:00 AM',dur:'4h 0m', price:35 },
    { id:'r-004',num:'DTH-204',driver:'u-driver-2',from:'Houston',        fz:'77001',to:'College Station',tz:'77840',date:'2025-05-12',dep:'02:00 PM',arr:'05:30 PM',dur:'3h 30m',price:28 },
    { id:'r-005',num:'DTH-205',driver:'u-driver-1',from:'College Station',fz:'77840',to:'San Antonio',tz:'78201',date:'2025-05-13',dep:'10:00 AM',arr:'03:00 PM',dur:'5h 0m', price:42 },
  ];
  for (const r of routes) db.run(`INSERT INTO routes VALUES (?,?,?,?,?,?,?,?,?,?,?,44,?,15,'active',?,CURRENT_TIMESTAMP)`,[r.id,r.num,r.driver,r.from,r.fz,r.to,r.tz,r.date,r.dep,r.arr,r.dur,r.price,null]);

  for (const s of [{city:'Bryan, TX',type:'stop',idx:1,time:'8:20 AM'},{city:'Huntsville, TX',type:'checkpoint',idx:2,time:null},{city:'Conroe, TX',type:'stop',idx:3,time:'10:00 AM'}])
    db.run(`INSERT INTO route_stops VALUES (?,?,?,?,?,?,?)`,[uuidv4(),'r-001',s.city,s.type,s.idx,s.time,'upcoming']);

  db.run(`INSERT INTO bookings VALUES (?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`,[uuidv4(),'r-001','u-passenger-1','3A','checked','seat',28]);
  db.run(`INSERT INTO bookings VALUES (?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`,[uuidv4(),'r-003','u-passenger-1','7C','pending','seat',35]);

  for (const q of [{from:'College Station',to:'Houston',date:'May 15',time:'8:00 AM',count:14},{from:'Houston',to:'College Station',date:'May 17',time:'3:00 PM',count:9},{from:'College Station',to:'Dallas',date:'May 18',time:'7:00 AM',count:22},{from:'College Station',to:'Austin',date:'May 20',time:'9:00 AM',count:7}])
    db.run(`INSERT INTO route_requests VALUES (?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`,[uuidv4(),'u-passenger-2',q.from,q.to,q.date,q.time,q.count,'open']);

  for (const m of [{sender:'u-driver-1',content:'Good morning everyone! Bus is fueled up and ready. We depart at 8:00 AM sharp.'},{sender:'u-passenger-1',content:"Great, I'll be there by 7:50. Is parking available nearby?"},{sender:'u-driver-1',content:'Yes, free 24-hour parking in Lot 15 across the street.'}])
    db.run(`INSERT INTO messages VALUES (?,?,?,?,?,CURRENT_TIMESTAMP)`,[uuidv4(),'r-001',m.sender,m.content,'text']);

  db.run(`INSERT INTO notifications VALUES (?,?,?,?,?,0,CURRENT_TIMESTAMP)`,[uuidv4(),'u-passenger-1','Bus DTH-201 approaching','Your bus is 15 minutes from Houston stop.','alert']);
  db.run(`INSERT INTO notifications VALUES (?,?,?,?,?,0,CURRENT_TIMESTAMP)`,[uuidv4(),'u-passenger-1','Check-in Confirmed','You have been successfully checked in for DTH-201.','success']);
  db.run(`INSERT INTO driver_location VALUES (?,?,?,CURRENT_TIMESTAMP)`,['u-driver-1',30.6280,-96.3344]);
}

function all(sql, params=[]) {
  const stmt = db.prepare(sql); stmt.bind(params);
  const rows = []; while(stmt.step()) rows.push(stmt.getAsObject()); stmt.free(); return rows;
}
function get(sql, params=[]) { return all(sql,params)[0]||null; }
function run(sql, params=[]) { db.run(sql,params); scheduleSave(); }

module.exports = { initDatabase, getDb: ()=>db, all, get, run };
