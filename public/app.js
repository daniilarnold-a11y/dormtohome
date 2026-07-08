// ============================================================
//  DormToHome — Frontend Application
// ============================================================

// ─── ICON HELPERS ────────────────────────────────────────
const ICON = {
  pin: () => '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  calendar: () => '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  clock: () => '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  seat: () => '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 19v2M17 19v2M4 15h16M6 11V7a2 2 0 012-2h8a2 2 0 012 2v4"/></svg>',
  driver: () => '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="7" r="4"/><path d="M3 20v-2a7 7 0 0114 0v2"/></svg>',
  bus: () => '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 6v6M16 6v6M2 12h20M5 6l1-4h12l1 4M5 18h14M8 18v2M16 18v2"/></svg>',
  note: () => '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
  lightbulb: () => '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18h6M10 22h4M12 2a7 7 0 014 12.7V17h-8v-2.3A7 7 0 0112 2z"/></svg>',
  check: () => '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>',
  info: () => '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
  timer: () => '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="13" r="8"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="9" y1="2" x2="15" y2="2"/></svg>',
  megaphone: () => '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11l18-5v12L3 13v-2z"/><path d="M11.6 16.8a3 3 0 11-5.8-1.6"/></svg>',
  people: () => '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>',
};

// ─── STATE ────────────────────────────────────────────────
const S = {
  token: null,
  user: null,
  socket: null,
  currentRoute: null,
  selectedSeat: null,
  pTab: 'routes',
  dTab: 'dashboard',
  createStep: 1,
  reqStep: 1,
  reqData: {},
  createData: { stops: [], checkpoints: [] },
  chatRoute: null,
  myRoutes: [],
  myBookings: [],
  allRoutes: [],
  requests: [],
  manifest: [],
  locationInterval: null,
  busAnimInterval: null,
};

// ─── GLOBAL CLICK DISPATCHER ───────────────────────────────
document.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const action = el.dataset.action;
  if (el.dataset.close) closeModal(el.dataset.close);
  if (action === 'switch-chat') {
    switchChatRoom(el.dataset.rid, el.dataset.num, el.dataset.from, el.dataset.to, el);
  } else if (action === 'accept-req') {
    acceptRequest(el.dataset.from, el.dataset.to, el.dataset.date, el.dataset.time);
  } else if (action === 'open-route-detail') {
    openRouteDetail(el.dataset.rid);
  } else if (action === 'start-booking') {
    startBooking(el.dataset.rid);
  } else if (action === 'support-req') {
    supportRequest(el.dataset.rid);
  }
});

// ─── CITIES ───────────────────────────────────────────────
const CITIES = [
  {n:'College Station',s:'TX',z:'77840'},{n:'College Station',s:'TX',z:'77841'},
  {n:'Houston',s:'TX',z:'77001'},{n:'Houston Heights',s:'TX',z:'77008'},
  {n:'Austin',s:'TX',z:'78701'},{n:'Dallas',s:'TX',z:'75201'},
  {n:'San Antonio',s:'TX',z:'78201'},{n:'Lubbock',s:'TX',z:'79401'},
  {n:'Waco',s:'TX',z:'76701'},{n:'Bryan',s:'TX',z:'77801'},
  {n:'Round Rock',s:'TX',z:'78664'},{n:'Plano',s:'TX',z:'75023'},
  {n:'Fort Worth',s:'TX',z:'76101'},{n:'The Woodlands',s:'TX',z:'77380'},
  {n:'Sugar Land',s:'TX',z:'77478'},{n:'Conroe',s:'TX',z:'77301'},
  {n:'Huntsville',s:'TX',z:'77340'},{n:'Temple',s:'TX',z:'76501'},
  {n:'Killeen',s:'TX',z:'76541'},{n:'Galveston',s:'TX',z:'77550'},
  {n:'Corpus Christi',s:'TX',z:'78401'},{n:'San Marcos',s:'TX',z:'78666'},
  {n:'Denton',s:'TX',z:'76201'},{n:'Pearland',s:'TX',z:'77581'},
  {n:'Pflugerville',s:'TX',z:'78660'},{n:'Georgetown',s:'TX',z:'78626'},
  {n:'Allen',s:'TX',z:'75002'},{n:'Arlington',s:'TX',z:'76010'},
  {n:'Bedford',s:'TX',z:'76021'},{n:'Carrollton',s:'TX',z:'75006'},
  {n:'Cedar Hill',s:'TX',z:'75104'},{n:'Coppell',s:'TX',z:'75019'},
  {n:'Euless',s:'TX',z:'76039'},{n:'Flower Mound',s:'TX',z:'75028'},
  {n:'Frisco',s:'TX',z:'75034'},{n:'Garland',s:'TX',z:'75040'},
  {n:'Grand Prairie',s:'TX',z:'75050'},{n:'Grapevine',s:'TX',z:'76051'},
  {n:'Irving',s:'TX',z:'75038'},{n:'Lewisville',s:'TX',z:'75067'},
  {n:'McKinney',s:'TX',z:'75069'},{n:'Mesquite',s:'TX',z:'75149'},
  {n:'Richardson',s:'TX',z:'75080'},{n:'Rockwall',s:'TX',z:'75087'},
  {n:'Rowlett',s:'TX',z:'75088'},
];

// ─── CITY COORDINATES ──────────────────────────────────────
const CITY_COORDS = {
  'College Station': { lat: 30.6280, lng: -96.3344 },
  'Houston': { lat: 29.7604, lng: -95.3698 },
  'Houston Heights': { lat: 29.7900, lng: -95.4000 },
  'Austin': { lat: 30.2672, lng: -97.7431 },
  'Dallas': { lat: 32.7767, lng: -96.7970 },
  'San Antonio': { lat: 29.4241, lng: -98.4936 },
  'Lubbock': { lat: 33.5779, lng: -101.8552 },
  'Waco': { lat: 31.5493, lng: -97.1467 },
  'Bryan': { lat: 30.6744, lng: -96.3700 },
  'Round Rock': { lat: 30.5083, lng: -97.6789 },
  'Plano': { lat: 33.0198, lng: -96.6989 },
  'Fort Worth': { lat: 32.7555, lng: -97.3308 },
  'The Woodlands': { lat: 30.1583, lng: -95.4892 },
  'Sugar Land': { lat: 29.6192, lng: -95.6349 },
  'Conroe': { lat: 30.3119, lng: -95.4561 },
  'Huntsville': { lat: 30.7235, lng: -95.5508 },
  'Temple': { lat: 31.0982, lng: -97.3428 },
  'Killeen': { lat: 31.1171, lng: -97.7278 },
  'Galveston': { lat: 29.3013, lng: -94.7977 },
  'Corpus Christi': { lat: 27.8006, lng: -97.3964 },
  'San Marcos': { lat: 29.8825, lng: -97.9401 },
  'Denton': { lat: 33.2148, lng: -97.1331 },
  'Pearland': { lat: 29.5636, lng: -95.2860 },
  'Pflugerville': { lat: 30.4394, lng: -97.6200 },
  'Georgetown': { lat: 30.6327, lng: -97.6772 },
  'Allen': { lat: 33.1032, lng: -96.6706 },
  'Arlington': { lat: 32.7357, lng: -97.1081 },
  'Bedford': { lat: 32.8440, lng: -97.1431 },
  'Carrollton': { lat: 32.9756, lng: -96.8898 },
  'Cedar Hill': { lat: 32.5885, lng: -96.9561 },
  'Coppell': { lat: 32.9546, lng: -97.0150 },
  'Euless': { lat: 32.8371, lng: -97.0819 },
  'Flower Mound': { lat: 33.0146, lng: -97.0970 },
  'Frisco': { lat: 33.1507, lng: -96.8236 },
  'Garland': { lat: 32.9126, lng: -96.6389 },
  'Grand Prairie': { lat: 32.7460, lng: -97.0028 },
  'Grapevine': { lat: 32.9343, lng: -97.0781 },
  'Irving': { lat: 32.8140, lng: -96.9489 },
  'Lewisville': { lat: 33.0462, lng: -96.9942 },
  'McKinney': { lat: 33.1976, lng: -96.6153 },
  'Mesquite': { lat: 32.7668, lng: -96.5992 },
  'Richardson': { lat: 32.9482, lng: -96.7293 },
  'Rockwall': { lat: 32.9312, lng: -96.4593 },
  'Rowlett': { lat: 32.9029, lng: -96.5639 },
};

function stripCityState(v) {
  return (v || '').replace(/, ?[A-Za-z]{2}$/, '').trim();
}

function isValidCity(v) {
  const name = stripCityState(v);
  if (!name) return false;
  return CITIES.some(c => c.n.toLowerCase() === name.toLowerCase());
}

function estimateTravelTime(fromCity, toCity) {
  const from = stripCityState(fromCity);
  const to = stripCityState(toCity);
  const fc = CITY_COORDS[from];
  const tc = CITY_COORDS[to];
  if (!fc || !tc) return { text: '3h 30m', minutes: 210 };
  const R = 3959;
  const dLat = (tc.lat - fc.lat) * Math.PI / 180;
  const dLng = (tc.lng - fc.lng) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(fc.lat * Math.PI / 180) * Math.cos(tc.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const dist = R * c * 1.3;
  const totalMin = Math.round(dist / 65 * 60);
  if (totalMin < 10) return { text: '0h 10m', minutes: 10 };
  if (totalMin > 720) return { text: '12h 0m', minutes: 720 };
  const hh = Math.floor(totalMin / 60);
  const mm = totalMin % 60;
  return { text: `${hh}h ${mm}m`, minutes: totalMin };
}

// ─── API ───────────────────────────────────────────────────
async function api(method, path, body, auth = true) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (auth && S.token) opts.headers['Authorization'] = `Bearer ${S.token}`;
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`/api${path}`, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// ─── SOCKET ───────────────────────────────────────────────
function connectSocket() {
  if (S.socket) S.socket.disconnect();
  S.socket = io({ auth: { token: S.token } });
  S.socket.on('new_message', msg => {
    appendChatMsg(msg);
    if (document.getElementById('d-msg-dot')) document.getElementById('d-msg-dot').style.display = 'block';
    if (document.getElementById('msg-dot')) document.getElementById('msg-dot').style.display = 'block';
  });
  S.socket.on('new_notification', data => {
    toast(data.body, 'info');
    loadNotifDot();
  });
  S.socket.on('passenger_checked_in', data => {
    updateCheckinRow(data.bookingId, data.passengerName, data.seat);
  });
  S.socket.on('route_progress', data => {
    renderStopsLive(data.stops);
  });
  S.socket.on('bus_location', data => {
    updateBusMarker(data.latitude, data.longitude);
  });
}

// ─── AUTH ─────────────────────────────────────────────────
let loginType = 'passenger', regType = 'passenger';
function setLoginType(t) {
  loginType = t;
  document.getElementById('lt-passenger').classList.toggle('selected', t === 'passenger');
  document.getElementById('lt-driver').classList.toggle('selected', t === 'driver');
}
function setRegType(t) {
  regType = t;
  document.getElementById('rt-passenger').classList.toggle('selected', t === 'passenger');
  document.getElementById('rt-driver').classList.toggle('selected', t === 'driver');
  document.getElementById('guardian-reg-section').style.display = t === 'passenger' ? '' : 'none';
}

async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass = document.getElementById('login-pass').value;
  if (!email || !pass) { toast('Enter email and password', 'error'); return; }
  if (!isValidEmail(email)) { toast('Please enter a valid email address', 'error'); return; }
  const btn = document.getElementById('login-btn');
  btn.innerHTML = '<span class="spinner"></span>';
  btn.disabled = true;
  try {
    const data = await api('POST', '/auth/login', { email, password: pass }, false);
    S.token = data.token;
    S.user = data.user;
    localStorage.setItem('dth_token', S.token);
    connectSocket();
    if (S.user?.role === 'passenger') {
      setAvatarInitials('p-avatar', S.user);
      showScreen('screen-passenger');
      pTab('routes');
    } else {
      setAvatarInitials('d-avatar', S.user);
      showScreen('screen-driver');
      dTab('dashboard');
    }
    toast(`Welcome back, ${S.user?.first_name || ''}!`, 'success');
  } catch (e) { toast(e.message, 'error'); }
  btn.innerHTML = 'Sign In'; btn.disabled = false;
}

function isValidEmail(email) {
  if (!email || email.trim() === '') return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isValidPhone(phone) {
  if (!phone || phone.trim() === '') return true;
  const digits = phone.replace(/[\s\-\(\)\+\.]/g, '');
  return (digits.length === 10 && /^\d{10}$/.test(digits)) ||
         (digits.length === 11 && /^1\d{10}$/.test(digits));
}

async function doRegister() {
  const first = document.getElementById('reg-first').value.trim();
  const last = document.getElementById('reg-last').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const phone = document.getElementById('reg-phone').value.trim();
  const pass = document.getElementById('reg-pass').value;
  if (!first || !last || !email || !pass) { toast('Fill in all required fields', 'error'); return; }
  if (!isValidEmail(email)) { toast('Please enter a valid email address', 'error'); return; }
  if (!isValidPhone(phone)) { toast('Please enter a valid 10-digit phone number', 'error'); return; }

  const gEmail = document.getElementById('reg-g-email')?.value;
  const gPhone = document.getElementById('reg-g-phone')?.value;
  if (gEmail && !isValidEmail(gEmail)) { toast('Guardian email is not valid', 'error'); return; }
  if (gPhone && !isValidPhone(gPhone)) { toast('Guardian phone number is not valid', 'error'); return; }

  const btn = document.getElementById('reg-btn');
  btn.innerHTML = '<span class="spinner"></span>'; btn.disabled = true;
  try {
    const body = {
      first_name: first, last_name: last, email, phone, password: pass, role: regType,
      guardian_name: document.getElementById('reg-g-name')?.value,
      guardian_email: gEmail,
      guardian_phone: gPhone,
      checkpoint_notifs: document.getElementById('chk-cp')?.classList.contains('checked'),
    };
    const data = await api('POST', '/auth/register', body, false);
    toast(data.message || 'Registration successful! You can now sign in.', 'success');
    showScreen('screen-login');
  } catch (e) { toast(e.message, 'error'); }
  btn.innerHTML = 'Create Account'; btn.disabled = false;
}

function logout() {
  if (!confirm('Sign out?')) return;
  localStorage.removeItem('dth_token');
  S.token = null; S.user = null;
  if (S.socket) S.socket.disconnect();
  if (S.locationInterval) { clearInterval(S.locationInterval); S.locationInterval = null; }
  if (S.busAnimInterval) { clearInterval(S.busAnimInterval); S.busAnimInterval = null; }
  showScreen('screen-landing');
  toast('Signed out');
}

function setAvatarInitials(id, user) {
  const el = document.getElementById(id);
  if (el) el.textContent = (user.first_name[0] + user.last_name[0]).toUpperCase();
}

// ─── SCREEN ROUTING ───────────────────────────────────────
function fmtDate(d) {
  if (!d) return '';
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ─── PASSENGER TABS ───────────────────────────────────────
function pTab(tab) {
  S.pTab = tab;
  if (S.busAnimInterval) { clearInterval(S.busAnimInterval); S.busAnimInterval = null; }
  document.querySelectorAll('#screen-passenger .nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.tab === tab);
  });
  const c = document.getElementById('p-content');
  c.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;padding:60px"><div class="spinner" style="border-top-color:var(--gold)"></div></div>`;
  if (tab === 'routes') renderPassengerRoutes();
  else if (tab === 'active') renderActiveTrips();
  else if (tab === 'tickets') renderTickets();
  else if (tab === 'messages') renderPassengerMessages();
  else if (tab === 'account') renderPassengerAccount();
}

// ─── DRIVER TABS ───────────────────────────────────────────
function dTab(tab) {
  S.dTab = tab;
  if (S.busAnimInterval) { clearInterval(S.busAnimInterval); S.busAnimInterval = null; }
  if (S.activeRouteId) { S.activeRouteId = null; }
  document.querySelectorAll('#screen-driver .nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.tab === tab);
  });
  const c = document.getElementById('d-content');
  c.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;padding:60px"><div class="spinner" style="border-top-color:var(--gold)"></div></div>`;
  if (tab === 'dashboard') renderDriverDashboard();
  else if (tab === 'routes') renderDriverRoutes();
  else if (tab === 'create') renderCreateRoute();
  else if (tab === 'checkin') renderCheckin();
  else if (tab === 'requested') renderRequested();
  else if (tab === 'messages') renderDriverMessages();
  else if (tab === 'live') renderDriverLive();
}

// ─── PASSENGER: ROUTES ────────────────────────────────────
async function renderPassengerRoutes() {
  try {
    const from = sessionStorage.getItem('landFrom');
    const to = sessionStorage.getItem('landTo');
    const date = sessionStorage.getItem('landDate');
    sessionStorage.removeItem('landFrom');
    sessionStorage.removeItem('landTo');
    sessionStorage.removeItem('landDate');
    
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (date) params.set('date', date);
    
    const query = params.toString();
    const routes = await api('GET', `/routes${query ? '?' + query : ''}`, null, false);
    S.allRoutes = routes;
    const reqs = await api('GET', '/requests');
    S.requests = reqs;
    document.getElementById('p-content').innerHTML = buildRoutesPage(routes, reqs);
  } catch (e) { toast(e.message, 'error'); }
}

function buildRoutesPage(routes, reqs) {
  return `
  <div class="page-header">
    <div><div class="page-title">Available Routes</div><div class="page-sub">Find and book your next ride home</div></div>
  </div>
  <div class="tabs">
    <div class="tab active" onclick="switchTab(this,'tab-available','tab-requested')">Available Routes</div>
    <div class="tab" onclick="switchTab(this,'tab-requested','tab-available')">Route Requests</div>
  </div>
  <div class="tab-pane active" id="tab-available">
    <div class="filter-bar">
      <span class="filter-label">Filter:</span>
      <div class="filter-chip" onclick="openFilterPanel('departure')">${ICON.pin()} Departure</div>
      <div class="filter-chip" onclick="openFilterPanel('arrival')">${ICON.pin()} Arrival</div>
      <div class="filter-chip" onclick="openFilterPanel('date')">${ICON.calendar()} Date</div>
      <div class="filter-chip" onclick="openFilterPanel('time')">${ICON.clock()} Time of Day</div>
      <div class="filter-chip" onclick="openFilterPanel('seats')">${ICON.seat()} Min Seats</div>
      <input style="background:var(--gray-100);border:1px solid var(--gray-200);border-radius:8px;padding:6px 12px;font-size:.8rem;color:var(--navy-dark);outline:none;width:200px" placeholder="Search route # (DTH-201)" oninput="filterRouteNum(this.value)">
    </div>
    <div class="routes-grid" id="routes-list">${routes.map(r => { try { return buildRouteCard(r); } catch (e) { console.error('buildRouteCard error:', e, r); return ''; } }).join('') || emptyState('No routes found')}</div>
  </div>
  <div class="tab-pane" id="tab-requested">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px">
      <div class="filter-bar" style="flex:1;margin-bottom:0">
        <span class="filter-label">Sort:</span>
        <div class="filter-chip active">Most Supported</div>
        <div class="filter-chip" onclick="openFilterPanel('departure')">${ICON.pin()} Departure</div>
        <div class="filter-chip" onclick="openFilterPanel('arrival')">${ICON.pin()} Arrival</div>
        <div class="filter-chip" onclick="openFilterPanel('date')">${ICON.calendar()} Date</div>
        <div class="filter-chip" onclick="openFilterPanel('time')">${ICON.clock()} Time of Day</div>
        <div class="filter-chip" id="clear-req-filters-btn" onclick="clearRequestFilters()" style="background:var(--error);color:white;border-color:var(--error);display:none">✕ Clear</div>
      </div>
      <button class="btn btn-gold" onclick="openRequestWizard()">+ Request Route</button>
    </div>
    <div style="background:rgba(201,150,42,.07);border:1px solid rgba(201,150,42,.2);border-radius:10px;padding:12px 16px;font-size:.82rem;color:var(--gray-600);margin-bottom:16px">
      ${ICON.lightbulb()} Can't find your route? <span style="color:var(--gold);font-weight:600;cursor:pointer" onclick="openRequestWizard()">Post a request →</span>
    </div>
    <div style="display:flex;flex-direction:column;gap:10px" id="req-list">${reqs.map(buildReqCard).join('') || emptyState('No requests yet')}</div>
  </div>
  <!-- FILTER PANEL OVERLAY -->
  <div id="filter-panel-overlay" style="display:none;position:fixed;inset:0;z-index:200;background:rgba(0,0,0,.3)" onclick="closeFilterPanel()">
    <div style="position:absolute;top:80px;left:50%;transform:translateX(-50%);background:white;border-radius:16px;padding:28px;width:460px;max-height:80vh;overflow-y:auto;box-shadow:0 12px 48px rgba(0,0,0,.2)" onclick="event.stopPropagation()">
      <div style="font-family:'Playfair Display',serif;font-size:1.1rem;font-weight:700;color:var(--navy);margin-bottom:16px" id="fp-title">Filter</div>
      <div id="fp-body"></div>
      <div style="display:flex;gap:10px;margin-top:20px">
        <button class="btn btn-gold btn-full" onclick="applyFilterPanel()">Apply</button>
        <button class="btn" style="background:var(--gray-100);color:var(--navy);border:1px solid var(--gray-200)" onclick="closeFilterPanel()">Cancel</button>
      </div>
    </div>
  </div>`;
}

function buildRouteCard(r) {
  const pct = Math.round(((r.total_seats - r.available_seats) / r.total_seats) * 100);
  return `<div class="route-card" data-rid="${r.id}" data-action="open-route-detail">
    <div style="flex:1">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
        <span class="city-name">${String(r.from_city)}</span>
        <span class="route-arrow" style="font-size:1.1rem">→</span>
        <span class="city-name">${String(r.to_city)}</span>
        <span class="route-num">${String(r.route_number)}</span>
      </div>
      <div class="route-meta">
        <span class="route-meta-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>${fmtDate(r.departure_date)}</span>
        <span class="route-meta-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>${String(r.departure_time)} – ${String(r.arrival_time)}</span>
        <span class="route-meta-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>${String(r.duration)}</span>
        <span class="route-meta-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="7" r="4"/><path d="M3 20v-2a7 7 0 0114 0v2"/></svg>${String(r.available_seats)} seats left</span>
        <span class="route-meta-item">${ICON.driver()} ${r.driver_name}</span>
      </div>
      <div style="margin-top:10px">
        <div style="display:flex;justify-content:space-between;font-size:.7rem;color:var(--gray-400);margin-bottom:3px"><span>Capacity</span><span>${pct}% full</span></div>
        <div class="progress-bar" style="max-width:240px"><div class="progress-fill" style="width:${pct}%"></div></div>
      </div>
    </div>
    <div style="text-align:right;flex-shrink:0">
      <div class="route-price">$${String(r.price_per_seat)}</div>
      <div class="route-seats">per seat</div>
      <div style="margin-top:10px;display:flex;flex-direction:column;gap:6px">
        <button class="btn btn-gold btn-sm" data-rid="${r.id}" data-action="start-booking">Book Seat</button>
      </div>
    </div>
  </div>`;
}

function buildReqCard(r) {
  return `<div class="req-card" id="req-${r.id}">
    <div>
      <div style="font-weight:600;color:var(--navy);margin-bottom:3px">${String(r.from_city)} → ${String(r.to_city)}</div>
      <div class="text-sm text-muted">${r.requested_date ? new Date(r.requested_date + 'T00:00').toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) : 'Flexible'}</div>
      <div class="text-xs text-muted" style="margin-top:2px">${ICON.clock()} Departs: ${r.requested_time || 'Any'}</div>
    </div>
    <div style="text-align:center">
      <div style="font-family:'Playfair Display',serif;font-size:1.3rem;font-weight:700;color:var(--navy)" id="rcount-${r.id}">${r.supporter_count}</div>
      <div class="text-xs text-muted">interested</div>
    </div>
    ${S.user && r.requester_id === S.user.id
      ? `<button class="btn btn-sm" style="background:var(--gray-200);color:var(--gray-500);cursor:default" disabled>Your Request</button>`
      : r.supported_by_me
        ? `<button class="btn btn-success btn-sm" disabled>✓ Supported</button>`
        : `<button class="btn btn-outline-gold btn-sm" id="rbtn-${r.id}" data-rid="${r.id}" data-action="support-req">Support Route</button>`}
  </div>`;
}

async function supportRequest(id) {
  try {
    const res = await api('POST', `/requests/${id}/support`);
    document.getElementById(`rcount-${id}`).textContent = res.supporter_count;
    const btn = document.getElementById(`rbtn-${id}`);
    btn.textContent = '✓ Supported'; btn.className = 'btn btn-success btn-sm'; btn.disabled = true;
    openModal('modal-req-ok');
  } catch (e) { toast(e.message, 'error'); }
}

function filterRouteNum(val) {
  const list = document.getElementById('routes-list');
  if (!list) return;
  list.querySelectorAll('.route-card').forEach(c => {
    c.style.display = (!val || c.innerHTML.toUpperCase().includes(val.toUpperCase())) ? '' : 'none';
  });
}

// ─── FILTER PANEL ────────────────────────────────────────
let activeFilter = null;
let savedFilters = {
  departures: [],
  arrivals: [],
  dateFrom: '',
  dateTo: '',
  time: [],
  seats: '',
};
const TIMES = ['5–7 AM','7–9 AM','9–11 AM','11 AM–1 PM','1–3 PM','3–5 PM','5–7 PM','7–9 PM'];

function openFilterPanel(type) {
  activeFilter = type;
  const titles = { departure: 'Filter by Departure City', arrival: 'Filter by Arrival City', date: 'Filter by Date Range', time: 'Filter by Departure Time of Day', seats: 'Minimum Seats' };
  document.getElementById('fp-title').textContent = titles[type];
  let html = '';
  if (type === 'departure' || type === 'arrival') {
    const savedCities = type === 'departure' ? savedFilters.departures : savedFilters.arrivals;
    html = `<input style="width:100%;background:var(--gray-100);border:1px solid var(--gray-200);border-radius:8px;padding:10px 14px;font-size:.9rem;outline:none;color:var(--navy-dark)" placeholder="Search city..." oninput="fpCitySearch(this,'fp-cities')">
    <div id="fp-cities" style="border:1px solid var(--gray-200);border-radius:8px;margin-top:6px;max-height:200px;overflow-y:auto"></div>
    <div id="fp-selected" style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">
      ${savedCities.map(c => `<div class="filter-chip active" data-city="${c}">${c} <span onclick="this.parentElement.remove()" style="cursor:pointer;margin-left:4px">✕</span></div>`).join('')}
    </div>`;
  } else if (type === 'date') {
    html = `<p style="font-size:.8rem;color:var(--gray-400);margin-bottom:10px">Shows routes departing within this date range.</p>
    <div class="two-col"><div><div class="form-label" style="color:var(--navy);font-size:.75rem;font-weight:600;letter-spacing:.05em;text-transform:uppercase;margin-bottom:6px">From</div><input type="date" style="width:100%;background:var(--gray-100);border:1px solid var(--gray-200);border-radius:8px;padding:10px;font-size:.9rem;color:var(--navy-dark)" id="fp-date-from" value="${savedFilters.dateFrom}"></div>
    <div><div class="form-label" style="color:var(--navy);font-size:.75rem;font-weight:600;letter-spacing:.05em;text-transform:uppercase;margin-bottom:6px">To</div><input type="date" style="width:100%;background:var(--gray-100);border:1px solid var(--gray-200);border-radius:8px;padding:10px;font-size:.9rem;color:var(--navy-dark)" id="fp-date-to" value="${savedFilters.dateTo}"></div></div>`;
  } else if (type === 'time') {
    html = `<p style="font-size:.82rem;color:var(--gray-400);margin-bottom:10px">Filter by departure time of day:</p><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">${TIMES.map(t => {
      const isActive = savedFilters.time.includes(t);
      return `<div style="padding:8px 6px;text-align:center;border:1px solid ${isActive ? 'var(--gold)' : 'var(--gray-200)'};border-radius:8px;font-size:.78rem;cursor:pointer;transition:var(--transition);background:${isActive ? 'var(--gold)' : 'var(--white)'};color:var(--navy-dark)" class="${isActive ? 'active' : ''}" onclick="this.classList.toggle('active');this.style.background=this.classList.contains('active')?'var(--gold)':'var(--white)';this.style.borderColor=this.classList.contains('active')?'var(--gold)':'var(--gray-200)';">${t}</div>`;
    }).join('')}</div>`;
  } else if (type === 'seats') {
    html = `<input type="number" min="1" max="44" placeholder="e.g. 4" style="width:100%;background:var(--gray-100);border:1px solid var(--gray-200);border-radius:8px;padding:10px 14px;font-size:.9rem;color:var(--navy-dark)" id="fp-seats" value="${savedFilters.seats}">`;
  }
  document.getElementById('fp-body').innerHTML = html;
  document.getElementById('filter-panel-overlay').style.display = 'block';
}

function fpCitySearch(input, rid) {
  const q = input.value.toLowerCase();
  const el = document.getElementById(rid);
  if (!q) { el.innerHTML = ''; return; }
  const matches = CITIES.filter(c => c.n.toLowerCase().includes(q)).slice(0, 8);
  el.innerHTML = matches.map(c => `<div class="city-item" onclick="fpAddCity('${c.n}, ${c.s}',this.parentElement.previousElementSibling,'fp-selected')"><span>${c.n}, ${c.s}</span><span class="city-zip">${c.z}</span></div>`).join('');
}

function fpAddCity(name, input, selId) {
  const sel = document.getElementById(selId);
  if (!sel) return;
  if (sel.querySelector(`[data-city="${name}"]`)) return;
  input.value = ''; document.getElementById('fp-cities').innerHTML = '';
  const chip = document.createElement('div');
  chip.className = 'filter-chip active'; chip.dataset.city = name;
  chip.innerHTML = `${name} <span onclick="this.parentElement.remove()" style="cursor:pointer;margin-left:4px">✕</span>`;
  sel.appendChild(chip);
}

async function applyFilterPanel() {
  if (activeFilter === 'departure') {
    const chips = document.querySelectorAll('#fp-selected .filter-chip.active');
    savedFilters.departures = Array.from(chips).map(c => c.dataset.city?.split(',')[0]?.trim()).filter(Boolean);
  }
  if (activeFilter === 'arrival') {
    const chips = document.querySelectorAll('#fp-selected .filter-chip.active');
    savedFilters.arrivals = Array.from(chips).map(c => c.dataset.city?.split(',')[0]?.trim()).filter(Boolean);
  }
  if (activeFilter === 'date') {
    savedFilters.dateFrom = document.getElementById('fp-date-from')?.value || '';
    savedFilters.dateTo = document.getElementById('fp-date-to')?.value || '';
  }
  if (activeFilter === 'time') {
    savedFilters.time = [];
    document.querySelectorAll('#fp-body .active').forEach(el => {
      savedFilters.time.push(el.textContent.trim());
    });
  }
  if (activeFilter === 'seats') {
    savedFilters.seats = document.getElementById('fp-seats')?.value || '';
  }

  closeFilterPanel();

  const reqTabActive = document.getElementById('tab-requested')?.classList.contains('active');
  if (reqTabActive) {
    applyRequestFilters();
    return;
  }

  const params = new URLSearchParams();
  if (savedFilters.dateFrom) params.set('date_from', savedFilters.dateFrom);
  if (savedFilters.dateTo) params.set('date_to', savedFilters.dateTo);
  if (savedFilters.seats) params.set('min_seats', savedFilters.seats);

  try {
    let routes = await api('GET', `/routes?${params.toString()}`, null, false);

    if (savedFilters.departures.length > 0) {
      routes = routes.filter(r => savedFilters.departures.some(city => r.from_city.toLowerCase().includes(city.toLowerCase())));
    }
    if (savedFilters.arrivals.length > 0) {
      routes = routes.filter(r => savedFilters.arrivals.some(city => r.to_city.toLowerCase().includes(city.toLowerCase())));
    }

    if (savedFilters.time.length > 0) {
      routes = routes.filter(r => {
        if (!r.departure_time) return false;
        const hour = parseInt(r.departure_time.split(':')[0]);
        return savedFilters.time.some(t => {
          if (t.includes('5–7 AM'))  return hour >= 5 && hour < 7;
          if (t.includes('7–9 AM'))  return hour >= 7 && hour < 9;
          if (t.includes('9–11 AM')) return hour >= 9 && hour < 11;
          if (t.includes('11 AM–1 PM')) return hour >= 11 && hour < 13;
          if (t.includes('1–3 PM'))  return hour >= 13 && hour < 15;
          if (t.includes('3–5 PM'))  return hour >= 15 && hour < 17;
          if (t.includes('5–7 PM'))  return hour >= 17 && hour < 19;
          if (t.includes('7–9 PM'))  return hour >= 19 && hour < 21;
          return false;
        });
      });
    }

    const list = document.getElementById('routes-list');
    if (list) list.innerHTML = (routes.map(r => { try { return buildRouteCard(r); } catch (e) { console.error('buildRouteCard error:', e, r); return ''; } }).join('') || emptyState('No routes match your filter'));
    toast('Filter applied', 'success');

    updateClearFilterBtn();
  } catch (e) { console.error('applyFilterPanel error:', e); toast(e.message || 'Filter error', 'error'); }
}

function updateClearFilterBtn() {
  let existing = document.getElementById('clear-filters-btn');
  const hasFilters = savedFilters.departures.length || savedFilters.arrivals.length || savedFilters.dateFrom ||
                     savedFilters.dateTo || savedFilters.time.length || savedFilters.seats;
  if (hasFilters && !existing) {
    const bar = document.querySelector('#tab-available .filter-bar');
    if (bar) {
      const btn = document.createElement('div');
      btn.id = 'clear-filters-btn';
      btn.className = 'filter-chip';
      btn.style.cssText = 'background:var(--error);color:white;border-color:var(--error);cursor:pointer';
      btn.textContent = '✕ Clear All';
      btn.onclick = clearAllFilters;
      bar.appendChild(btn);
    }
  } else if (!hasFilters && existing) {
    existing.remove();
  }
}

async function clearAllFilters() {
  savedFilters = { departures:[], arrivals:[], dateFrom:'', dateTo:'', time:[], seats:'' };
  const btn = document.getElementById('clear-filters-btn');
  if (btn) btn.remove();
  try {
    const routes = await api('GET', '/routes', null, false);
    const list = document.getElementById('routes-list');
    if (list) list.innerHTML = (routes.map(r => { try { return buildRouteCard(r); } catch (e) { console.error('buildRouteCard error:', e, r); return ''; } }).join('') || emptyState('No routes found'));
    toast('Filters cleared', 'success');
  } catch (e) { console.error('clearFilters error:', e); toast(e.message || 'Clear error', 'error'); }
}

function applyRequestFilters() {
  const reqList = document.getElementById('req-list');
  if (!reqList || !S.requests) return;

  let filtered = S.requests;

  if (savedFilters.departures.length > 0) {
    filtered = filtered.filter(r => savedFilters.departures.some(city => r.from_city.toLowerCase().includes(city.toLowerCase())));
  }
  if (savedFilters.arrivals.length > 0) {
    filtered = filtered.filter(r => savedFilters.arrivals.some(city => r.to_city.toLowerCase().includes(city.toLowerCase())));
  }
  if (savedFilters.dateFrom) {
    filtered = filtered.filter(r => r.requested_date >= savedFilters.dateFrom);
  }
  if (savedFilters.dateTo) {
    filtered = filtered.filter(r => r.requested_date <= savedFilters.dateTo);
  }
  if (savedFilters.time.length > 0) {
    filtered = filtered.filter(r => {
      if (!r.requested_time) return false;
      const hour = parseInt(r.requested_time.split(':')[0]);
      return savedFilters.time.some(t => {
        if (t.includes('5–7 AM'))  return hour >= 5 && hour < 7;
        if (t.includes('7–9 AM'))  return hour >= 7 && hour < 9;
        if (t.includes('9–11 AM')) return hour >= 9 && hour < 11;
        if (t.includes('11 AM–1 PM')) return hour >= 11 && hour < 13;
        if (t.includes('1–3 PM'))  return hour >= 13 && hour < 15;
        if (t.includes('3–5 PM'))  return hour >= 15 && hour < 17;
        if (t.includes('5–7 PM'))  return hour >= 17 && hour < 19;
        if (t.includes('7–9 PM'))  return hour >= 19 && hour < 21;
        return false;
      });
    });
  }

  reqList.innerHTML = filtered.map(buildReqCard).join('') || emptyState('No requests match your filter');
  toast('Filter applied', 'success');
  updateClearFilterBtn();
  const clearBtn = document.getElementById('clear-req-filters-btn');
  if (clearBtn) clearBtn.style.display = '';
}

function clearRequestFilters() {
  savedFilters.departures = [];
  savedFilters.arrivals = [];
  savedFilters.dateFrom = '';
  savedFilters.dateTo = '';
  savedFilters.time = [];
  savedFilters.seats = '';
  const reqList = document.getElementById('req-list');
  if (reqList && S.requests) {
    reqList.innerHTML = S.requests.map(buildReqCard).join('') || emptyState('No requests yet');
  }
  const clearBtn = document.getElementById('clear-req-filters-btn');
  if (clearBtn) clearBtn.style.display = 'none';
  toast('Filters cleared', 'success');
}

function closeFilterPanel() {
  document.getElementById('filter-panel-overlay').style.display = 'none';
}

// ─── ROUTE DETAIL ─────────────────────────────────────────
async function openRouteDetail(id) {
  try {
    const r = await api('GET', `/routes/${id}`, null, false);
    S.currentRoute = r;
    document.getElementById('modal-route-title').textContent = `${String(r.route_number)}: ${String(r.from_city)} → ${String(r.to_city)}`;
    const stops = r.stops || [];
    document.getElementById('modal-route-body').innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px">
        <div style="background:var(--gray-100);border-radius:10px;padding:14px">
          <div class="text-xs text-muted mb-4">DEPARTURE</div>
          <div style="font-family:'Playfair Display',serif;font-size:1rem;font-weight:700;color:var(--navy)">${String(r.from_city)}</div>
          <div class="text-sm text-muted">${fmtDate(r.departure_date)} · ${String(r.departure_time)}</div>
        </div>
        <div style="background:var(--gray-100);border-radius:10px;padding:14px">
          <div class="text-xs text-muted mb-4">ARRIVAL</div>
          <div style="font-family:'Playfair Display',serif;font-size:1rem;font-weight:700;color:var(--navy)">${String(r.to_city)}</div>
          <div class="text-sm text-muted">${fmtDate(r.departure_date)} · ${String(r.arrival_time)}</div>
        </div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px">
        <span class="badge badge-gold">${ICON.timer()} ${String(r.duration)}</span>
        <span class="badge badge-blue">${ICON.driver()} ${r.driver_name}</span>
        <span class="badge badge-green">${ICON.seat()} ${String(r.available_seats)}/${String(r.total_seats)}</span>
        <span class="badge badge-gold">$${String(r.price_per_seat)}/seat</span>
        <span class="route-num">${String(r.route_number)}</span>
      </div>
      <div class="section-title">Route Stops</div>
      <div class="stops-list">
        <div class="stop-item"><div class="stop-dot done">✓</div><div style="flex:1"><div style="font-weight:500;font-size:.9rem;color:var(--navy)">${String(r.from_city)}</div><div class="text-xs text-muted">${String(r.departure_time)}</div></div></div>
        ${stops.length ? stops.map(s=>`<div class="stop-item"><div class="stop-dot ${s.type==='checkpoint'?'done':''}" style="${s.type==='checkpoint'?'border-color:var(--gold-light);font-size:.55rem;font-weight:700;color:var(--gold)':''}"><span>${s.type==='checkpoint'?'CP':''}</span></div>
        <div style="flex:1"><div style="font-weight:500;font-size:.9rem;color:var(--navy)">${s.city}</div><div class="text-xs text-muted">${s.type==='checkpoint'?'Guardian checkpoint':'Bus stop'}${s.scheduled_time?' · '+s.scheduled_time:''}</div></div></div>`).join('') : ''}
        <div class="stop-item"><div class="stop-dot" style="border-color:var(--gold)"></div><div style="flex:1"><div style="font-weight:500;font-size:.9rem;color:var(--navy)">${String(r.to_city)}</div><div class="text-xs text-muted">${String(r.arrival_time)}</div></div></div>
      </div>
      ${r.notes ? `<div style="background:var(--gray-100);border-radius:8px;padding:12px;font-size:.85rem;color:var(--gray-600);margin-top:16px">${ICON.note()} ${r.notes}</div>` : ''}
      <button class="btn btn-gold btn-full btn-lg" style="margin-top:20px" data-action="start-booking" data-close="modal-route" data-rid="${r.id}">Book a Seat — $${String(r.price_per_seat)}</button>`;
    openModal('modal-route');
  } catch (e) { toast(e.message, 'error'); }
}

// ─── BOOKING / SEAT SELECTION ────────────────────────────
async function startBooking(routeId) {
  if (!S.token) { showScreen('screen-login'); toast('Sign in to book a seat', 'info'); return; }
  S.selectedSeat = null;
  try {
    const [route, taken] = await Promise.all([
      api('GET', `/routes/${routeId}`, null, false),
      api('GET', `/bookings/taken/${routeId}`, null, false),
    ]);
    S.currentRoute = route;
    buildSeatModal(route, taken);
    openModal('modal-seats');
  } catch (e) { toast(e.message, 'error'); }
}

function buildSeatModal(route, taken) {
  let html = `<div style="margin-bottom:16px"><div class="text-sm text-muted">${route.from_city} → ${route.to_city} · ${fmtDate(route.departure_date)} · <strong style="color:var(--gold)">$${route.price_per_seat}</strong></div></div>`;
  html += '<div class="seat-map">';
  const ROWS = ['3','4','5','6','7','8','9','10','11'];
  ROWS.forEach(row => {
    html += '<div class="seat-row">';
    ['A','B'].forEach(col => {
      const sid = row + col;
      const isTaken = taken.includes(sid);
      html += `<div class="seat${isTaken?' taken':''}" id="seat-${sid}" onclick="${isTaken ? '' : `selectSeat('${sid}')`}">${sid}</div>`;
    });
    html += '<div class="seat-aisle"></div>';
    ['C','D'].forEach(col => {
      const sid = row + col;
      const isTaken = taken.includes(sid);
      html += `<div class="seat${isTaken?' taken':''}" id="seat-${sid}" onclick="${isTaken ? '' : `selectSeat('${sid}')`}">${sid}</div>`;
    });
    html += '</div>';
  });
  html += '</div>';
  html += `<div style="display:flex;gap:14px;margin:12px 0;flex-wrap:wrap">
    <div style="display:flex;align-items:center;gap:6px;font-size:.75rem;color:var(--gray-600)"><div style="width:14px;height:14px;border-radius:4px;background:white;border:2px solid var(--gray-300)"></div>Available</div>
    <div style="display:flex;align-items:center;gap:6px;font-size:.75rem;color:var(--gray-600)"><div style="width:14px;height:14px;border-radius:4px;background:var(--gold)"></div>Selected</div>
    <div style="display:flex;align-items:center;gap:6px;font-size:.75rem;color:var(--gray-600)"><div style="width:14px;height:14px;border-radius:4px;background:var(--gray-200)"></div>Taken</div>
  </div>`;
  html += `<div style="background:var(--gray-100);border-radius:8px;padding:10px 14px;font-size:.82rem;color:var(--gray-600);margin-bottom:14px" id="seat-selected-info">No seat selected yet.</div>`;
  html += `<button class="btn btn-gold btn-full btn-lg" onclick="confirmBooking()">Confirm Booking</button>`;
  document.getElementById('modal-seats-body').innerHTML = html;
}

function selectSeat(sid) {
  if (S.selectedSeat) {
    const prev = document.getElementById(`seat-${S.selectedSeat}`);
    if (prev) prev.classList.remove('selected');
  }
  S.selectedSeat = sid;
  document.getElementById(`seat-${sid}`).classList.add('selected');
  document.getElementById('seat-selected-info').innerHTML = `<strong>Seat ${sid}</strong> selected – ready to confirm!`;
}

async function confirmBooking() {
  if (!S.selectedSeat) { toast('Please select a seat', 'error'); return; }
  try {
    const res = await api('POST', '/bookings', { route_id: S.currentRoute.id, seat_number: S.selectedSeat, booking_type: 'seat' });
    closeModal('modal-seats');
    toast(`Booking confirmed! Seat ${S.selectedSeat} on ${S.currentRoute.route_number}`, 'success');
    S.selectedSeat = null;
    if (S.pTab === 'tickets') pTab('tickets');
  } catch (e) { toast(e.message, 'error'); }
}

// ─── ACTIVE TRIPS ────────────────────────────────────────
async function renderActiveTrips() {
  try {
    const bookings = await api('GET', '/bookings/mine');
    S.myBookings = bookings;
    document.getElementById('p-content').innerHTML = buildActiveTripsPage(bookings);
    if (bookings.length) {
      animateBus();
      // Join route room for live updates
      const firstActive = bookings[0];
      if (S.socket) {
        S.socket.emit('join_route_room', firstActive.route_id);
        S.chatRoute = firstActive.route_id;
      }
      // Fetch stops for live progress
      try {
        const route = await api('GET', `/routes/${firstActive.route_id}`, null, false);
        if (route.stops) renderStopsLive(route.stops);
      } catch (e) { /* stops not available */ }
    }
  } catch (e) { toast(e.message, 'error'); }
}

function buildActiveTripsPage(bookings) {
  if (!bookings.length) return `<div class="page-header"><div><div class="page-title">Active Trips</div></div></div>${emptyState('No active trips — book a route first!')}`;
  const b = bookings[0];
  return `
  <div class="page-header"><div><div class="page-title">Active Trips</div><div class="page-sub">Live tracking and trip status</div></div></div>
  <div class="card mb-16" style="margin-bottom:16px">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
      <div><div class="section-title" style="margin-bottom:0">${b.route_number} — Live</div><div class="text-sm text-muted">${b.from_city} → ${b.to_city} · ${fmtDate(b.departure_date)}</div></div>
      <span class="badge badge-green">● Active</span>
    </div>
    <div class="map-container" id="live-map">
      <svg width="100%" height="100%" style="position:absolute;inset:0" viewBox="0 0 800 280">
        <defs><linearGradient id="roadGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#b8d4bb"/><stop offset="100%" stop-color="#88b890"/></linearGradient></defs>
        <rect width="800" height="280" fill="url(#roadGrad)"/>
        <path d="M80,230 Q250,190 400,140 Q580,85 730,50" stroke="rgba(255,255,255,0.5)" stroke-width="12" fill="none" stroke-linecap="round"/>
        <path d="M80,230 Q250,190 400,140 Q580,85 730,50" stroke="rgba(255,255,255,0.85)" stroke-width="6" fill="none" stroke-linecap="round" stroke-dasharray="20,12"/>
        <circle cx="80" cy="230" r="9" fill="#2E7D52" stroke="white" stroke-width="2.5"/>
        <text x="95" y="235" font-size="11" fill="#1a3020" font-family="DM Sans,sans-serif" font-weight="600">${b.from_city}</text>
        <circle cx="400" cy="142" r="8" fill="#C9962A" stroke="white" stroke-width="2.5"/>
        <text x="415" y="147" font-size="11" fill="#6b4f10" font-family="DM Sans,sans-serif" font-weight="600">Next Stop</text>
        <circle cx="730" cy="52" r="9" fill="#0B1D3A" stroke="white" stroke-width="2.5"/>
        <text x="700" y="38" font-size="11" fill="#0B1D3A" font-family="DM Sans,sans-serif" font-weight="600">${b.to_city}</text>
      </svg>
      <div id="bus-marker" style="position:absolute;width:40px;height:40px;background:var(--gold);border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(201,150,42,.6);transition:left 2s linear,top 2s linear;left:35%;top:45%">
        <svg viewBox="0 0 24 24" fill="none" stroke="#0B1D3A" stroke-width="2" width="20" height="20"><rect x="1" y="3" width="22" height="14" rx="2"/><path d="M1 10h22M8 17v2M16 17v2"/></svg>
      </div>
      <div class="map-overlay">
        <div><div style="font-size:.72rem;color:var(--gray-400)">NEXT STOP</div><div style="font-weight:600;font-size:.9rem;color:var(--navy)">En route</div></div>
        <div><div style="font-size:.72rem;color:var(--gray-400)">FINAL ARRIVAL</div><div style="font-weight:600;font-size:.9rem;color:var(--navy)">${b.arrival_time}</div></div>
        <span class="badge badge-green" id="trip-status-badge">On Schedule</span>
      </div>
    </div>
    <div class="card mb-16" style="margin-bottom:16px" id="stops-live-container">
      <div class="section-title">Route Progress</div>
      <div class="stops-list" id="stops-live-list"></div>
    </div>
    <div style="display:flex;align-items:center;gap:14px;background:rgba(46,125,82,.08);border:1px solid rgba(46,125,82,.2);border-radius:10px;padding:14px;margin-top:14px">
      <div style="width:42px;height:42px;border-radius:10px;background:var(--success);display:flex;align-items:center;justify-content:center">
        <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" width="20" height="20"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <div><div style="font-weight:600;color:var(--success)">Checked In</div><div class="text-sm text-muted">Seat ${b.seat_number} · ${b.route_number}</div></div>
    </div>
  </div>
  <div class="card">
    <div class="section-title">Your Upcoming Trips</div>
    ${bookings.map(bk => `<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--gray-100)">
      <div><div style="font-weight:500;color:var(--navy);font-size:.9rem">${bk.from_city} → ${bk.to_city}</div><div class="text-xs text-muted">${fmtDate(bk.departure_date)} · Seat ${bk.seat_number}</div></div>
      <span class="badge ${bk.checkin_status === 'checked' ? 'badge-green' : 'badge-gold'}">${bk.checkin_status}</span>
    </div>`).join('')}
  </div>`;
}

function animateBus() {
  if (S.busAnimInterval) clearInterval(S.busAnimInterval);
  let pos = 35, dir = 1;
  S.busAnimInterval = setInterval(() => {
    const bus = document.getElementById('bus-marker');
    if (!bus) return;
    pos += dir * 0.15;
    if (pos > 48 || pos < 33) dir *= -1;
    bus.style.left = pos + '%';
  }, 100);
}

function updateBusMarker(lat, lon) {
  // Simplified: just wiggle to indicate update
  const bus = document.getElementById('bus-marker');
  if (bus) { bus.style.transform = 'scale(1.2)'; setTimeout(() => bus.style.transform = '', 300); }
}

// ─── TICKETS ─────────────────────────────────────────────
async function renderTickets() {
  try {
    const bookings = await api('GET', '/bookings/mine');
    S.allBookings = bookings;
    document.getElementById('p-content').innerHTML = buildTicketsPage(bookings, 'active');
    bookings.forEach(b => {
      const el = document.getElementById(`qr-mini-${b.id}`);
      if (el && typeof QRCode !== 'undefined') {
        new QRCode(el, { text:`dormtohome:ticket:${b.id}`, width:60, height:60, colorDark:'#0B1D3A', colorLight:'#FFFFFF', correctLevel:QRCode.CorrectLevel.H });
      }
    });
  } catch (e) { toast(e.message, 'error'); }
}

function buildTicketsPage(bookings, activeTab) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const active = bookings.filter(b => {
    const d = new Date(b.departure_date + 'T23:59:59');
    return d >= today;
  });
  const inactive = bookings.filter(b => {
    const d = new Date(b.departure_date + 'T23:59:59');
    return d < today;
  });
  const showing = activeTab === 'active' ? active : inactive;
  if (!bookings.length) return `<div class="page-header"><div><div class="page-title">My Tickets</div></div></div>${emptyState('No tickets yet — book a route!')}`;
  return `
  <div class="page-header"><div><div class="page-title">My Tickets</div><div class="page-sub">Tap a ticket to view QR code</div></div></div>
  <div class="tabs">
    <div class="tab ${activeTab === 'active' ? 'active' : ''}" onclick="showTicketTab('active')">Active Tickets</div>
    <div class="tab ${activeTab === 'inactive' ? 'active' : ''}" onclick="showTicketTab('inactive')">Inactive Tickets</div>
  </div>
  <div style="display:flex;flex-direction:column;gap:12px" id="tickets-list">
    ${showing.length ? showing.map(b => buildTicketCard(b)).join('') : emptyState(activeTab === 'active' ? 'No active tickets — book a route!' : 'No inactive tickets. Your completed trips will appear here.')}
  </div>`;
}

function buildTicketCard(b) {
  return `<div style="background:var(--white);border:1px solid var(--gray-200);border-radius:14px;overflow:hidden;display:grid;grid-template-columns:1fr 90px;cursor:pointer;transition:var(--transition)" onclick="openTicket('${b.id}','${b.route_number}','${b.from_city}','${b.to_city}','${fmtDate(b.departure_date)}','${b.departure_time}','${b.seat_number}','${b.driver_name}')" onmouseover="this.style.borderColor='var(--gold)'" onmouseout="this.style.borderColor='var(--gray-200)'">
    <div style="padding:18px 22px">
      <div style="display:flex;justify-content:space-between;margin-bottom:12px">
        <span class="route-num">${b.route_number}</span>
        <span class="badge ${b.checkin_status === 'checked' ? 'badge-green' : 'badge-gold'}">${b.checkin_status === 'checked' ? '✓ Checked In' : 'Confirmed'}</span>
      </div>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
        <div><div style="font-family:'Playfair Display',serif;font-size:1rem;font-weight:700;color:var(--navy)">${b.from_city}</div><div class="text-xs text-muted">${b.departure_time}</div></div>
        <div style="color:var(--gold);font-size:1.2rem;flex:1;text-align:center">→</div>
        <div style="text-align:right"><div style="font-family:'Playfair Display',serif;font-size:1rem;font-weight:700;color:var(--navy)">${b.to_city}</div><div class="text-xs text-muted">${b.arrival_time}</div></div>
      </div>
      <div style="display:flex;gap:14px;font-size:.78rem;color:var(--gray-400)"><span style="display:inline-flex;align-items:center;gap:4px">${ICON.calendar()} ${fmtDate(b.departure_date)}</span><span style="display:inline-flex;align-items:center;gap:4px">${ICON.seat()} Seat ${b.seat_number}</span><span style="display:inline-flex;align-items:center;gap:4px">${ICON.driver()} ${b.driver_name}</span></div>
    </div>
    <div style="background:var(--navy);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:12px;gap:8px">
      <div style="font-size:.6rem;color:rgba(255,255,255,.5);letter-spacing:.08em">SCAN</div>
      ${miniQR(b.id)}
      <div style="font-size:.58rem;color:rgba(255,255,255,.4)">${b.route_number}</div>
    </div>
  </div>`;
}

function showTicketTab(tab) {
  if (!S.allBookings) return;
  document.getElementById('p-content').innerHTML = buildTicketsPage(S.allBookings, tab);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const showing = S.allBookings.filter(b => {
    const d = new Date(b.departure_date + 'T23:59:59');
    return (tab === 'active') ? d >= today : d < today;
  });
  showing.forEach(b => {
    const el = document.getElementById(`qr-mini-${b.id}`);
    if (el && typeof QRCode !== 'undefined') {
      new QRCode(el, { text:`dormtohome:ticket:${b.id}`, width:60, height:60, colorDark:'#0B1D3A', colorLight:'#FFFFFF', correctLevel:QRCode.CorrectLevel.H });
    }
  });
}

function miniQR(bookingId) {
  return `<div id="qr-mini-${bookingId || 'x'}" style="width:60px;height:60px;border-radius:5px;overflow:hidden"></div>`;
}

function openTicket(id, num, from, to, date, time, seat, driver) {
  document.getElementById('modal-ticket-body').innerHTML = `
    <div style="text-align:center;margin-bottom:20px">
      <div style="font-size:.72rem;color:var(--gray-400);letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px">Route ${num}</div>
      <div style="font-family:'Playfair Display',serif;font-size:1.3rem;font-weight:700;color:var(--navy)">${from} → ${to}</div>
      <div class="text-sm text-muted">${date} · ${time}</div>
    </div>
    <div style="text-align:center;font-size:.78rem;color:var(--gray-400);margin-bottom:16px">Show this to your driver at boarding</div>
    <div style="flex-direction:row;font-size:.85rem;color:var(--gray-400);text-align:center"></div>
    <div style="background:var(--gray-100);border-radius:10px;padding:14px;display:grid;grid-template-columns:1fr 1fr;gap:10px;text-align:center">
      <div><div class="text-xs text-muted">SEAT</div><div style="font-weight:700;color:var(--navy);font-size:1.2rem">${seat}</div></div>
      <div><div class="text-xs text-muted">DRIVER</div><div style="font-weight:600;color:var(--navy);font-size:.88rem">${driver}</div></div>
    </div>
    <div style="margin-top:14px;background:rgba(201,150,42,.08);border:1px solid rgba(201,150,42,.2);border-radius:10px;padding:12px;font-size:.8rem;color:var(--gray-600)">
      ${ICON.bus()} <strong>Booking ID:</strong> ${id.substring(0,8).toUpperCase()}
    </div>
    <div id="ticket-qr-canvas"></div>`;
  openModal('modal-ticket');
  setTimeout(() => renderTicketQR(id), 100);
}

// ─── MESSAGES ────────────────────────────────────────────
async function renderPassengerMessages() {
  try {
    const bookings = await api('GET', '/bookings/mine');
    const rooms = bookings.slice(0, 5);
    const defaultRoom = rooms[0];
    let msgs = [];
    if (defaultRoom) {
      msgs = await api('GET', `/messages/${defaultRoom.route_id}`);
      if (S.socket) S.socket.emit('join_route_room', defaultRoom.route_id);
      S.chatRoute = defaultRoom.route_id;
    }
    document.getElementById('p-content').innerHTML = buildChatUI(rooms, msgs, defaultRoom);
  } catch (e) { toast(e.message, 'error'); }
}

async function renderDriverMessages() {
  try {
    const routes = await api('GET', '/routes/driver/mine');
    const rooms = routes.slice(0, 5);
    const defaultRoom = rooms[0];
    let msgs = [];
    if (defaultRoom) {
      msgs = await api('GET', `/messages/${defaultRoom.id}`);
      if (S.socket) S.socket.emit('join_route_room', defaultRoom.id);
      S.chatRoute = defaultRoom.id;
    }
    document.getElementById('d-content').innerHTML = buildChatUI(rooms.map(r => ({ route_id: r.id, route_number: r.route_number, from_city: r.from_city, to_city: r.to_city })), msgs, rooms[0] ? { route_id: rooms[0].id, route_number: rooms[0].route_number, from_city: rooms[0].from_city, to_city: rooms[0].to_city } : null);
  } catch (e) { toast(e.message, 'error'); }
}

function buildChatUI(rooms, msgs, active) {
  return `
  <div class="page-header"><div><div class="page-title">Messages</div><div class="page-sub">Trip group chats</div></div></div>
  <div class="chat-layout">
    <div class="chat-sidebar">
      <div class="chat-sidebar-header">Your Trips</div>
      ${rooms.map((r, i) => {
        const active = i === 0 ? 'active' : '';
        return `<div class="chat-room-item ${active}" data-rid="${String(r.route_id)}" data-num="${String(r.route_number)}" data-from="${String(r.from_city)}" data-to="${String(r.to_city)}" data-action="switch-chat" onclick="switchChatRoom(this.dataset.rid,this.dataset.num,this.dataset.from,this.dataset.to,this)">
        <div class="chat-room-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="17" height="17"><rect x="1" y="3" width="22" height="14" rx="2"/><path d="M1 10h22"/></svg></div>
        <div><div class="chat-room-name">${String(r.route_number)}</div><div class="chat-room-sub">${String(r.from_city)} → ${String(r.to_city)}</div></div>
      </div>`;
      }).join('')}
    </div>
    <div class="chat-main">
      <div class="chat-header">
        <div class="chat-room-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="17" height="17"><rect x="1" y="3" width="22" height="14" rx="2"/><path d="M1 10h22"/></svg></div>
        <div style="flex:1">
          <div style="font-weight:600;color:var(--navy);font-size:.95rem" id="chat-room-label">${active ? `${active.route_number} — ${active.from_city} → ${active.to_city}` : 'No trips'}</div>
          <div class="text-xs text-muted">Passengers, Driver, Guardians</div>
        </div>
      </div>
      <div class="chat-messages" id="chat-messages">${msgs.map(buildMsgBubble).join('')}</div>
      <div class="chat-input-row">
        <textarea class="chat-input" id="chat-input" rows="1" placeholder="Message..." onkeypress="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendMsg()}"></textarea>
        <button class="btn btn-gold" onclick="sendMsg()">Send</button>
      </div>
    </div>
  </div>`;
}

function buildMsgBubble(m) {
  const isMe = S.user && m.sender_id === S.user.id;
  if (m.message_type === 'system') return `<div class="system-msg">${m.content}</div>`;
  const isNotif = m.message_type === 'notification';
  return `<div class="chat-msg ${isMe ? 'me' : 'them'} ${isNotif ? 'notif-msg' : ''}">
    ${!isMe ? `<div class="msg-sender">${m.sender_name} · ${m.sender_role}</div>` : ''}
    <div class="msg-bubble">${m.content}</div>
    <div class="msg-meta">${new Date(m.sent_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
  </div>`;
}

function appendChatMsg(msg) {
  const body = document.getElementById('chat-messages');
  if (!body || msg.route_id !== S.chatRoute) return;
  body.innerHTML += buildMsgBubble(msg);
  body.scrollTop = body.scrollHeight;
}

async function sendMsg() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text || !S.chatRoute) return;
  input.value = '';
  if (S.socket) {
    S.socket.emit('send_message', { routeId: S.chatRoute, content: text });
  } else {
    try {
      const msg = await api('POST', `/messages/${S.chatRoute}`, { content: text });
      appendChatMsg(msg);
  } catch (e) { console.error('renderPassengerRoutes error:', e); toast(e.message || 'Failed to load routes', 'error'); }
}
}

async function switchChatRoom(routeId, num, from, to, el) {
  document.querySelectorAll('.chat-room-item').forEach(r => r.classList.remove('active'));
  el.classList.add('active');
  if (S.socket && S.chatRoute) S.socket.emit('leave_route_room', S.chatRoute);
  S.chatRoute = routeId;
  if (S.socket) S.socket.emit('join_route_room', routeId);
  const label = document.getElementById('chat-room-label');
  if (label) label.textContent = `${num} — ${from} → ${to}`;
  try {
    const msgs = await api('GET', `/messages/${routeId}`);
    const body = document.getElementById('chat-messages');
    if (body) { body.innerHTML = msgs.map(buildMsgBubble).join(''); body.scrollTop = body.scrollHeight; }
  } catch (e) { toast(e.message, 'error'); }
}

// ─── PASSENGER ACCOUNT ────────────────────────────────────
async function renderPassengerAccount() {
  try {
    const [user, guardians] = await Promise.all([
      api('GET', '/auth/me'),
      api('GET', '/guardians'),
    ]);
    document.getElementById('p-content').innerHTML = buildAccountPage(user, guardians);
  } catch (e) { toast(e.message, 'error'); }
}

function buildAccountPage(user, guardians) {
  return `
  <div class="page-header"><div><div class="page-title">Account Settings</div></div></div>
  <div class="two-col" style="align-items:start">
    <div>
      <div class="card mb-16" style="margin-bottom:16px">
        <div class="section-title">Profile</div>
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px">
          <div style="width:52px;height:52px;border-radius:12px;background:linear-gradient(135deg,var(--gold),var(--gold-light));display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1.1rem;color:var(--navy-dark)">${(user.first_name || '')[0] || ''}${(user.last_name || '')[0] || ''}</div>
          <div><div style="font-weight:600;color:var(--navy)">${user.first_name} ${user.last_name}</div><div class="text-sm text-muted">${user.email}</div><div class="text-sm text-muted">${user.phone || 'No phone'}</div></div>
        </div>
        <div class="form-group"><label class="form-label" style="color:var(--navy)">First Name</label><input class="form-input" style="color:var(--navy-dark);background:var(--gray-100);border-color:var(--gray-200)" id="acc-first" value="${user.first_name}"></div>
        <div class="form-group"><label class="form-label" style="color:var(--navy)">Last Name</label><input class="form-input" style="color:var(--navy-dark);background:var(--gray-100);border-color:var(--gray-200)" id="acc-last" value="${user.last_name}"></div>
        <div class="form-group"><label class="form-label" style="color:var(--navy)">Phone</label><input class="form-input" style="color:var(--navy-dark);background:var(--gray-100);border-color:var(--gray-200)" id="acc-phone" value="${user.phone || ''}"></div>
        <button class="btn btn-gold" onclick="saveProfile()">Save Changes</button>
      </div>
      <div class="card">
        <div class="section-title">Notifications</div>
        ${[['Arrival alerts (15 min)','notif-arrival'],['New route alerts','notif-routes'],['Chat messages','notif-chat']].map(([label,id])=>`
        <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--gray-100)">
          <span style="font-size:.875rem;color:var(--navy-dark)">${label}</span>
          <div class="toggle on" onclick="this.classList.toggle('on')"></div>
        </div>`).join('')}
        <button class="btn btn-danger btn-full mt-20" style="margin-top:20px" onclick="logout()">Sign Out</button>
      </div>
    </div>
    <div>
      <div class="card mb-16" style="margin-bottom:16px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
          <div class="section-title" style="margin-bottom:0">Guardian Contacts</div>
          <button class="btn btn-outline-gold btn-sm" onclick="addGuardianForm()">+ Add</button>
        </div>
        <div id="guardian-list">
          ${guardians.map(g => buildGuardianCard(g)).join('') || '<div class="text-sm text-muted">No guardians added yet.</div>'}
        </div>
        <div id="guardian-add-form" style="display:none;margin-top:14px;background:var(--gray-100);border-radius:10px;padding:14px">
          <div class="form-group"><label class="form-label" style="color:var(--navy)">Name</label><input class="form-input" style="color:var(--navy-dark);background:white" id="g-add-name" placeholder="Guardian name"></div>
          <div class="two-col" style="margin-top:8px">
            <div class="form-group"><label class="form-label" style="color:var(--navy)">Email</label><input class="form-input" style="color:var(--navy-dark);background:white" id="g-add-email" placeholder="guardian@email.com" type="email"></div>
            <div class="form-group"><label class="form-label" style="color:var(--navy)">Phone</label><input class="form-input" style="color:var(--navy-dark);background:white" id="g-add-phone" placeholder="+1 (555) 000-0000"></div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;margin-top:8px">
            <div class="checkbox checked" id="g-add-cp" onclick="this.classList.toggle('checked')"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="2,6 5,9 10,3"/></svg></div>
            <span class="text-sm" style="color:var(--navy-dark)">Checkpoint notifications</span>
            <button class="help-icon" onclick="showHelp('checkpoint')">?</button>
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn btn-gold btn-sm" onclick="saveGuardian()">Save Guardian</button>
            <button class="btn btn-sm" style="background:var(--gray-200);color:var(--gray-600)" onclick="document.getElementById('guardian-add-form').style.display='none'">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

function buildGuardianCard(g) {
  const contactInfo = [g.email, g.phone].filter(Boolean).join(' · ');
  return `<div class="guardian-card" id="gc-${g.id}">
    <div style="width:36px;height:36px;border-radius:50%;background:var(--navy);display:flex;align-items:center;justify-content:center;flex-shrink:0"><svg viewBox="0 0 24 24" fill="none" stroke="var(--gold-light)" stroke-width="1.8" width="16" height="16"><circle cx="12" cy="8" r="4"/><path d="M6 20v-1a6 6 0 0112 0v1"/></svg></div>
    <div style="flex:1">
      <div style="font-weight:500;font-size:.9rem;color:var(--navy)">${g.name}</div>
      <div class="text-xs text-muted">${contactInfo}</div>
      <div style="display:flex;align-items:center;gap:6px;margin-top:4px">
        <div class="checkbox ${g.checkpoint_notifs ? 'checked' : ''}" onclick="toggleGuardianNotif('${g.id}',this)"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="2,6 5,9 10,3"/></svg></div>
        <span class="text-xs text-muted">Send Checkpoint Notifications</span>
        <button class="help-icon" onclick="showHelp('checkpoint')">?</button>
      </div>
    </div>
    <div style="display:flex;flex-direction:column;gap:4px">
      <button class="btn btn-outline-gold btn-sm" onclick="editGuardian('${g.id}','${g.name}','${g.email || ''}','${g.phone || ''}')">Edit</button>
      <button class="btn btn-danger btn-sm" onclick="confirmDeleteGuardian('${g.id}','${g.name}')">Remove</button>
    </div>
  </div>`;
}

function editGuardian(id, name, email, phone) {
  const card = document.getElementById(`gc-${id}`);
  if (!card) return;
  card.innerHTML = `
    <div style="width:100%;background:var(--gray-100);border-radius:10px;padding:14px">
      <div class="form-group"><label class="form-label" style="color:var(--navy)">Name</label><input class="form-input" style="color:var(--navy-dark);background:white" id="ge-name-${id}" value="${name}"></div>
      <div class="two-col" style="margin-top:8px">
        <div class="form-group"><label class="form-label" style="color:var(--navy)">Email</label><input class="form-input" style="color:var(--navy-dark);background:white" id="ge-email-${id}" value="${email}" type="email"></div>
        <div class="form-group"><label class="form-label" style="color:var(--navy)">Phone</label><input class="form-input" style="color:var(--navy-dark);background:white" id="ge-phone-${id}" value="${phone}"></div>
      </div>
      <div style="display:flex;gap:8px;margin-top:10px">
        <button class="btn btn-gold btn-sm" onclick="saveGuardianEdit('${id}')">Save</button>
        <button class="btn btn-sm" style="background:var(--gray-200);color:var(--gray-600)" onclick="renderPassengerAccount()">Cancel</button>
      </div>
    </div>`;
}

async function saveGuardianEdit(id) {
  const name = document.getElementById(`ge-name-${id}`).value;
  const email = document.getElementById(`ge-email-${id}`).value;
  const phone = document.getElementById(`ge-phone-${id}`).value;

  if (email && !isValidEmail(email)) { toast('Invalid guardian email', 'error'); return; }
  if (phone && !isValidPhone(phone)) { toast('Invalid guardian phone number', 'error'); return; }
  if (!name.trim()) { toast('Guardian name is required', 'error'); return; }

  try {
    await api('PATCH', `/guardians/${id}`, { name, email, phone });
    toast('Guardian updated', 'success');
    renderPassengerAccount();
  } catch (e) { toast(e.message, 'error'); }
}

function confirmDeleteGuardian(id, name) {
  if (confirm(`Are you sure you want to remove ${name} as your guardian? They will no longer receive checkpoint notifications.`)) {
    deleteGuardian(id);
  }
}

async function saveProfile() {
  const phone = document.getElementById('acc-phone').value;
  if (phone && !isValidPhone(phone)) {
    toast('Please enter a valid 10-digit phone number', 'error');
    return;
  }
  try {
    await api('PUT', '/auth/me', {
      first_name: document.getElementById('acc-first').value,
      last_name: document.getElementById('acc-last').value,
      phone: phone,
    });
    toast('Profile saved', 'success');
  } catch (e) { toast(e.message, 'error'); }
}

function addGuardianForm() { document.getElementById('guardian-add-form').style.display = ''; }

async function saveGuardian() {
  const name = document.getElementById('g-add-name').value;
  const email = document.getElementById('g-add-email').value;
  const phone = document.getElementById('g-add-phone').value;

  if (!name.trim()) { toast('Guardian name is required', 'error'); return; }
  if (email && !isValidEmail(email)) { toast('Invalid guardian email', 'error'); return; }
  if (phone && !isValidPhone(phone)) { toast('Invalid guardian phone number', 'error'); return; }

  try {
    const g = await api('POST', '/guardians', {
      name: name,
      email: email,
      phone: phone,
      checkpoint_notifs: document.getElementById('g-add-cp').classList.contains('checked'),
    });
    document.getElementById('guardian-list').innerHTML += buildGuardianCard(g);
    document.getElementById('guardian-add-form').style.display = 'none';
    toast('Guardian added', 'success');
  } catch (e) { toast(e.message, 'error'); }
}

async function deleteGuardian(id) {
  try {
    await api('DELETE', `/guardians/${id}`);
    const el = document.getElementById(`gc-${id}`);
    if (el) { el.style.opacity = '0'; el.style.transform = 'translateX(20px)'; el.style.transition = 'all .3s'; setTimeout(() => el.remove(), 300); }
    toast('Guardian removed', 'success');
  } catch (e) { toast(e.message, 'error'); }
}

async function toggleGuardianNotif(id, checkbox) {
  checkbox.classList.toggle('checked');
  try {
    await api('PATCH', `/guardians/${id}`, { checkpoint_notifs: checkbox.classList.contains('checked') });
  } catch (e) { checkbox.classList.toggle('checked'); }
}

// ─── DRIVER: DASHBOARD ───────────────────────────────────
async function renderDriverDashboard() {
  try {
    const analytics = await api('GET', '/analytics/driver');
    document.getElementById('d-content').innerHTML = buildDriverDashboard(analytics);
    startDriverLocationSharing();
  } catch (e) { toast(e.message, 'error'); }
}

function buildDriverDashboard(a) {
  return `
  <div class="page-header">
    <div><div class="page-title">Driver Dashboard</div><div class="page-sub">${S.user?.first_name} ${S.user?.last_name}</div></div>
    <div style="display:flex;gap:8px">
      <button class="btn btn-outline-gold btn-sm" onclick="logout()">Sign Out</button>
      <button class="btn btn-outline-gold btn-sm" onclick="openSendNotif()">${ICON.megaphone()} Send Update</button>
      <button class="btn btn-gold" onclick="dTab('create')">+ New Route</button>
    </div>
  </div>
  <div class="analytics-grid">
    ${[
      {label:'My Routes',val:a.total_routes,delta:'+2',up:true,bars:[2,3,4,4,5,6,6,a.total_routes]},
      {label:'Total Passengers',val:a.total_passengers,delta:'+18',up:true,bars:[20,30,28,35,40,38,45,a.total_passengers]},
      {label:'Revenue (Est.)',val:'$'+Math.round(a.total_revenue).toLocaleString(),delta:'+$340',up:true,bars:[200,280,260,320,300,350,340,Math.round(a.total_revenue)]},
      {label:'Avg. Rating',val:'4.92',delta:'+0.1',up:true,bars:[4,5,4,5,5,5,5,5]},
    ].map(card => `<div class="analytics-card">
      <div class="analytics-val">${card.val}</div>
      <div class="analytics-label">${card.label}</div>
      <div class="analytics-delta ${card.up?'up':'down'}">${card.up?'↑':'↓'} ${card.delta}</div>
      <div class="mini-chart">${card.bars.map((b,i)=>`<div class="mini-bar ${i===card.bars.length-1?'hi':''}" style="height:${Math.round((b/Math.max(...card.bars))*100)}%"></div>`).join('')}</div>
    </div>`).join('')}
  </div>
  <div class="two-col" style="align-items:start">
    <div class="card">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
        <div class="section-title" style="margin-bottom:0">Upcoming Trips</div>
        <button class="btn btn-outline-gold btn-sm" onclick="dTab('routes')">View All</button>
      </div>
      ${a.upcoming_routes.length ? a.upcoming_routes.map(r => `<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--gray-100)">
        <div><div style="font-weight:600;font-size:.9rem;color:var(--navy)">${String(r.from_city)} → ${String(r.to_city)}</div><div class="text-xs text-muted">${fmtDate(r.departure_date)} · ${String(r.departure_time)} · <span class="route-num">${String(r.route_number)}</span></div></div>
        <button class="btn btn-outline-gold btn-sm" onclick="dTab('checkin')">Check-In</button>
      </div>`).join('') : '<div class="text-sm text-muted">No upcoming routes</div>'}
    </div>
    <div class="card">
      <div class="section-title">Location Sharing</div>
      <div style="display:flex;align-items:center;gap:12px;background:rgba(46,125,82,.08);border:1px solid rgba(46,125,82,.2);border-radius:10px;padding:14px;margin-bottom:14px">
        <div class="pulse-dot" style="flex-shrink:0"></div>
        <div class="text-sm" style="color:var(--navy-dark);flex:1">Location sharing is <strong>active</strong></div>
        <div class="toggle on" id="loc-toggle" onclick="toggleLocationSharing()"></div>
      </div>
      <div style="font-size:.78rem;color:var(--gray-400);line-height:1.5">Your location updates every 10 seconds while on an active trip. Passengers and guardians can see your live position on the map.</div>
      <div class="section-title mt-16" style="margin-top:16px">Quick Actions</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <button class="btn btn-gold btn-sm" onclick="dTab('checkin')">Open Check-In</button>
        <button class="btn btn-outline-gold btn-sm" onclick="dTab('requested')">View Requests</button>
        <button class="btn btn-navy btn-sm" onclick="dTab('create')">Create Route</button>
        <button class="btn btn-outline-gold btn-sm" onclick="openSendNotif()">Send Update</button>
      </div>
    </div>
  </div>`;
}

// ─── DRIVER: ROUTES ──────────────────────────────────────
async function renderDriverRoutes() {
  try {
    const routes = await api('GET', '/routes/driver/mine');
    S.myRoutes = routes;
    document.getElementById('d-content').innerHTML = buildDriverRoutesPage(routes);
  } catch (e) { toast(e.message, 'error'); }
}

function buildDriverRoutesPage(routes) {
  let html = `
  <div class="page-header"><div><div class="page-title">My Routes</div><div class="page-sub">All your posted routes</div></div><button class="btn btn-gold" onclick="dTab('create')">+ New Route</button></div>
  <div class="tabs"><div class="tab active">Active</div><div class="tab">Completed</div><div class="tab">Draft</div></div>
  <div class="routes-grid">`;
  if (routes.length) {
    routes.forEach(r => {
      html += `<div class="route-card">
      <div style="flex:1">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
          <span class="city-name">${String(r.from_city)}</span><span class="route-arrow">→</span><span class="city-name">${String(r.to_city)}</span>
          <span class="route-num">${String(r.route_number)}</span>
        </div>
        <div class="route-meta">
          <span class="route-meta-item">${ICON.calendar()} ${fmtDate(r.departure_date)}</span>
          <span class="route-meta-item">${ICON.clock()} ${String(r.departure_time)}</span>
          <span class="route-meta-item">${ICON.people()} ${String(r.booked_seats)}/${String(r.total_seats)} booked</span>
        </div>
        <div style="margin-top:8px"><div class="progress-bar" style="max-width:200px"><div class="progress-fill" style="width:${Math.round((r.booked_seats/r.total_seats)*100)}%"></div></div></div>
      </div>
      <div style="text-align:right">
        <div class="route-price">$${Math.round(r.booked_seats * r.price_per_seat)}</div>
        <div class="route-seats">est. revenue</div>
        <div style="display:flex;gap:6px;margin-top:8px">
          <button class="btn btn-outline-gold btn-sm" onclick="dTab('checkin')">Check-In</button>
          <button class="btn btn-sm" style="background:var(--gray-100);color:var(--navy)" data-rid="${r.id}" onclick="openSendNotif(this.dataset.rid)">Notify</button>
        </div>
      </div>
    </div>`;
    });
  }
  html += `</div>`;
  return html;
}

// ─── DRIVER: CREATE ROUTE ────────────────────────────────
function renderCreateRoute() {
  document.getElementById('d-content').innerHTML = buildCreateRoutePage();
}

function buildCreateRoutePage() {
  const steps = ['Route Info', 'Stops', 'Seats', 'Review'];
  const stepsHTML = steps.map((s, i) => `<div class="step-i ${i + 1 < S.createStep ? 'done' : i + 1 === S.createStep ? 'current' : ''}"><div class="step-circle">${i + 1 < S.createStep ? '✓' : i + 1}</div><span class="step-label">${s}</span></div>`).join('');
  return `
  <div class="page-header"><div><div class="page-title">Create New Route</div><div class="page-sub">Post a trip for passengers to book</div></div></div>
  <div class="card" style="max-width:680px">
    <div class="steps-bar">${stepsHTML}</div>
    ${buildCreateStep()}
  </div>`;
}

function buildCreateStep() {
  const d = S.createData;
  if (S.createStep === 1) return `
    <div class="section-title">Route Information</div>
    <div class="two-col">
      <div class="form-group" style="position:relative"><label class="form-label" style="color:var(--navy)">Departure City</label>
        <input class="form-input" style="color:var(--navy-dark);background:var(--gray-100)" id="cr-from" placeholder="College Station, TX" value="${d.from_city || ''}" oninput="autocityCreate(this,'cr-from-dd')" onblur="validateCityInput('cr-from','cr-from-err')">
        <div class="city-dropdown" id="cr-from-dd"></div>
        <div class="city-error" id="cr-from-err" style="color:var(--error);font-size:.75rem;margin-top:4px;display:none">City not found — please select from the dropdown</div>
      </div>
      <div class="form-group" style="position:relative"><label class="form-label" style="color:var(--navy)">Arrival City</label>
        <input class="form-input" style="color:var(--navy-dark);background:var(--gray-100)" id="cr-to" placeholder="Houston, TX" value="${d.to_city || ''}" oninput="autocityCreate(this,'cr-to-dd')" onblur="validateCityInput('cr-to','cr-to-err')">
        <div class="city-dropdown" id="cr-to-dd"></div>
        <div class="city-error" id="cr-to-err" style="color:var(--error);font-size:.75rem;margin-top:4px;display:none">City not found — please select from the dropdown</div>
      </div>
    </div>
    <div class="two-col">
      <div class="form-group"><label class="form-label" style="color:var(--navy)">Departure Date</label><input class="form-input" type="date" style="color:var(--navy-dark);background:var(--gray-100)" id="cr-date" value="${d.departure_date || ''}"></div>
      <div class="form-group"><label class="form-label" style="color:var(--navy)">Departure Time</label><input class="form-input" type="time" style="color:var(--navy-dark);background:var(--gray-100)" id="cr-dep-time" value="${d.departure_time || '08:00'}" oninput="updateCreateArrival()"></div>
    </div>
    <div class="two-col">
      <div class="form-group"><label class="form-label" style="color:var(--navy)">Arrival Time</label><input class="form-input" type="time" style="color:var(--navy-dark);background:var(--gray-100)" id="cr-arr-time" value="${d.arrival_time || '11:30'}"></div>
      <div class="form-group"><label class="form-label" style="color:var(--navy)">Est. Duration</label><input class="form-input" style="color:var(--navy-dark);background:var(--gray-100)" id="cr-duration" placeholder="3h 30m" value="${d.duration || ''}"></div>
    </div>
    <button class="btn btn-gold mt-12" style="margin-top:12px" onclick="createNext()">Next: Stops →</button>`;

  if (S.createStep === 2) return `
    <div class="section-title">Stops & Checkpoints</div>
    <div class="text-sm text-muted mb-12" style="margin-bottom:12px">Stops = bus physically stops. Checkpoints = cities that notify guardians (bus passes through but doesn't stop).</div>
    <div id="create-stops-list">${(d.stops || []).map((s, i) => buildStopRow(s, i)).join('')}</div>
    <button class="btn btn-outline-gold btn-sm" onclick="addStopRow('stop')">+ Add Stop</button>
    <hr class="divider">
    <div class="section-title">Checkpoints <button class="help-icon ml-4" onclick="showHelp('checkpoint')" style="margin-left:6px">?</button></div>
    <div id="create-cp-list">${(d.checkpoints || []).map((s, i) => buildStopRow(s, i, true)).join('')}</div>
    <button class="btn btn-outline-gold btn-sm" onclick="addStopRow('checkpoint')">+ Add Checkpoint</button>
    <div style="display:flex;gap:10px;margin-top:20px">
      <button class="btn btn-sm" style="background:var(--gray-100);color:var(--navy)" onclick="createBack()">← Back</button>
      <button class="btn btn-gold" onclick="createNext()">Next: Seats →</button>
    </div>`;

  if (S.createStep === 3) return `
    <div class="section-title">Seats & Pricing</div>
    <div class="two-col">
      <div class="form-group"><label class="form-label" style="color:var(--navy)">Total Seats</label><input class="form-input" type="number" style="color:var(--navy-dark);background:var(--gray-100)" id="cr-seats" placeholder="44" value="${d.total_seats || 44}"></div>
      <div class="form-group"><label class="form-label" style="color:var(--navy)">Price Per Seat ($)</label><input class="form-input" type="number" style="color:var(--navy-dark);background:var(--gray-100)" id="cr-price" placeholder="28" value="${d.price_per_seat || ''}"></div>
    </div>
    <div class="form-group"><label class="form-label" style="color:var(--navy)">Package Delivery Price ($)</label><input class="form-input" type="number" style="color:var(--navy-dark);background:var(--gray-100)" id="cr-pkg" placeholder="15" value="${d.package_price || 15}"></div>
    <div class="form-group"><label class="form-label" style="color:var(--navy)">Notes for Passengers</label><textarea class="form-input" rows="3" style="color:var(--navy-dark);background:var(--gray-100);resize:vertical" id="cr-notes" placeholder="Any extra info...">${d.notes || ''}</textarea></div>
    <div style="display:flex;gap:10px;margin-top:12px">
      <button class="btn btn-sm" style="background:var(--gray-100);color:var(--navy)" onclick="createBack()">← Back</button>
      <button class="btn btn-gold" onclick="createNext()">Review →</button>
    </div>`;

  if (S.createStep === 4) return `
    <div class="section-title">Review & Post</div>
    <div style="background:var(--gray-100);border-radius:12px;padding:20px;margin-bottom:20px">
      <div style="font-family:'Playfair Display',serif;font-size:1.1rem;font-weight:700;color:var(--navy);margin-bottom:14px">Route Preview</div>
      ${[['From',d.from_city],['To',d.to_city],['Date',fmtDate(d.departure_date)],['Departure',d.departure_time],['Arrival',d.arrival_time],['Duration',d.duration],['Seats',`${d.total_seats} @ $${d.price_per_seat}/seat`]].map(([k,v])=>`<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--gray-200);font-size:.875rem"><span style="color:var(--gray-600)">${k}</span><strong style="color:var(--navy)">${v || '—'}</strong></div>`).join('')}
    </div>
    <div style="display:flex;gap:10px">
      <button class="btn btn-sm" style="background:var(--gray-100);color:var(--navy)" onclick="createBack()">← Edit</button>
      <button class="btn btn-gold btn-full btn-lg" id="post-btn" onclick="postRoute()">Post Route Live</button>
    </div>`;
}

function buildStopRow(s, i, isCheckpoint = false) {
  return `<div style="display:flex;gap:8px;margin-bottom:8px;align-items:center" id="${isCheckpoint ? 'cp' : 'stop'}-row-${i}">
    <input class="form-input" style="flex:1;color:var(--navy-dark);background:var(--gray-100)" placeholder="${isCheckpoint ? 'Checkpoint city, TX' : 'Stop city, TX'}" value="${s.city || ''}">
    <input class="form-input" type="time" style="width:110px;color:var(--navy-dark);background:var(--gray-100)" placeholder="Time" value="${s.time || ''}">
    <button class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">✕</button>
  </div>`;
}

function addStopRow(type) {
  const container = document.getElementById(type === 'stop' ? 'create-stops-list' : 'create-cp-list');
  if (!container) return;
  const div = document.createElement('div');
  const i = container.children.length;
  div.innerHTML = buildStopRow({}, i, type === 'checkpoint');
  container.appendChild(div.firstElementChild);
}

function collectCreateData() {
  if (S.createStep === 1) {
    S.createData.from_city = document.getElementById('cr-from')?.value;
    S.createData.to_city = document.getElementById('cr-to')?.value;
    S.createData.departure_date = document.getElementById('cr-date')?.value;
    S.createData.departure_time = document.getElementById('cr-dep-time')?.value;
    S.createData.arrival_time = document.getElementById('cr-arr-time')?.value;
    S.createData.duration = document.getElementById('cr-duration')?.value;
  }
  if (S.createStep === 2) {
    const stopRows = document.querySelectorAll('#create-stops-list > div');
    S.createData.stops = Array.from(stopRows).map(row => {
      const inputs = row.querySelectorAll('input');
      return { city: inputs[0]?.value, time: inputs[1]?.value, type: 'stop' };
    }).filter(s => s.city);
    const cpRows = document.querySelectorAll('#create-cp-list > div');
    S.createData.checkpoints = Array.from(cpRows).map(row => {
      const inputs = row.querySelectorAll('input');
      return { city: inputs[0]?.value, time: inputs[1]?.value, type: 'checkpoint' };
    }).filter(s => s.city);
  }
  if (S.createStep === 3) {
    S.createData.total_seats = parseInt(document.getElementById('cr-seats')?.value) || 44;
    S.createData.price_per_seat = parseFloat(document.getElementById('cr-price')?.value);
    S.createData.package_price = parseFloat(document.getElementById('cr-pkg')?.value) || 15;
    S.createData.notes = document.getElementById('cr-notes')?.value;
  }
}

function createNext() {
  collectCreateData();
  if (S.createStep === 1) {
    const fromOk = validateCityInput('cr-from', 'cr-from-err');
    const toOk = validateCityInput('cr-to', 'cr-to-err');
    if (!fromOk || !toOk) return;
  }
  S.createStep = Math.min(4, S.createStep + 1);
  renderCreateRoute();
}
function createBack() {
  collectCreateData();
  S.createStep = Math.max(1, S.createStep - 1);
  renderCreateRoute();
}

async function postRoute() {
  const btn = document.getElementById('post-btn');
  btn.innerHTML = '<span class="spinner"></span>'; btn.disabled = true;
  try {
    const allStops = [...(S.createData.stops || []), ...(S.createData.checkpoints || [])];
    const route = await api('POST', '/routes', { ...S.createData, stops: allStops });
    S.createStep = 1; S.createData = { stops: [], checkpoints: [] };
    dTab('routes');
    toast(`Route ${route.route_number} posted!`, 'success');
  } catch (e) { toast(e.message, 'error'); btn.innerHTML = 'Post Route Live'; btn.disabled = false; }
}

function updateCreateArrival() {
  const dep = document.getElementById('cr-dep-time')?.value;
  if (!dep) return;
  const from = document.getElementById('cr-from')?.value;
  const to = document.getElementById('cr-to')?.value;
  const travel = estimateTravelTime(from, to);
  const [h, m] = dep.split(':').map(Number);
  const totalMin = h * 60 + m + travel.minutes;
  const arr = new Date(2000, 0, 1, 0, totalMin);
  const arrEl = document.getElementById('cr-arr-time');
  if (arrEl) arrEl.value = `${String(arr.getHours()).padStart(2, '0')}:${String(arr.getMinutes()).padStart(2, '0')}`;
  const durEl = document.getElementById('cr-duration');
  if (durEl) durEl.value = travel.text;
}

// ─── DRIVER: CHECK-IN ────────────────────────────────────
async function renderCheckin() {
  try {
    const routes = await api('GET', '/routes/driver/mine');
    const firstRoute = routes[0];
    if (!firstRoute) {
      document.getElementById('d-content').innerHTML = `<div class="page-header"><div><div class="page-title">Check-In</div></div></div>${emptyState('No active routes to check passengers in for.')}`;
      return;
    }
    const manifest = await api('GET', `/routes/${firstRoute.id}/manifest`);
    S.manifest = manifest;
    document.getElementById('d-content').innerHTML = buildCheckinPage(firstRoute, manifest);
    if (S.socket) S.socket.emit('join_route_room', firstRoute.id);
    S.chatRoute = firstRoute.id;
    setTimeout(() => initCheckinScanner(), 100);
  } catch (e) { toast(e.message, 'error'); }
}

function buildCheckinPage(route, manifest) {
  const checked = manifest.filter(p => p.checkin_status === 'checked').length;
  return `
  <div class="page-header">
    <div><div class="page-title">Check-In — ${route.route_number}</div><div class="page-sub">${route.from_city} → ${route.to_city} · ${fmtDate(route.departure_date)}</div></div>
    <span class="badge badge-green" id="ci-counter">${checked}/${manifest.length} Checked In</span>
  </div>
  <div id="checkin-scanner-section"></div>
  <div style="background:var(--white);border:2px dashed var(--gold);border-radius:14px;padding:22px;text-align:center;cursor:pointer;margin-bottom:20px;transition:var(--transition)" onclick="simulateScan()" onmouseover="this.style.background='rgba(201,150,42,.04)'" onmouseout="this.style.background='var(--white)'">
    <svg viewBox="0 0 24 24" fill="none" stroke="var(--gold)" stroke-width="1.5" width="36" height="36" style="margin:0 auto 10px;display:block"><rect x="2" y="2" width="8" height="8" rx="1"/><rect x="14" y="2" width="8" height="8" rx="1"/><rect x="2" y="14" width="8" height="8" rx="1"/><rect x="14" y="14" width="4" height="4"/><rect x="20" y="14" width="2" height="2"/><rect x="14" y="20" width="2" height="2"/></svg>
    <div style="font-weight:600;color:var(--navy)">Scan Passenger QR Code</div>
    <div class="text-sm text-muted mt-4" style="margin-top:4px">Click to simulate a scan</div>
  </div>
  <div style="margin-bottom:12px">
    <div class="progress-bar"><div class="progress-fill" id="ci-progress" style="width:${manifest.length ? Math.round(checked/manifest.length*100) : 0}%"></div></div>
  </div>
  <div class="card">
    <table class="checkin-table">
      <thead><tr><th>Passenger</th><th>Seat</th><th>Type</th><th>Status</th><th>Action</th></tr></thead>
      <tbody id="manifest-body">
        ${manifest.map((p, i) => buildManifestRow(p, i)).join('')}
      </tbody>
    </table>
  </div>`;
}

function buildManifestRow(p, i) {
  return `<tr id="ci-row-${p.id}">
    <td style="font-weight:500;color:var(--navy)">${p.first_name} ${p.last_name}</td>
    <td><span class="badge badge-blue">${p.seat_number}</span></td>
    <td><span class="badge badge-gold">${p.booking_type}</span></td>
    <td><span class="ci-status ${p.checkin_status}">${p.checkin_status === 'checked' ? '✓ Checked In' : p.checkin_status === 'missing' ? '✗ Missing' : '● Pending'}</span></td>
    <td>${p.checkin_status !== 'checked' ? `<button class="btn btn-success btn-sm" onclick="checkinPassenger('${p.id}')">Check In</button>` : '<span class="text-xs text-muted">Done</span>'}</td>
  </tr>`;
}

async function checkinPassenger(bookingId) {
  try {
    await api('PATCH', `/bookings/${bookingId}/checkin`);
    updateCheckinRow(bookingId);
    toast('Passenger checked in', 'success');
    if (S.socket && S.chatRoute) {
      S.socket.emit('checkin_passenger', { bookingId, routeId: S.chatRoute });
    }
  } catch (e) { toast(e.message, 'error'); throw e; }
}

function updateCheckinRow(bookingId, name, seat) {
  const row = document.getElementById(`ci-row-${bookingId}`);
  if (!row) return;
  const statusCell = row.querySelector('.ci-status');
  if (statusCell) { statusCell.className = 'ci-status checked'; statusCell.textContent = '✓ Checked In'; }
  const actionCell = row.querySelector('td:last-child');
  if (actionCell) actionCell.innerHTML = '<span class="text-xs text-muted">Done</span>';
  // Update counter
  const checked = document.querySelectorAll('.ci-status.checked').length;
  const total = document.querySelectorAll('[id^="ci-row-"]').length;
  const counter = document.getElementById('ci-counter');
  if (counter) counter.textContent = `${checked}/${total} Checked In`;
  const progress = document.getElementById('ci-progress');
  if (progress) progress.style.width = `${Math.round(checked / total * 100)}%`;
}

async function simulateScan() {
  const pending = S.manifest.find(p => p.checkin_status === 'pending');
  if (!pending) { toast('All passengers checked in!', 'success'); return; }
  try {
    await checkinPassenger(pending.id);
    pending.checkin_status = 'checked';
    toast(`Scanned: ${pending.first_name} ${pending.last_name}`, 'success');
  } catch (e) { /* error already toasted */ }
}

function renderStopsLive(stops) {
  const listEl = document.getElementById('stops-live-list');
  if (!listEl) return;
  const activeStop = stops.find(s => s.status === 'active') || stops.find(s => s.status === 'upcoming');
  listEl.innerHTML = stops.map(s => {
    const isActive = s.status === 'active';
    const isDone = s.status === 'done';
    const dotClass = isDone ? 'stop-dot done' : isActive ? 'stop-dot active' : 'stop-dot';
    const dotContent = isDone ? '✓' : isActive ? '●' : '';
    return `<div class="stop-item">
      <div class="${dotClass}">${dotContent}</div>
      <div style="flex:1"><div style="font-weight:${isActive||isDone?'600':'400'};font-size:.9rem;color:var(--navy)">${s.city}</div><div class="text-xs text-muted">${s.type === 'checkpoint' ? 'Checkpoint' : 'Stop'}${s.scheduled_time ? ' · '+s.scheduled_time : ''}</div></div>
    </div>`;
  }).join('');
  const badge = document.getElementById('trip-status-badge');
  if (badge && activeStop) {
    badge.textContent = activeStop.type === 'checkpoint' ? 'Passing checkpoint' : 'At stop: ' + activeStop.city;
    badge.className = 'badge badge-gold';
  }
}

// ─── DRIVER LIVE TAB ──────────────────────────────────────
async function renderDriverLive() {
  try {
    const routes = await api('GET', '/routes/driver/mine');
    const activeRoute = routes.find(r => r.status === 'active') || routes[0];
    if (!activeRoute) {
      document.getElementById('d-content').innerHTML = `<div class="page-header"><div><div class="page-title">Live Tracking</div></div></div>${emptyState('No active routes. Create or activate a route first.')}`;
      return;
    }
    S.activeRouteId = activeRoute.id;
    document.getElementById('d-content').innerHTML = buildDriverLivePage(activeRoute);
    setTimeout(() => {
      if (S.activeRouteId) initDriverLiveTab(S.activeRouteId);
    }, 100);
  } catch (e) { toast(e.message, 'error'); }
}

function buildDriverLivePage(route) {
  return `
  <div class="page-header">
    <div><div class="page-title">Live Tracking</div><div class="page-sub">${route.route_number}</div></div>
  </div>
  <div id="driver-live-section"></div>
  `;
}

// ─── DRIVER: REQUESTED ROUTES ────────────────────────────
async function renderRequested() {
  try {
    const reqs = await api('GET', '/requests');
    document.getElementById('d-content').innerHTML = buildRequestedPage(reqs);
  } catch (e) { toast(e.message, 'error'); }
}

function buildRequestedPage(reqs) {
  let html = `
  <div class="page-header"><div><div class="page-title">Passenger Requests</div><div class="page-sub">Routes requested by passengers</div></div></div>
  <div class="filter-bar">
    <span class="filter-label">Sort:</span>
    <div class="filter-chip active">Most Supporters</div>
    <div class="filter-chip" onclick="openFilterPanel('departure')">Departure</div>
    <div class="filter-chip" onclick="openFilterPanel('arrival')">Arrival</div>
    <div class="filter-chip" onclick="openFilterPanel('date')">Date</div>
  </div>
  <div style="display:flex;flex-direction:column;gap:12px">`;
  const sorted = reqs.sort((a, b) => b.supporter_count - a.supporter_count);
  sorted.forEach(r => {
    const pct = Math.min(100, Math.round(r.supporter_count / 25 * 100));
    html += `
    <div class="card card-sm" style="display:grid;grid-template-columns:1fr 80px auto;gap:16px;align-items:center">
      <div>
        <div style="font-weight:600;color:var(--navy);margin-bottom:4px">${String(r.from_city)} → ${String(r.to_city)}</div>
        <div class="text-sm text-muted">${r.requested_date || 'Flexible'} · ${r.requested_time || 'Any time'} · by ${r.requester_name}</div>
        <div class="progress-bar mt-8" style="margin-top:8px;max-width:200px"><div class="progress-fill" style="width:${pct}%"></div></div>
      </div>
      <div style="text-align:center">
        <div style="font-family:Playfair Display,serif;font-size:1.4rem;font-weight:700;color:var(--navy)">${r.supporter_count}</div>
        <div class="text-xs text-muted">interested</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px">
        <button class="btn btn-gold btn-sm" data-from="${String(r.from_city)}" data-to="${String(r.to_city)}" data-date="${String(r.requested_date)}" data-time="${String(r.requested_time)}" data-action="accept-req">Accept & Create</button>
        <button class="btn btn-sm" style="background:var(--gray-100);color:var(--navy)">Decline</button>
      </div>
    </div>`;
  });
  html += `
  </div>
  <div class="card" style="margin-top:24px">
    <div class="section-title">Payment Methods</div>
    <div style="text-align:center;padding:20px;color:var(--gray-400)">
      <div style="font-size:2rem;margin-bottom:8px">&#x1F4B3;</div>
      <div class="text-sm text-muted">Payment method setup coming soon.</div>
      <div class="text-xs text-muted" style="margin-top:4px">You will be able to securely add and manage payment methods here.</div>
    </div>
  </div>`;
  return html;
}

function acceptRequest(from, to, date, time) {
  S.createData = { from_city: from, to_city: to, departure_date: date, departure_time: time, stops: [], checkpoints: [] };
  S.createStep = 1;
  dTab('create');
  toast(`Pre-filled route: ${from} → ${to}`, 'success');
}

// ─── DRIVER: SEND NOTIFICATION ───────────────────────────
async function openSendNotif(routeId) {
  const routes = S.myRoutes.length ? S.myRoutes : await api('GET', '/routes/driver/mine').catch(() => []);
  const activeRoute = routes[0];
  document.getElementById('send-notif-body').innerHTML = `
    <div class="form-group">
      <label class="form-label" style="color:var(--navy)">Route</label>
      <select class="form-input" style="color:var(--navy-dark);background:var(--gray-100)" id="notif-route">
        ${routes.map(r => `<option value="${r.id}" ${(routeId && r.id === routeId) || (!routeId && r === routes[0]) ? 'selected' : ''}>${String(r.route_number)} — ${String(r.from_city)} → ${String(r.to_city)}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label" style="color:var(--navy)">Notification Type</label>
      <select class="form-input" style="color:var(--navy-dark);background:var(--gray-100)" id="notif-type" onchange="updateNotifPreview()">
        <option value="eta">ETA Update — I am [X] away from next stop</option>
        <option value="delay">Running Late — Significant delay</option>
        <option value="depart">Departing — Leaving this stop now</option>
        <option value="custom">Custom message</option>
      </select>
    </div>
    <div id="notif-eta-wrap" class="form-group">
      <label class="form-label" style="color:var(--navy)">Time Away</label>
      <select class="form-input" style="color:var(--navy-dark);background:var(--gray-100)" id="notif-eta-time" onchange="updateNotifPreview()">
        ${['5 min','10 min','15 min','20 min','30 min','45 min','1 hour'].map(t => `<option>${t}</option>`).join('')}
      </select>
    </div>
    <div id="notif-custom-wrap" class="form-group" style="display:none">
      <label class="form-label" style="color:var(--navy)">Message</label>
      <textarea class="form-input" rows="3" style="color:var(--navy-dark);background:var(--gray-100);resize:vertical" id="notif-custom" placeholder="Custom message..." oninput="updateNotifPreview()"></textarea>
    </div>
    <div style="background:var(--gray-100);border-radius:10px;padding:14px;font-size:.85rem;color:var(--navy-dark);margin-bottom:16px;min-height:48px" id="notif-preview">Preview will appear here</div>
    <button class="btn btn-gold btn-full btn-lg" onclick="sendDriverNotif()">Send to All Passengers & Guardians</button>`;
  updateNotifPreview();
  openModal('modal-send-notif');
}

function updateNotifPreview() {
  const type = document.getElementById('notif-type')?.value;
  const etaWrap = document.getElementById('notif-eta-wrap');
  const customWrap = document.getElementById('notif-custom-wrap');
  const preview = document.getElementById('notif-preview');
  if (!type || !preview) return;
  if (etaWrap) etaWrap.style.display = type === 'eta' ? '' : 'none';
  if (customWrap) customWrap.style.display = type === 'custom' ? '' : 'none';
  const time = document.getElementById('notif-eta-time')?.value || '15 min';
  const msgs = {
    eta: `[Pin] Update: I am ${time} away from the next stop.`,
    delay: '[!] Heads up: We are running more than 5 minutes behind schedule. Updated ETA to follow.',
    depart: '[Bus] We are now departing from the current stop. See you at the next one!',
    custom: document.getElementById('notif-custom')?.value || '',
  };
  preview.textContent = msgs[type] || '';
}

async function sendDriverNotif() {
  const routeId = document.getElementById('notif-route')?.value;
  const type = document.getElementById('notif-type')?.value;
  const time = document.getElementById('notif-eta-time')?.value || '15 min';
  const msgs = {
    eta: `[Pin] Update: I am ${time} away from the next stop.`,
    delay: '[!] Heads up: We are running more than 5 minutes behind schedule.',
    depart: '[Bus] We are now departing from the current stop.',
    custom: document.getElementById('notif-custom')?.value || 'Update from your driver.',
  };
  const message = msgs[type];
  try {
    if (S.socket) {
      S.socket.emit('driver_broadcast', { routeId, message });
    } else {
      await api('POST', '/driver-notification', { route_id: routeId, message });
    }
    closeModal('modal-send-notif');
    toast('Notification sent!', 'success');
  } catch (e) { toast(e.message, 'error'); }
}

// ─── LOCATION SHARING ────────────────────────────────────
function startDriverLocationSharing() {
  if (S.locationInterval) { clearInterval(S.locationInterval); S.locationInterval = null; }
  if (!navigator.geolocation) return;
  S.locationInterval = setInterval(() => {
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude, longitude } = pos.coords;
      if (S.socket && S.chatRoute) {
        S.socket.emit('driver_location_update', { latitude, longitude, routeId: S.chatRoute });
      }
    }, () => {
      // Simulate movement if no real GPS (demo)
      const baseLat = 30.6280, baseLon = -96.3344;
      const lat = baseLat + (Math.random() - 0.5) * 0.01;
      const lon = baseLon + (Math.random() - 0.5) * 0.01;
      if (S.socket && S.chatRoute) {
        S.socket.emit('driver_location_update', { latitude: lat, longitude: lon, routeId: S.chatRoute });
      }
    });
  }, 10000);
}

function toggleLocationSharing() {
  const toggle = document.getElementById('loc-toggle');
  const badge = document.getElementById('loc-badge');
  if (toggle?.classList.contains('on')) {
    toggle.classList.remove('on');
    if (badge) { badge.innerHTML = 'Location Off'; badge.style.background = 'rgba(192,57,43,.1)'; badge.style.color = 'var(--error)'; badge.style.borderColor = 'rgba(192,57,43,.25)'; }
    clearInterval(S.locationInterval);
  } else {
    toggle?.classList.add('on');
    if (badge) { badge.innerHTML = '<div class="pulse-dot"></div>Live'; badge.style.background = ''; badge.style.color = ''; badge.style.borderColor = ''; }
    startDriverLocationSharing();
  }
}

// ─── REQUEST WIZARD ──────────────────────────────────────
function openRequestWizard() {
  S.reqStep = 1; S.reqData = {};
  showRequestStep();
}

function showRequestStep() {
  const steps = ['Departure', 'Arrival', 'Date', 'Time', 'Review'];
  let html = `<div class="page-header"><div><div class="page-title">Request a Route</div><div class="page-sub">Step ${S.reqStep} of 5</div></div></div>
  <div class="card" style="max-width:580px">
    <div class="steps-bar">${steps.map((s, i) => `<div class="step-i ${i + 1 < S.reqStep ? 'done' : i + 1 === S.reqStep ? 'current' : ''}"><div class="step-circle">${i + 1 < S.reqStep ? '✓' : i + 1}</div><span class="step-label">${s}</span></div>`).join('')}</div>`;

  if (S.reqStep === 1) html += `<div class="section-title">Where are you departing from?</div>
    <div style="position:relative"><input class="form-input" style="color:var(--navy-dark);background:var(--gray-100)" id="req-from" placeholder="Search city..." value="${S.reqData.from_city || ''}" oninput="autocityCreate(this,'req-from-dd')" onblur="validateCityInput('req-from','req-from-err')">
    <div class="city-dropdown" id="req-from-dd"></div>
    <div class="city-error" id="req-from-err" style="color:var(--error);font-size:.75rem;margin-top:4px;display:none">City not found — please select from the dropdown</div></div>
    <div style="display:flex;gap:10px;margin-top:16px"><button class="btn btn-sm" style="background:var(--gray-100);color:var(--error)" onclick="cancelRequest()">Cancel</button><button class="btn btn-gold" onclick="reqNext()">Next →</button></div>`;

  else if (S.reqStep === 2) html += `<div class="section-title">Where are you going?</div>
    <div style="position:relative"><input class="form-input" style="color:var(--navy-dark);background:var(--gray-100)" id="req-to" placeholder="Search city..." value="${S.reqData.to_city || ''}" oninput="autocityCreate(this,'req-to-dd')" onblur="validateCityInput('req-to','req-to-err')">
    <div class="city-dropdown" id="req-to-dd"></div>
    <div class="city-error" id="req-to-err" style="color:var(--error);font-size:.75rem;margin-top:4px;display:none">City not found — please select from the dropdown</div></div>
    <div style="display:flex;gap:10px;margin-top:16px"><button class="btn btn-sm" style="background:var(--gray-100);color:var(--error)" onclick="cancelRequest()">Cancel</button><button class="btn btn-sm" style="background:var(--gray-100);color:var(--navy)" onclick="reqBack()">← Back</button><button class="btn btn-gold" onclick="reqNext()">Next →</button></div>`;

  else if (S.reqStep === 3) html += `<div class="section-title">What date do you need this route?</div>
    <input class="form-input" type="date" style="color:var(--navy-dark);background:var(--gray-100)" id="req-date" value="${S.reqData.requested_date || ''}">
    <div style="display:flex;gap:10px;margin-top:16px"><button class="btn btn-sm" style="background:var(--gray-100);color:var(--error)" onclick="cancelRequest()">Cancel</button><button class="btn btn-sm" style="background:var(--gray-100);color:var(--navy)" onclick="reqBack()">← Back</button><button class="btn btn-gold" onclick="reqNext()">Next →</button></div>`;

  else if (S.reqStep === 4) html += `<div class="section-title">What time do you need to depart or arrive?</div>
    <div class="two-col">
      <div class="form-group"><label class="form-label" style="color:var(--navy)">Departure Time</label><input class="form-input" type="time" style="color:var(--navy-dark);background:var(--gray-100)" id="req-dep" value="${S.reqData.requested_time || '08:00'}" oninput="updateReqArrival()"></div>
      <div class="form-group"><label class="form-label" style="color:var(--navy)">Est. Arrival</label><input class="form-input" type="time" style="color:var(--navy-dark);background:var(--gray-100)" id="req-arr" value="${S.reqData.arrival_time || '11:30'}" oninput="updateReqDeparture()"></div>
    </div>
    <div class="text-xs text-muted">* Arrival and Departure auto-estimated from route distance</div>
    <div style="display:flex;gap:10px;margin-top:16px"><button class="btn btn-sm" style="background:var(--gray-100);color:var(--error)" onclick="cancelRequest()">Cancel</button><button class="btn btn-sm" style="background:var(--gray-100);color:var(--navy)" onclick="reqBack()">← Back</button><button class="btn btn-gold" onclick="reqNext()">Next →</button></div>`;

  else if (S.reqStep === 5) {
    const depTime = S.reqData.requested_time || 'Flexible';
    const arrTime = S.reqData.arrival_time || 'Flexible';
    function timeOfDay(t) {
      if (!t || t === 'Flexible') return '';
      const h = parseInt(t.split(':')[0]);
      if (h >= 5 && h < 12) return 'Morning';
      if (h >= 12 && h < 17) return 'Afternoon';
      if (h >= 17 && h < 21) return 'Evening';
      return 'Night';
    }
    html += `<div class="section-title">Review Your Request</div>
    <div style="background:var(--gray-100);border-radius:12px;padding:20px;margin-bottom:20px">
      <div style="font-family:'Playfair Display',serif;font-size:1.1rem;font-weight:700;color:var(--navy);margin-bottom:10px">${S.reqData.from_city || '?'} → ${S.reqData.to_city || '?'}</div>
      <div class="text-sm text-muted" style="margin-bottom:8px">${ICON.calendar()} ${S.reqData.requested_date || 'Flexible'}</div>
      <div style="display:flex;gap:20px">
        <div><div class="text-xs text-muted">DEPARTURE</div><div style="font-weight:600;color:var(--navy)">${depTime}${timeOfDay(depTime) ? ' ('+timeOfDay(depTime)+')' : ''}</div></div>
        <div><div class="text-xs text-muted">ARRIVAL</div><div style="font-weight:600;color:var(--navy)">${arrTime}${timeOfDay(arrTime) ? ' ('+timeOfDay(arrTime)+')' : ''}</div></div>
      </div>
    </div>
    <div style="display:flex;gap:10px"><button class="btn btn-sm" style="background:var(--gray-100);color:var(--error)" onclick="cancelRequest()">Cancel</button><button class="btn btn-sm" style="background:var(--gray-100);color:var(--navy)" onclick="reqBack()">← Edit</button>
    <button class="btn btn-gold btn-full btn-lg" id="post-req-btn" onclick="postRequest()">Post Request</button></div>`;
  }

  html += '</div>';
  document.getElementById('p-content').innerHTML = html;
}

function reqNext() {
  if (S.reqStep === 1) {
    S.reqData.from_city = document.getElementById('req-from')?.value;
    if (!validateCityInput('req-from', 'req-from-err')) return;
  }
  if (S.reqStep === 2) {
    S.reqData.to_city = document.getElementById('req-to')?.value;
    if (!validateCityInput('req-to', 'req-to-err')) return;
  }
  if (S.reqStep === 3) S.reqData.requested_date = document.getElementById('req-date')?.value;
  if (S.reqStep === 4) {
    S.reqData.requested_time = document.getElementById('req-dep')?.value;
    S.reqData.arrival_time = document.getElementById('req-arr')?.value;
  }
  S.reqStep = Math.min(5, S.reqStep + 1);
  showRequestStep();
}
function reqBack() {
  if (S.reqStep === 2) S.reqData.to_city = document.getElementById('req-to')?.value;
  if (S.reqStep === 3) S.reqData.requested_date = document.getElementById('req-date')?.value;
  if (S.reqStep === 4) {
    S.reqData.requested_time = document.getElementById('req-dep')?.value;
    S.reqData.arrival_time = document.getElementById('req-arr')?.value;
  }
  S.reqStep = Math.max(1, S.reqStep - 1); showRequestStep();
}

function cancelRequest() {
  if (confirm('Are you sure you want to cancel? Your progress will be lost.')) {
    S.reqStep = 1;
    S.reqData = {};
    pTab('routes');
  }
}
function updateReqArrival() {
  const dep = document.getElementById('req-dep')?.value;
  if (!dep) return;
  const from = S.reqData.from_city || document.getElementById('req-from')?.value;
  const to = S.reqData.to_city || document.getElementById('req-to')?.value;
  const travel = estimateTravelTime(from, to);
  const [h, m] = dep.split(':').map(Number);
  const totalMin = h * 60 + m + travel.minutes;
  const arr = new Date(2000, 0, 1, 0, totalMin);
  const el = document.getElementById('req-arr');
  if (el) el.value = `${String(arr.getHours()).padStart(2, '0')}:${String(arr.getMinutes()).padStart(2, '0')}`;
}

function updateReqDeparture() {
  const arr = document.getElementById('req-arr')?.value;
  if (!arr) return;
  const from = S.reqData.from_city || document.getElementById('req-from')?.value;
  const to = S.reqData.to_city || document.getElementById('req-to')?.value;
  const travel = estimateTravelTime(from, to);
  const [h, m] = arr.split(':').map(Number);
  const totalMin = h * 60 + m - travel.minutes;
  const dep = new Date(2000, 0, 1, 0, totalMin);
  const el = document.getElementById('req-dep');
  if (el) el.value = `${String(dep.getHours()).padStart(2, '0')}:${String(dep.getMinutes()).padStart(2, '0')}`;
}

async function postRequest() {
  const btn = document.getElementById('post-req-btn');
  btn.innerHTML = '<span class="spinner"></span>'; btn.disabled = true;
  try {
    await api('POST', '/requests', S.reqData);
    toast('Route request posted!', 'success');
    openModal('modal-req-ok');
    pTab('routes');
  } catch (e) { toast(e.message, 'error'); btn.innerHTML = 'Post Request'; btn.disabled = false; }
}

// ─── NOTIFICATIONS ────────────────────────────────────────
async function openNotifs() {
  try {
    const notifs = await api('GET', '/notifications');
    document.getElementById('notifs-body').innerHTML = notifs.length ? notifs.map(n => `
      <div style="display:flex;gap:12px;padding:12px 0;border-bottom:1px solid var(--gray-100)">
        <div style="width:36px;height:36px;border-radius:10px;background:var(--gray-100);display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0">${n.type === 'success' ? ICON.check() : n.type === 'alert' ? ICON.bus() : ICON.info()}</div>
        <div><div style="font-weight:600;font-size:.875rem;color:var(--navy)">${n.title}</div><div class="text-sm text-muted mt-4">${n.body}</div></div>
      </div>`).join('') : '<div class="text-sm text-muted" style="text-align:center;padding:20px">No notifications</div>';
    await api('PATCH', '/notifications/read-all');
    document.getElementById('notif-dot-p')?.style && (document.getElementById('notif-dot-p').style.display = 'none');
    document.getElementById('notif-dot-d')?.style && (document.getElementById('notif-dot-d').style.display = 'none');
    openModal('modal-notifs');
  } catch (e) { toast(e.message, 'error'); }
}

async function loadNotifDot() {
  try {
    const notifs = await api('GET', '/notifications');
    const unread = notifs.filter(n => !n.is_read).length;
    const dots = ['notif-dot-p', 'notif-dot-d'];
    dots.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = unread > 0 ? '' : 'none';
    });
  } catch { }
}

// ─── UTILITIES ────────────────────────────────────────────
function autocity(input, ddId) {
  const q = input.value.toLowerCase();
  const dd = document.getElementById(ddId);
  if (!dd || !q) { if (dd) dd.classList.remove('open'); return; }
  const matches = CITIES.filter(c => c.n.toLowerCase().includes(q) || c.z.includes(q)).slice(0, 6);
  if (!matches.length) { dd.classList.remove('open'); return; }
  dd.innerHTML = matches.map(c => `<div class="city-item" onclick="selectCity('${input.id}','${ddId}','${c.n}, ${c.s}')"><span>${c.n}, ${c.s}</span><span class="city-zip">${c.z}</span></div>`).join('');
  dd.classList.add('open');
}

function autocityCreate(input, ddId) {
  const q = input.value.toLowerCase();
  const dd = document.getElementById(ddId);
  if (!dd) return;
  if (!q) { dd.classList.remove('open'); return; }
  const matches = CITIES.filter(c => c.n.toLowerCase().includes(q)).slice(0, 6);
  dd.innerHTML = matches.map(c => `<div class="city-item" onclick="selectCity('${input.id}','${ddId}','${c.n}, ${c.s}')"><span>${c.n}, ${c.s}</span><span class="city-zip">${c.z}</span></div>`).join('');
  dd.classList.add('open');
}

function selectCity(inputId, ddId, val) {
  const input = document.getElementById(inputId);
  const dd = document.getElementById(ddId);
  if (input) input.value = val;
  if (dd) dd.classList.remove('open');
  const err = document.getElementById(inputId + '-err');
  if (err) { err.style.display = 'none'; if (input) input.style.borderColor = ''; }
}

function stripState(v) { return v.replace(/, ?[A-Za-z]{2}$/, '').trim(); }

function validateCityInput(inputId, errorId) {
  const input = document.getElementById(inputId);
  const err = document.getElementById(errorId);
  if (!input || !err) return;
  if (!input.value.trim() || isValidCity(input.value)) {
    err.style.display = 'none';
    input.style.borderColor = '';
    return true;
  } else {
    err.style.display = 'block';
    input.style.borderColor = 'var(--error)';
    return false;
  }
}

function landingSearch() {
  const from = document.getElementById('land-from').value;
  const to = document.getElementById('land-to').value;
  const date = document.getElementById('land-date').value;
  sessionStorage.setItem('landFrom', stripState(from));
  sessionStorage.setItem('landTo', stripState(to));
  sessionStorage.setItem('landDate', date);
  if (!S.token) { showScreen('screen-login'); toast('Sign in to book rides', 'info'); return; }
  pTab('routes');
}

function switchTab(el, showId, hideId) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  document.getElementById(showId)?.classList.add('active');
  document.getElementById(hideId)?.classList.remove('active');
}

function openModal(id) { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }

function toast(msg, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span style="font-weight:700">${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span><span>${msg}</span>`;
  document.getElementById('toastContainer').appendChild(el);
  setTimeout(() => el.classList.add('show'), 40);
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 400); }, 3800);
}

function emptyState(msg) {
  return `<div style="text-align:center;padding:60px 24px;color:var(--gray-400)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48" style="margin:0 auto 16px;display:block;opacity:.3"><rect x="1" y="3" width="22" height="14" rx="2"/><path d="M1 10h22M8 17v2M16 17v2"/></svg><p style="font-size:.9rem">${msg}</p></div>`;
}

// ─── QR TICKET RENDERING ────────────────────────────────
let currentTicketToken = null;

async function renderTicketQR(bookingId) {
  try {
    const data = await api('GET', `/bookings/${bookingId}/ticket`);
    currentTicketToken = data.ticket_token;
    
    let qrContainer = document.getElementById('ticket-qr-canvas');
    if (!qrContainer) {
      qrContainer = document.createElement('div');
      qrContainer.id = 'ticket-qr-canvas';
      document.getElementById('modal-ticket-body').appendChild(qrContainer);
    }

    qrContainer.innerHTML = '';

    const qrDiv = document.createElement('div');
    qrDiv.style.cssText = 'display:flex;flex-direction:column;align-items:center;padding:16px;background:white;border-radius:12px;margin:16px 0;';
    qrDiv.id = 'qr-code-container';
    qrContainer.appendChild(qrDiv);

    if (typeof QRCode !== 'undefined' && data.ticket_token) {
      const qrInner = document.createElement('div');
      qrDiv.appendChild(qrInner);
      try {
        new QRCode(qrInner, { text:data.ticket_token, width:200, height:200, colorDark:'#1a1a2e', colorLight:'#ffffff', correctLevel:QRCode.CorrectLevel.H });
      } catch (e) {
        console.error('QR generation error:', e);
      }
    }

    const info = document.createElement('div');
    info.style.cssText = 'text-align:center;margin-top:12px;font-size:13px;color:#444;';
    info.innerHTML = `
      <div style="font-weight:700;font-size:15px;margin-bottom:4px;">
        ${data.origin} → ${data.destination}
      </div>
      <div>Seat ${data.seat_number} · ${new Date(data.departure_date).toLocaleDateString()}</div>
      <div style="margin-top:8px;font-family:monospace;font-size:11px;color:#888;">
        ${data.ticket_token}
      </div>
      ${data.checked_in
        ? '<div style="color:#22c55e;font-weight:600;margin-top:8px;">✓ Checked In</div>'
        : '<div style="color:#f59e0b;margin-top:8px;">Show this to your driver</div>'
      }
    `;
    qrContainer.appendChild(info);
  } catch (e) {
    console.error('Error loading ticket:', e);
  }
}

// ─── DRIVER QR CHECK-IN ────────────────────────────────
let html5QrScanner = null;
let checkinListenersAttached = false;

function initCheckinScanner() {
  const scannerSection = document.getElementById('checkin-scanner-section');
  if (!scannerSection) return;

  if (!document.getElementById('qr-reader')) {
    scannerSection.innerHTML = `
      <div style="max-width:420px;margin:0 auto;">
        <h3 style="margin-bottom:12px;">Scan Passenger Ticket</h3>
        <div id="qr-reader" style="width:100%;border-radius:12px;overflow:hidden;"></div>
        <div style="margin:16px 0;text-align:center;color:#888;font-size:13px;">
          — or enter code manually —
        </div>
        <div style="display:flex;gap:8px;">
          <input
            id="manual-token-input"
            type="text"
            placeholder="Paste ticket code (tk_...)"
            style="flex:1;padding:10px 14px;border:1.5px solid #ddd;border-radius:8px;font-size:14px;font-family:monospace;"
          />
          <button
            id="manual-checkin-btn"
            style="padding:10px 18px;background:#1a1a2e;color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px;"
          >
            Check In
          </button>
        </div>
        <div id="checkin-result" style="margin-top:16px;display:none;padding:14px 16px;border-radius:10px;font-size:15px;"></div>
      </div>
    `;
  }

  if (!html5QrScanner) {
    html5QrScanner = new Html5QrcodeScanner('qr-reader', {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      rememberLastUsedCamera: true
    });

    html5QrScanner.render(
      (decodedText) => processCheckin(decodedText),
      (error) => {}
    );
  }

  if (!checkinListenersAttached) {
    document.getElementById('manual-checkin-btn').addEventListener('click', () => {
      const val = document.getElementById('manual-token-input').value.trim();
      if (val) processCheckin(val);
    });
    document.getElementById('manual-token-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = e.target.value.trim();
        if (val) processCheckin(val);
      }
    });
    checkinListenersAttached = true;
  }
}

function stopCheckinScanner() {
  if (html5QrScanner) {
    html5QrScanner.clear().catch(() => {});
    html5QrScanner = null;
  }
  checkinListenersAttached = false;
}

async function processCheckin(token) {
  const resultEl = document.getElementById('checkin-result');

  resultEl.style.display = 'block';
  resultEl.style.background = '#f3f4f6';
  resultEl.style.color = '#374151';
  resultEl.textContent = 'Verifying...';

  try {
    const opts = { method: 'POST', headers: { 'Content-Type': 'application/json' } };
    if (S.token) opts.headers['Authorization'] = `Bearer ${S.token}`;
    opts.body = JSON.stringify({ token });
    const res = await fetch('/api/bookings/checkin', opts);
    const data = await res.json();
    
    if (res.ok && data.success) {
      resultEl.style.background = '#dcfce7';
      resultEl.style.color = '#166534';
      resultEl.innerHTML = `
        <strong>✓ Checked In</strong><br>
        ${data.passenger} · Seat ${data.seat}<br>
        <span style="font-size:13px;opacity:0.8;">${data.route}</span>
      `;
      const input = document.getElementById('manual-token-input');
      if (input) input.value = '';
      updateCheckinManifest(data.passenger, data.seat);
    } else if (res.status === 409) {
      resultEl.style.background = '#fef9c3';
      resultEl.style.color = '#854d0e';
      resultEl.innerHTML = `<strong>⚠ Already Checked In</strong><br>This passenger has already boarded.`;
    } else {
      resultEl.style.background = '#fee2e2';
      resultEl.style.color = '#991b1b';
      resultEl.textContent = `✗ ${data.error || 'Check-in failed'}`;
    }
  } catch (err) {
    resultEl.style.background = '#fee2e2';
    resultEl.style.color = '#991b1b';
    resultEl.textContent = '✗ Network error, try again';
  }

  setTimeout(() => {
    if (resultEl) resultEl.style.display = 'none';
  }, 5000);
}

function updateCheckinManifest(passengerName, seat) {
  if (!passengerName) return;
  S.manifest = S.manifest.map(p => {
    const fullName = `${p.first_name} ${p.last_name}`;
    if (fullName === passengerName && p.checkin_status !== 'checked') {
      p.checkin_status = 'checked';
      setTimeout(() => updateCheckinRow(p.id, passengerName, seat), 100);
    }
    return p;
  });
}

// ─── DRIVER LIVE LOCATION BROADCAST ───────────────────
let locationWatchId = null;
let isLiveBroadcasting = false;

function initDriverLiveTab(routeId) {
  const liveSection = document.getElementById('driver-live-section');
  if (!liveSection) return;

  liveSection.innerHTML = `
    <div style="max-width:480px;margin:0 auto;text-align:center;">
      <h3 style="margin-bottom:8px;">Live Tracking</h3>
      <p style="color:#6b7280;font-size:14px;margin-bottom:20px;">
        Share your real-time location with passengers on this route.
      </p>
      <button
        id="toggle-live-btn"
        style="padding:14px 32px;font-size:16px;font-weight:600;background:#22c55e;color:white;border:none;border-radius:10px;cursor:pointer;transition:background 0.2s;"
      >
        ▶ Go Live
      </button>
      <div id="location-warning"
           style="display:none;margin-top:12px;padding:10px;background:#fef9c3;border-radius:8px;font-size:13px;color:#854d0e;">
      </div>
      <div id="live-status"
           style="margin-top:16px;font-size:13px;color:#6b7280;">
        Not broadcasting
      </div>
    </div>
  `;

  document.getElementById('toggle-live-btn').addEventListener('click', () => {
    if (isLiveBroadcasting) {
      stopLocationBroadcast(routeId);
      document.getElementById('live-status').textContent = 'Not broadcasting';
    } else {
      startLocationBroadcast(routeId);
      document.getElementById('live-status').textContent = 'Broadcasting your location…';
    }
  });
}

function startLocationBroadcast(routeId) {
  if (!navigator.geolocation) {
    alert('Geolocation is not supported on this device.');
    return;
  }
  if (!S.socket) return;
  if (locationWatchId !== null) {
    navigator.geolocation.clearWatch(locationWatchId);
    locationWatchId = null;
  }

  S.socket.emit('location:start', { routeId });
  isLiveBroadcasting = true;
  updateLiveBtnState(true);

  locationWatchId = navigator.geolocation.watchPosition(
    (pos) => {
      S.socket.emit('location:update', {
        routeId,
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        speed: pos.coords.speed,
        heading: pos.coords.heading
      });
    },
    (err) => {
      console.warn('Geolocation error:', err.message);
      const warn = document.getElementById('location-warning');
      if (warn) {
        warn.textContent = 'Location error: ' + err.message;
        warn.style.display = 'block';
      }
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
  );
}

function stopLocationBroadcast(routeId) {
  if (locationWatchId !== null) {
    navigator.geolocation.clearWatch(locationWatchId);
    locationWatchId = null;
  }
  if (isLiveBroadcasting && S.socket) {
    S.socket.emit('location:stop', { routeId });
    isLiveBroadcasting = false;
  }
  updateLiveBtnState(false);
}

function updateLiveBtnState(active) {
  const btn = document.getElementById('toggle-live-btn');
  if (!btn) return;
  btn.textContent = active ? '⏹ Stop Broadcasting' : '▶ Go Live';
  btn.style.background = active ? '#ef4444' : '#22c55e';
}

// ─── PASSENGER LIVE MAP ────────────────────────────────
let passengerMap = null;
let driverMarker = null;
let activeWatchRouteId = null;

function initPassengerLiveMap(routeId) {
  activeWatchRouteId = routeId;

  const liveSection = document.getElementById('passenger-live-section');
  if (!liveSection) return;

  liveSection.innerHTML = `
    <div style="position:relative;">
      <div id="passenger-map"
           style="width:100%;height:340px;border-radius:14px;overflow:hidden;border:1.5px solid #e5e7eb;">
      </div>
      <div id="map-status"
           style="position:absolute;top:12px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.65);color:white;padding:6px 14px;border-radius:20px;font-size:12px;backdrop-filter:blur(4px);pointer-events:none;">
        Waiting for driver location…
      </div>
    </div>
  `;

  passengerMap = L.map('passenger-map', { zoomControl: true }).setView([30.6, -96.3], 12);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(passengerMap);

  const busIcon = L.divIcon({
    html: `<div style="
      width:36px;height:36px;background:#1a1a2e;border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-size:18px;box-shadow:0 2px 8px rgba(0,0,0,0.35);
      border:2px solid white;
    ">🚌</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    className: ''
  });

  driverMarker = L.marker([30.6, -96.3], { icon: busIcon })
    .addTo(passengerMap)
    .bindPopup('Driver location');
  driverMarker.setOpacity(0);

  if (S.socket) {
    S.socket.emit('route:watch', { routeId });

    S.socket.on('location:broadcast', ({ lat, lng, timestamp }) => {
      const pos = [lat, lng];
      driverMarker.setLatLng(pos);
      driverMarker.setOpacity(1);
      passengerMap.panTo(pos, { animate: true, duration: 0.8 });

      const statusEl = document.getElementById('map-status');
      if (statusEl) {
        const ago = Math.round((Date.now() - timestamp) / 1000);
        statusEl.textContent = `Live · Updated ${ago}s ago`;
        statusEl.style.background = 'rgba(34, 197, 94, 0.85)';
      }
    });

    S.socket.on('driver:online', () => {
      const statusEl = document.getElementById('map-status');
      if (statusEl) statusEl.textContent = 'Driver is live…';
    });

    S.socket.on('driver:offline', () => {
      const statusEl = document.getElementById('map-status');
      if (statusEl) {
        statusEl.textContent = 'Driver ended the trip';
        statusEl.style.background = 'rgba(0,0,0,0.65)';
      }
      driverMarker.setOpacity(0.4);
    });
  }
}

function destroyPassengerMap() {
  if (activeWatchRouteId && S.socket) {
    S.socket.emit('route:unwatch', { routeId: activeWatchRouteId });
    S.socket.off('location:broadcast');
    S.socket.off('driver:online');
    S.socket.off('driver:offline');
    activeWatchRouteId = null;
  }
  if (passengerMap) {
    passengerMap.remove();
    passengerMap = null;
    driverMarker = null;
  }
}

function showHelp(type) {
  const content = {
    checkpoint: { title: 'Checkpoint Notifications', body: 'When the bus passes through a checkpoint city, DormToHome automatically sends a notification to your linked guardians. Checkpoints are intermediate cities the bus travels through but does not stop at. This gives family members real-time awareness of your journey without requiring stops.' },
    foryou: { title: 'For You — Personalized Sorting', body: 'This feature analyzes your booking history to identify your most frequent routes, preferred departure times, and common destinations. It re-sorts available routes to show the most relevant options first, saving you time.' },
  };
  const c = content[type];
  if (!c) return;
  document.getElementById('help-title').textContent = c.title;
  document.getElementById('help-body').textContent = c.body;
  openModal('modal-help');
}

// Close modals on overlay click
document.querySelectorAll('.modal-overlay').forEach(o => {
  o.addEventListener('click', e => { if (e.target === o) o.classList.remove('open'); });
});

// Close city dropdowns on outside click
document.addEventListener('click', e => {
  if (!e.target.closest('[oninput*="autocity"]') && !e.target.closest('.city-dropdown')) {
    document.querySelectorAll('.city-dropdown.open').forEach(d => d.classList.remove('open'));
  }
});

// ─── AUTO LOGIN ───────────────────────────────────────────
(async function autoLogin() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('verified') === 'true') {
    toast('Email verified! You can now sign in.', 'success');
    history.replaceState({}, '', '/');
  }
  
  const saved = localStorage.getItem('dth_token');
  if (!saved) return;
  try {
    const res = await fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${saved}` } });
    if (!res.ok) throw new Error();
    const user = await res.json();
    S.token = saved; S.user = user;
    connectSocket();
    if (user.role === 'passenger') {
      setAvatarInitials('p-avatar', user);
      showScreen('screen-passenger');
      pTab('routes');
    } else {
      setAvatarInitials('d-avatar', user);
      showScreen('screen-driver');
      dTab('dashboard');
    }
    loadNotifDot();
  } catch { localStorage.removeItem('dth_token'); }
})();
