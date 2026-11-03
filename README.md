# PresyoSerbisyo

A commodity price monitoring and decision-support system for the **Department of Trade and Industry (DTI) Catanduanes**.

Field officers record store prices on site. The system checks each price against the official **Suggested Retail Price (SRP)** and flags anything priced above it. The public can look up current prices without an account.

---

## What it does

**For the public (no account needed)**
- **Commodity list**: current SRPs and the price range seen across monitored stores, with a compliance status for each item. An item is marked non-compliant if *any* store prices it above SRP.
- **Price analysis**: price trend charts and ARIMA-based price forecasts.
- **Report a concern**: guidance for consumers, with a link to DTI Consumer Care on [dti.gov.ph](https://www.dti.gov.ph).

**For monitoring officers**
- Register stores and record the prices observed at each visit.
- Each price is classified automatically against the SRP in effect on that date.
- Manage the commodity catalog, categories and SRP values.
- View compliance status and price trends.

**For administrators**
- Dashboard of market pricing status across all officers and stores.
- Generate official monitoring reports (PDF / Excel) and download them later.
- Manage user accounts (admin and officer roles, active/inactive).
- Review the audit log of changes.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Chart.js |
| Backend | Node.js, Express 4, TypeScript, Zod |
| Database | PostgreSQL via Prisma 7 |
| Auth | JWT in an httpOnly cookie; the Next.js server converts it to a Bearer header, so the token never reaches browser JavaScript |
| Reports | PDFKit (PDF), ExcelJS (Excel). Report files are stored in Postgres |
| Forecasting | ARIMA (`arima` package) |

---

## Project structure

```
price-service-v2/
├── backend/            Express API
│   ├── prisma/         Schema, migrations, seed data
│   ├── scripts/        Admin-user creation script
│   └── src/modules/    One folder per domain (auth, commodity, srp, store,
│                       price-record, report, forecast, dashboard, public, …)
├── frontend/           Next.js app
│   └── src/
│       ├── app/        Routes: (public), (auth)/login, (protected)/admin, (protected)/officer
│       ├── features/   Domain UI and services
│       └── shared/     Shared components, hooks and utilities
├── docs/               Entity-relationship diagram (PNG / PDF)
├── context/            Design and planning documents
└── render.yaml         Render deployment blueprint for the backend
```

---

## Getting started

### Prerequisites

- Node.js 20 or later
- A PostgreSQL database (local or hosted, e.g. Neon)

### 1. Clone and install

```bash
git clone https://github.com/Vyrnyl/price-service-v2.git
cd price-service-v2

cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure environment variables

Copy the example files and fill them in:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

**`backend/.env`**

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret used to sign login tokens. Use a long random string |
| `PORT` | API port (default `5000`) |
| `CORS_ORIGIN` | Frontend URL allowed to call the API (e.g. `http://localhost:3000`) |

**`frontend/.env.local`**

| Variable | Description |
|---|---|
| `JWT_SECRET` | Must be the **same value** as the backend's |
| `NEXT_PUBLIC_API_BASE_URL` | Backend URL (e.g. `http://localhost:5000`) |
| `NEXT_PUBLIC_SHOW_DEMO_LOGIN` | Optional. `true` shows the demo-login buttons on a production build |

Never commit `.env` files. They are already gitignored.

### 3. Set up the database

> **Warning:** these commands write to whatever database `DATABASE_URL` points at. Use a database you're allowed to change.

```bash
cd backend
npx prisma generate
npx prisma migrate deploy
```

Then create your first admin account:

```bash
npm run create:admin -- --email you@example.com --password "<strong password>" --name "Your Name" --role ADMIN
```

If you want sample data, `npm run seed` loads demo commodities, SRPs, stores and price records along with a demo admin and officer account (see [backend/prisma/seed.ts](backend/prisma/seed.ts)). Use it only on a development database, and change the demo passwords before anyone else can reach the app.

### 4. Run it

In two terminals:

```bash
# Terminal 1: API on http://localhost:5000
cd backend
npm run dev

# Terminal 2: web app on http://localhost:3000
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Public pages work right away. Sign in at `/login` to reach the admin or officer workspace.

---

## Useful scripts

**Backend** (`cd backend`)

| Command | What it does |
|---|---|
| `npm run dev` | Start the API with hot reload |
| `npm run build` / `npm start` | Compile and run the production build |
| `npm test` | Run the test suite |
| `npm run lint` | Lint the code |
| `npm run prisma:studio` | Browse the database in Prisma Studio |
| `npm run create:admin` | Create an admin or officer account (`--help` for options) |
| `npm run seed` | Load demo data (development databases only) |

**Frontend** (`cd frontend`)

| Command | What it does |
|---|---|
| `npm run dev` | Start the web app in development mode |
| `npm run build` / `npm start` | Build and serve the production app |
| `npm run lint` | Lint the code |

---

## API overview

The backend serves a versioned REST API under `/api/v1`:

- `/api/v1/public/*`: unauthenticated, read-only data for the public pages
- `/api/v1/auth/*`: login, session and logout
- Everything else under `/api/v1` (`commodities`, `categories`, `srps`, `stores`, `price-records`, `reports`, `forecasts`, `dashboard`, `users`, `audit-logs`) requires a signed-in user and is restricted by role. Officers can only see and change their own price records.
- `/health`: health check

In the browser, the frontend calls `/api/*` on its own origin. A Next.js route handler forwards those calls to the backend and attaches the auth token.

---

## Deployment

[render.yaml](render.yaml) is a [Render](https://render.com) blueprint for the backend. It builds the API, runs `prisma migrate deploy` on start, and checks `/health`. Set `DATABASE_URL` and `CORS_ORIGIN` in the Render dashboard. `JWT_SECRET` is generated automatically; give the frontend the same value.

The frontend is a standard Next.js app and can be deployed to any host that supports Next.js (e.g. Vercel). Set its environment variables as described above.

---

## Documentation

- [docs/PresyoSerbisyo-ERD.png](docs/PresyoSerbisyo-ERD.png): database entity-relationship diagram
- [context/project-overview.md](context/project-overview.md): scope, roles and modules
- [context/architecture.md](context/architecture.md): module structure, data flow and access control
- [context/database-design.md](context/database-design.md): schema and indexes
