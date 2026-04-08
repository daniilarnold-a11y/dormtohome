# 🚌 DormToHome

Premium student bus booking platform — passengers book seats, drivers manage routes, everyone stays connected with real-time chat and live tracking.

## Deploy in 2 minutes

### Option A — Render.com (recommended, free tier)

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → **New Web Service** → connect your repo
3. Render auto-detects `render.yaml` and configures everything
4. Set one environment variable: `JWT_SECRET` → click **Generate** for a secure random value
5. Click **Deploy** ✓

> Data persists on a 1 GB disk at `/data/dormtohome.db`

---

### Option B — Railway

1. Push this repo to GitHub
2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
3. Add these environment variables in the Railway dashboard:
   ```
   JWT_SECRET=<generate a long random string>
   DB_PATH=/data/dormtohome.db
   NODE_ENV=production
   ```
4. Add a **Volume** mounted at `/data`
5. Deploy ✓

---

### Option C — Docker (any VPS / cloud)

```bash
# Build
docker build -t dormtohome .

# Run with a named volume so the database persists across restarts
docker run -d \
  -p 3000:3000 \
  -v dormtohome-data:/data \
  -e JWT_SECRET="$(openssl rand -hex 32)" \
  -e NODE_ENV=production \
  --name dormtohome \
  dormtohome
```

---

### Option D — Run locally

```bash
# 1. Install dependencies
npm install

# 2. Create your .env file
cp .env.example .env
# Edit .env — at minimum change JWT_SECRET

# 3. Start
npm start
# → http://localhost:3000
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `JWT_SECRET` | **Yes** | *(insecure default)* | Secret key for signing auth tokens. Generate with `openssl rand -hex 32` |
| `PORT` | No | `3000` | HTTP port |
| `NODE_ENV` | No | `development` | Set to `production` on live servers |
| `DB_PATH` | No | `./data/dormtohome.db` | Path to the SQLite database file |

> ⚠️ Always set `JWT_SECRET` in production. The app warns at startup if you forget.

---

## Demo Accounts

Password for all demo accounts: **`password123`**

| Role | Email |
|---|---|
| Passenger | alex@tamu.edu |
| Driver | marcus@dormtohome.com |

---

## Tech Stack

- **Backend** — Node.js, Express, Socket.io
- **Database** — SQLite via sql.js (file-persisted, zero native deps)
- **Auth** — JWT (jsonwebtoken + bcryptjs)
- **Frontend** — Vanilla HTML/CSS/JS, Socket.io client

## Project Structure

```
dormtohome/
├── server.js              ← Express + Socket.io entry point
├── db/database.js         ← SQLite schema, seed data, file persistence
├── middleware/auth.js     ← JWT auth middleware
├── routes/
│   ├── auth.js            ← POST /api/auth/login|register, GET/PUT /api/auth/me
│   ├── routes.js          ← Bus routes CRUD + stops + manifest
│   └── api.js             ← Bookings, messages, requests, guardians, analytics
├── public/
│   ├── index.html         ← Full UI (landing, auth, passenger, driver screens)
│   └── app.js             ← Frontend logic, API calls, Socket.io client
├── Dockerfile
├── render.yaml            ← One-click Render deploy config
├── railway.toml           ← Railway deploy config
└── .env.example
```
