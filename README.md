# CEMS — Caraga State University Event Management System

## Project Structure

```
cems/
├── index.html          ← Page structure (no inline CSS or JS)
├── styles.css          ← All CSS styles
├── app.js              ← Phase 1: localStorage version (fully working)
├── app-with-db.js      ← Phase 2: API/database version (data layer only)
├── assets/             ← Images, icons (empty by default)
│
└── backend/
    ├── server.js       ← Express entry point
    ├── package.json    ← Node.js dependencies
    ├── database.js     ← SQLite schema + connection
    ├── cems.db         ← Created automatically on first run
    └── routes/
        ├── auth.js
        ├── events.js
        ├── users.js
        ├── registrations.js
        ├── feedbacks.js
        ├── announcements.js
        ├── organizations.js
        ├── attendance.js
        ├── certificates.js
        └── migrate.js
```

---

## PHASE 1 — localStorage Version (no backend needed)

### Run locally
Just open `index.html` in a browser. No server required.

```bash
# Option A: open directly
open index.html

# Option B: use a local dev server (avoids CORS on file:// URLs)
npx serve .
# or
python3 -m http.server 8080
```

The app runs entirely in the browser. Data is saved to `localStorage` under the key `cems_csu_v1`.

### Deploy to Netlify / Vercel / GitHub Pages (free, 1-click)

**Netlify Drop:**
1. Go to https://app.netlify.com/drop
2. Drag the entire `cems/` folder (not the backend subfolder) onto the page
3. Done — live URL in seconds

**Vercel:**
```bash
npm i -g vercel
cd cems
vercel
```
Answer the prompts; choose "No framework". The three files (`index.html`, `styles.css`, `app.js`) are all that's needed.

**GitHub Pages:**
1. Push only `index.html`, `styles.css`, `app.js`, and `assets/` to a GitHub repo
2. Settings → Pages → Deploy from branch `main` / root
3. Done

---

## PHASE 2 — SQLite Backend Version

### Prerequisites
- Node.js 18+ (`node --version`)
- npm

### Install dependencies
```bash
cd cems/backend
npm install
```

### Start the backend
```bash
npm start
# or for auto-reload during development:
npm run dev
```

The server starts at **http://localhost:3000**.
- Frontend is served from `http://localhost:3000/`
- API lives at `http://localhost:3000/api/`
- SQLite database is created at `backend/cems.db` on first run

### Switch from localStorage to database

In `index.html`, change the script tag at the bottom:

```html
<!-- Phase 1 (localStorage) -->
<script src="app.js"></script>

<!-- Phase 2 (database) — comment out app.js, add both: -->
<!-- <script src="app.js"></script> -->
<script src="app.js"></script>        <!-- keep UI/render functions -->
<script src="app-with-db.js"></script> <!-- overrides data layer -->
```

> `app-with-db.js` overrides `saveDB`, `loadDB`, `submitAuth`, `logout`,
> `toggleFollow`, `likePost`, `addComment`, `deleteOrgPost`, `adminApprove`,
> `adminReject`, `toggleFeatured`, `setUserRole`, and `init`.
> All rendering functions remain in `app.js` and are unchanged.

---

## Migrating existing localStorage data to SQLite

If you've been using the app in localStorage mode and want to keep your data:

1. Open the app in your browser (localStorage version)
2. Open DevTools → Console
3. Run:
```javascript
migrateLocalStorageToServer()
```
This function is defined in `app-with-db.js`. It reads your `cems_csu_v1` localStorage key and POSTs it to `POST /api/migrate`, which bulk-upserts everything into SQLite.

You can also migrate manually:
```bash
# 1. Export from browser console:
copy(localStorage.getItem('cems_csu_v1'))

# 2. Save to a file: dump.json

# 3. POST to the migrate endpoint:
curl -X POST http://localhost:3000/api/migrate \
  -H "Content-Type: application/json" \
  -d "{\"dump\": $(cat dump.json | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')}"
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | `{ email, password }` → `{ user }` |
| POST | `/api/auth/signup` | `{ name, email, password, dept, sid }` → `{ user }` |
| GET | `/api/events` | All events (add `?status=approved` to filter) |
| POST | `/api/events` | Create event |
| PUT | `/api/events/:id` | Update event (partial fields OK) |
| DELETE | `/api/events/:id` | Delete event |
| GET | `/api/users` | All users (passwords stripped) |
| PUT | `/api/users/:id` | Update user profile or role |
| GET | `/api/registrations` | All regs (filter: `?userId=` `?eventId=`) |
| POST | `/api/registrations` | `{ userId, eventId }` → registration |
| DELETE | `/api/registrations/:id` | Cancel registration |
| GET | `/api/feedbacks` | All feedback (filter: `?eventId=`) |
| POST | `/api/feedbacks` | Submit feedback |
| GET | `/api/announcements` | All announcements |
| POST | `/api/announcements` | `{ text }` → announcement |
| DELETE | `/api/announcements/:id` | Delete announcement |
| GET | `/api/organizations` | All organizations |
| POST | `/api/organizations` | Create organization |
| PUT | `/api/organizations/:id` | Update organization |
| DELETE | `/api/organizations/:id` | Delete organization |
| GET | `/api/organizations/:id/posts` | Posts for one org |
| POST | `/api/organizations/:id/posts` | Create post |
| PUT | `/api/organizations/posts/:id` | Update post (likes, comments, content) |
| DELETE | `/api/organizations/posts/:id` | Delete post |
| GET | `/api/organizations/follows/all` | All follow relationships |
| POST | `/api/organizations/follows` | Toggle follow (returns `{ following: bool }`) |
| POST | `/api/attendance/checkin` | `{ eventId, userId }` → check-in |
| POST | `/api/certificates` | `{ eventId, userId }` → issue certificate |
| POST | `/api/migrate` | `{ dump: <JSON string> }` → import localStorage dump |
| GET | `/api/health` | Health check |

---

## Deploy Phase 2 to Free Hosting

### Option A: Render.com (easiest free Node.js hosting)

1. Push your code to GitHub (include the `backend/` folder)
2. Go to https://render.com → New → Web Service
3. Connect your repo
4. Settings:
   - **Root directory:** `cems/backend`
   - **Build command:** `npm install`
   - **Start command:** `npm start`
   - **Environment:** Node
5. Add environment variable: `PORT=10000` (Render sets this automatically)
6. Click Deploy

> Note: Render's free tier has ephemeral storage — the SQLite `.db` file resets on restart.
> For persistence on Render free tier, use **Render Disk** (paid) or switch to Supabase (see below).

### Option B: Railway.app

```bash
npm install -g @railway/cli
cd cems/backend
railway login
railway init
railway up
```

Railway provides persistent disk storage on all plans including free tier.

### Option C: Vercel (frontend) + Supabase (PostgreSQL database)

For production-grade persistence, swap SQLite for Supabase (free tier: 500MB).

1. Create a project at https://supabase.com
2. Copy the SQL schema from `database.js` into Supabase's SQL editor and run it
3. Replace `better-sqlite3` in `database.js` with the `pg` package:

```javascript
// backend/database.js (Supabase/PostgreSQL version)
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
module.exports = { db: pool };
```

4. Set `DATABASE_URL` in your environment to your Supabase connection string
5. Deploy the frontend to Vercel, backend to Railway or Render

---

## Demo Accounts (seeded automatically)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@carsu.edu.ph | password |
| Organizer | organizer@carsu.edu.ph | password |
| Student | student@carsu.edu.ph | password |
| Student | anna@carsu.edu.ph | password |

> In database mode, passwords are stored as plain text for demo purposes.
> For production, replace with `bcrypt` hashing in `backend/routes/auth.js`.

---

## Development Tips

```bash
# Watch for frontend changes (auto-reload)
cd cems
npx live-server

# Watch for backend changes
cd cems/backend
npm run dev   # uses nodemon

# Inspect the SQLite database
npx sqlite3 backend/cems.db
.tables
SELECT * FROM events;
.quit

# Reset the database (delete and restart)
rm backend/cems.db
npm start   # schema re-created automatically
```
