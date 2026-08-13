# Progress Tracker

> **Living document. Single source of truth for what is actually built.**
> Update this file at the end of every work session and every time a Feature Loop step is completed.
> The plan of *what to build* lives in [build-plan.md](build-plan.md); this file records *what is done*.

**Last updated:** 2026-08-13 · **Current phase:** R0 (not started) · **Current feature:** —

> **Context.** PresyoSerbisyo was built before these standards existed. The nine product modules below are recorded **retroactively** — they work, but none has been verified against the Definition of Done ([build-plan.md](build-plan.md) §3), which is why most sit at ◕ rather than ●. The refactor phases R0–R3 close that gap.
>
> **Two blockers are live defects, not tidiness items.** See B-1 and B-2.

---

## Status Legend

| Symbol | Status | Meaning |
|---|---|---|
| ☐ | Not started | No work begun |
| ◔ | UI + Mock | Full page built with mock data (Loop step 1) |
| ◑ | Visually verified | Human sign-off on look/responsive/states (Loop step 2) — **gate passed** |
| ◕ | Read wired | Real data renders on screen (Loop steps 3–4) |
| ● | Done | Writes wired, validated, RBAC, tested — meets Definition of Done (Loop steps 5–6) |
| ⚠ | Blocked | Cannot proceed — blocker noted in the entry |

Feature Loop steps are defined in [build-plan.md](build-plan.md) §1. Refactor features (R0–R3) use the Refactor Gate (§5a) and are marked ☐ or ●.

---

## Summary Dashboard

Recount after every status change.

| Phase | Features | ☐ | ◔ | ◑ | ◕ | ● | ⚠ |
|---|---|---|---|---|---|---|---|
| Phase 0 — Foundation | 5 | 0 | 0 | 0 | 4 | 1 | 0 |
| Phase P — Existing product (retro) | 9 | 0 | 0 | 0 | 7 | 0 | 2 |
| Phase R0 — Critical security | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Phase R1 — Dead code & layout | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| Phase R2 — Backend spine | 6 | 6 | 0 | 0 | 0 | 0 | 0 |
| Phase R3 — Domain restructure | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| Phase 1 — Shared UI primitives | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Phase 2 — Product gaps | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| **Total** | **39** | **25** | **0** | **0** | **11** | **1** | **2** |

**Overall completion: 1 / 39 features meet the Definition of Done (3%)**

> The low percentage reflects the **Definition of Done**, not brokenness. The app runs and all three roles work end to end. What's missing across the board: RBAC middleware, visible write feedback (no toast component exists), and service-layer unit tests.

---

## How to Update This File

When you finish work on a feature:

1. Update its **Status** symbol and **Loop step**.
2. Fill in the detail fields that now apply (screens, components, endpoints, files).
3. Note anything unfinished under **Remaining** and any blocker under **Blockers**.
4. Add a line to the [Session Log](#session-log) at the bottom.
5. Recalculate the Summary Dashboard counts.
6. If new UI components were built, also update [ui-registry.md](ui-registry.md).

---

# Phase 0 — Foundation & Scaffolding

### 0.1 Repo & Tooling — ◕
- **Scope:** Frontend + backend workspaces, TypeScript strict, linter/formatter, styling framework with tokens, test runner.
- **Files:** `backend/tsconfig.json`, `frontend/tsconfig.json`, both `package.json`, `frontend/eslint.config.*`
- **Done:** Both workspaces, TS strict both sides, ESLint (frontend), Tailwind v4 configured.
- **Remaining:** No test runner script (→ R2.1). No formatter config. No backend linter.
- **Notes:** 6 `node:test` files exist and **pass**, but nothing invokes them.

### 0.2 Design System Port — ◕
- **Scope:** Tokens → theme config; base components per [ui-registry.md](ui-registry.md).
- **Files:** `frontend/src/app/globals.css` (251 lines)
- **Done:** Full Material 3 token set in `@theme inline`, 9-step type scale, card shadow, animations.
- **Remaining:** **No base component library** — Button, Card, Badge, Modal, Toast, Alert, Input are all written inline per use (→ Phase 1.1). No component gallery page.
- **Blockers:** B-3, B-13, B-15, B-17

### 0.3 App Shell — ●
- **Scope:** Topbar, drawer, page container, responsive off-canvas.
- **Components built:** `AppShell`, `ClientAppShell`, `TopAppBar`, `NavigationDrawer`, `FooterSection`
- **Files:** `frontend/src/components/*.tsx`, `frontend/src/app/layout.tsx`
- **Notes:** Responsive drawer at `lg` (1024px), not the 768px the generic standard assumes. `MobileBottomNav` and `RoleSwitcher` are built but rendered nowhere → **D-3**.

### 0.4 Backend Spine — ◕
- **Scope:** `app.ts`/`server.ts`, `asyncHandler`, `errorHandler`, DB client, health route, `/api/v1`, typed env.
- **Endpoints:** `GET /` (liveness string), `GET /api/test` (debug leftover)
- **Files:** `backend/src/app.ts`, `src/utils/asyncHandler.ts`, `src/middleware/error.middleware.ts`, `src/prisma.ts`
- **Done:** App assembly, CORS allowlist, cookie parsing, both singleton handlers, static report serving.
- **Remaining:** No `server.ts` split (→ R2.2). No `config/env.ts` (→ R2.2). No `/api/v1` (→ R2.3). No real health route. `GET /api/test` logs env values to console and should be deleted.
- **Blockers:** B-4, B-5

### 0.5 Database Schema + Seed — ◕
- **Scope:** Schema for all domains, migrations, seed with realistic demo data.
- **Models done:** `User`, `Commodity`, `SRP`, `Store`, `PriceRecord`, `Report`, `Forecast` (7/7) + 3 enums
- **Files:** `backend/prisma/schema.prisma`, 5 migrations
- **Remaining:** Nullability drift (→ R0.2). Only one index in the whole DB (→ R2.5). No seed script (→ R2.6). No `updated_at` anywhere. No `audit_logs` or `refresh_tokens`.
- **Blockers:** B-2, B-6, B-7, B-8, B-9, B-10, B-11, B-12

---

# Phase P — Existing Product Features (retroactive record)

Built before the standards existed. Recorded here so [progress.md](progress.md) stays the source of truth; planned coverage is [build-plan.md](build-plan.md) Phase P.

### P.1 Authentication — ◕
- **Screens:** Login page
- **Components:** `LoginPage`, `useLogin`
- **Endpoints:** `POST /api/auth/login` · `GET /api/auth/me` · `POST /api/auth/logout`
- **Files:** `backend/src/modules/auth/*`, `frontend/src/features/auth/*`, `frontend/src/middleware.ts`, `frontend/src/app/api/auth/*`
- **Access:** public
- **Remaining:** No refresh-token rotation. No service unit tests. No audit log on login.

### P.2 User Management — ⚠ **BLOCKED**
- **Screens:** Users management table, add-user dialog, search/filters, stats
- **Components:** `UsersManagementPage`, `UsersTable`, `AddUserDialog`, `UsersSearchFilters`, `UsersStatsSection`
- **Endpoints:** `POST|GET /api/users` · `GET|PUT|DELETE /api/users/:id`
- **Files:** `backend/src/modules/user/*`, `frontend/src/features/admin/users/*`
- **Access:** intended Admin — **actually enforced on nobody**
- **Blockers:** 🔴 **B-1** — privilege escalation. Do not deploy.

### P.3 Commodity Catalog — ◕
- **Screens:** Commodity management table, add dialog, summary cards, public list
- **Components:** `CommodityManagementPage`, `CommodityTable`, `AddCommodityDialog`, `CommoditySummaryCards`, `CommodityListPage`
- **Endpoints:** full CRUD `/api/commodities`
- **Access:** Admin write / all read — via a duplicated local `requireAdmin()` helper, not middleware
- **Remaining:** Migrate to `authorize` (→ R0.1). `CommodityDetailsDialog` is orphaned.

### P.4 SRP — ◕
- **Screens:** Update-SRP dialog (inside commodity feature)
- **Components:** `UpdateSrpDialog`
- **Endpoints:** full CRUD `/api/srps`
- **Access:** Admin write via local `requireAdmin()` helper
- **Remaining:** Migrate to `authorize` (→ R0.1). No audit log on SRP change.

### P.5 Store Registry — ◕
- **Screens:** Store registry grid, store cards, create dialog, per-store price records modal
- **Components:** `StoreRegistryPage`, `StoreRegistryGrid`, `StoreCard`, `StoreRegistryHeader`, `StoreRegistryToolbar`, `CreateStoreDialog`, `StorePriceRecordsModal`
- **Endpoints:** full CRUD `/api/stores`
- **Access:** Admin + Officer — **no route-level enforcement**
- **Remaining:** RBAC (→ R0.1). Shared by admin and officer routes despite living in `features/officer/` (→ R3.1).

### P.6 Price Records — ⚠ **BLOCKED**
- **Screens:** Price records table, entry form, filters
- **Components:** `PriceRecordsPage`, `PriceRecordsTable`, `PriceRecordForm`, `PriceRecordFilters`, `FieldError`
- **Endpoints:** full CRUD `/api/price-records`
- **Files:** `backend/src/modules/price-record/*` (incl. `price-record.scope.ts` — **unit tested ✅**)
- **Access:** Admin + Officer, officer-scoped in the service layer
- **Blockers:** 🔴 **B-2** — `record.store.name` crashes when a store has been deleted.
- **Notes:** Officer scoping is the best-tested logic in the codebase — 4 passing tests.

### P.7 Reports — ◕
- **Screens:** Report generation page, type cards, export format buttons, recent reports
- **Components:** `ReportGenerationPage`, `ReportTypeCard`, `ExportFormatButton`, `RecentReportCard`
- **Endpoints:** `POST|GET|DELETE /api/reports` · `GET|PUT|DELETE /api/reports/:id`
- **Files:** `backend/src/modules/report/*` (incl. `report.scope.ts` — **unit tested ✅**), `backend/src/modules/report/report.generator.ts`
- **Access:** Admin + Officer, officer-scoped — **no route-level enforcement**
- **Remaining:** RBAC (→ R0.1). Files on local disk (→ D-6).

### P.8 Forecasting (ARIMA) — ◕
- **Screens:** Price analysis page, trend panel, forecast summary/method panels, detail modal
- **Components:** `PriceAnalysisPage`, `PriceTrendPanel` (**the only Chart.js component**), `ForecastSummaryPanel`, `ForecastMethodPanel`, `ForecastDetailModal`, `DailyChangesPanel`, `PriceAnalysisSummaryCards`, `PriceAnalysisHeader`
- **Endpoints:** `POST /api/forecasts/generate` + full CRUD
- **Files:** `backend/src/modules/forecast/*` (incl. `arima.ts` — **unit tested ✅**)
- **Access:** Admin + Officer — **no route-level enforcement**
- **Notes:** The project's most distinctive feature and the only one with algorithm tests.

### P.9 Public Access — ◕
- **Screens:** Public commodity list, public price analysis
- **Endpoints:** `GET /api/public/commodities` · `GET /api/public/forecasts/:commodityId`
- **Access:** unauthenticated (correct by design)
- **Remaining:** `PublicUserDashboardPage` is orphaned (→ R1.1).

---

# Phase R0 — Critical Security Remediation

### R0.1 RBAC Middleware — ☐
- **Scope:** `authorize(...roles)` middleware; attach to all 7 protected route files; delete the 2 duplicated `requireAdmin` helpers.
- **Files:** see [build-plan.md](build-plan.md) R0.1
- **Done gate:** an OFFICER token cannot touch `/api/users` or set `role` anywhere.
- **Blockers:** resolves B-1

### R0.2 Fix `storeId` Nullability Drift — ☐
- **Scope:** `schema.prisma` → `String?` / `Store?`; regenerate; fix every unguarded deref.
- **Files:** `backend/prisma/schema.prisma`, `frontend/src/features/officer/MonitoringOfficerDashboardPage.tsx`
- **Done gate:** deleting a store leaves the officer dashboard rendering.
- **Blockers:** resolves B-2

### R0.3 Remove the `PUBLIC` Role — ☐
- **Scope:** Drop `PUBLIC` from `UserRole`; restrict user schemas to `ADMIN`/`OFFICER`; strip `PUBLIC` branches from auth and frontend middleware. *(D-7)*
- **Files:** `backend/src/modules/user/user.schema.ts`, `backend/prisma/schema.prisma` + migration, `backend/src/modules/auth/auth.service.ts`, `frontend/src/lib/auth.ts`, `frontend/src/middleware.ts`
- **⚠ Order:** Postgres cannot drop an enum value while rows use it — **query for existing `PUBLIC` users first** and reassign them before migrating.
- **Done gate:** `UserRole` has two values; unauthenticated public pages still load.
- **Notes:** Deliberate behavior change, not a pure refactor — grouped into R0 so R0.1 doesn't write guards for a role that then disappears.

---

# Phase R1 — Dead Code & Shared Layout

### R1.1 Delete Dead Code — ☐
- **Scope:** 8 orphaned files; `MobileBottomNav` + `RoleSwitcher` parked under D-3.
- **Blockers:** resolves B-24

### R1.2 Stop Tracking Build Output — ☐
- **Scope:** root `.gitignore`; untrack 65 `dist/` files + 9 generated reports.
- **Blockers:** resolves B-25

### R1.3 Backend → `src/shared/` — ☐
- **Scope:** 8 file moves, 27 import sites.
- **Blockers:** resolves B-5

### R1.4 Frontend → `src/shared/` — ☐
- **Scope:** `lib/` + `components/` → `shared/`; `FieldError` promoted to shared.
- **Blockers:** resolves B-20

### R1.5 kebab-case Filenames — ☐
- **Scope:** 3 renames.

---

# Phase R2 — Backend Spine & Versioning

### R2.1 Test Runner — ☐
- **Scope:** `npm test` script. **6 tests already pass** — they just cannot be invoked.

### R2.2 `server.ts` Split + Typed Env — ☐
- **Scope:** `config/env.ts` (Zod, fails fast), `server.ts`, remove `JWT_SECRET!`.
- **Blockers:** resolves B-4

### R2.3 `/api/v1` Versioning — ☐
- **Scope:** 3 backend mounts + 3 BFF edits. **Requires runtime verification** — `tsc` cannot catch a wrong path.

### R2.4 Remove `any` From Shared Handlers — ☐

### R2.5 Add Missing Indexes — ☐
- **Scope:** 9 indexes + migration.
- **Blockers:** resolves B-10

### R2.6 Seed Script — ☐
- **Scope:** ~90 days of price data so ARIMA produces a real forecast.
- **Blockers:** resolves B-12

---

# Phase R3 — Feature Domain Restructure

### R3.1 Split `features/officer/` Into Domains — ☐
- **Scope:** new `price-record/`, `stores/`, `report/` features; `officer/` reduced to its dashboard.
- **Notes:** `admin/price-records` and `admin/stores` import from `features/officer/` today — the folder is a role, not a domain.

### R3.2 Normalize Remaining Features — ☐
### R3.3 Normalize Imports — ☐
### R3.4 Backend Module `index.ts` + `.types.ts` — ☐

---

# Phase 1 — Shared UI Primitives

### 1.1 Base Component Set — ☐
### 1.2 Status Tokens & Card Convergence — ☐
### 1.3 Write Feedback (Toasts) — ☐

---

# Phase 2 — Product Gaps

### 2.1 Dashboard Visualization — ☐
### 2.2 Audit Logging — ☐
### 2.3 Settings Pages — ☐

### 2.4 Report Storage Independence — ☐
- **Scope:** `ReportStorage` interface + `local` driver behind it, so reports stop depending on the backend's local disk. *(D-6)*
- **Files:** new `backend/src/shared/storage/*`; edits to `report.generator.ts`, `report.service.ts`, `config/env.ts`, `app.ts`
- **Done gate:** switching `STORAGE_DRIVER` relocates report storage with no code change; reports survive a restart.
- **Notes:** **Pull forward if a production deploy is scheduled before Phase 2** — this is the only Phase 2 item that blocks deployment rather than improving the product.
- **Blockers:** resolves B-27

---

## Cross-Cutting Checklist

Verified continuously, re-checked at each phase exit ([build-plan.md](build-plan.md) §4):

| Concern | Status | Notes |
|---|---|---|
| RBAC enforced per route | ⚠ | **No middleware exists.** 2 of 9 modules self-check; `/api/users` is wide open (B-1) |
| Validation (frontend + backend) | ● | Zod both sides, params and bodies |
| Centralized error handling | ● | `errorHandler` maps `AppError`, `ZodError`, Prisma P2002/P2025 |
| Password hashing + secure storage | ● | bcrypt; httpOnly cookie; BFF keeps the token out of client JS |
| Audit logging on critical actions | ☐ | No table, no writes (B-6) |
| Responsive at 1024/768/480 | ◕ | Drawer/bottom-nav responsive; not systematically verified per screen |
| Loading / empty / error states | ◕ | Present in places (`StoreRegistryGrid` has an empty state); not universal |
| Accessibility | ☐ | Not audited — no focus-trap in the 6 modals |
| Unit tests on service layer | ◕ | 6 tests on scope resolvers + ARIMA; **zero on services**; runner not wired (R2.1) |
| No `any` | ◕ | Confined to the two shared handlers (R2.4) |
| Secrets from env only | ● | `.env` correctly gitignored and untracked |

---

## Open Decisions

| # | Decision | Status | Blocks |
|---|---|---|---|
| D-1 | `store/` collision — retail vs. state | ✅ Settled — retail uses `stores/` | R3.1 |
| D-2 | Role model — relational vs. flat enum | ✅ Settled — flat enum | — |
| D-3 | `MobileBottomNav` + `RoleSwitcher` — wire up or delete? | ✅ Settled — **delete both**; neither is functional | R1.1 |
| D-4 | `.validator.ts` vs `.schema.ts` | ✅ Settled — merged | — |
| D-5 | Docs describe target or current | ✅ Settled — target + blockers | — |
| D-6 | Report files → object storage? | ✅ Settled — **storage must be backend-independent** | 2.4 |
| D-7 | Is a `PUBLIC`-role account needed at all? | ✅ Settled — **no, remove the role** | R0.3 |

**No open decisions.**

---

## Blockers

| # | Sev | Blocker | Area | Resolved by |
|---|---|---|---|---|
| **B-1** | 🔴 | **Privilege escalation.** No `authorize` middleware. `/api/users` has zero role checks and `createUserSchema`/`updateUserSchema` accept `role` — any authenticated user can create or promote themselves to `ADMIN`. Only `commodity` and `srp` guard anything, via a duplicated local helper. | Backend security | R0.1 |
| **B-2** | 🔴 | **Null-deref crash.** DB allows `PriceRecord.storeId` NULL (`ON DELETE SET NULL`); `schema.prisma` declares it non-null, so Prisma's types hide it. `MonitoringOfficerDashboardPage.tsx:187` reads `record.store.name` unguarded and throws once any store is deleted. | Schema / frontend | R0.2 |
| **B-3** | 🟠 | 5 utilities (`.text-primary` et al.) redefined in `globals.css` as hardcoded hexes with `!important`, shadowing the tokens they name — token changes silently fail. | Styling | 1.2 |
| **B-4** | 🟠 | No typed env validation; `process.env.JWT_SECRET!` defers a config error to first request. | Backend | R2.2 |
| **B-5** | 🟡 | Shared code at `src/utils/` + `src/middleware/`; two competing type dirs (`src/types/`, root `types/`). | Backend layout | R1.3 |
| **B-6** | 🟡 | No `audit_logs` table — the cross-cutting audit requirement has no storage. | Database | 2.2 |
| **B-7** | 🟡 | No `updated_at` on any model; no `last_login_at`. | Database | — |
| **B-8** | 🟡 | `Commodity.status` / `.category` are unconstrained free-text. | Database | — |
| **B-9** | 🟡 | `datasource` block declares no `url`; connection comes from the adapter. | Database | — |
| **B-10** | 🟡 | Only one index in the entire database; every FK is unindexed. | Database | R2.5 |
| **B-11** | 🟡 | No uniqueness rule on duplicate price records; no non-negative price CHECK. | Database | — |
| **B-12** | 🟡 | No seed script. | Database | R2.6 |
| **B-13** | 🟠 | No success/warning/info tokens — `PriceStatus`, the app's key signal, is styled ad-hoc per component. | Styling | 1.2 |
| **B-14** | 🟡 | Two icon libraries in use (`react-icons` + Material Symbols). | Styling | — |
| **B-15** | 🟡 | Nine `--font-*` tokens all resolve to the same Inter stack. | Styling | 1.2 |
| **B-16** | 🟡 | `body { min-height: max(884px, 100dvh) }` forces a scrollbar on short viewports. | Styling | 1.2 |
| **B-17** | 🟠 | Card recipe inconsistent — `rounded-2xl` vs `rounded-3xl` (never the documented `rounded-xl`), `bg-white` vs token, three different shadows incl. one arbitrary inline value. | Styling | 1.2 |
| **B-18** | 🟡 | `min-h-screen lg:ml-72` page wrapper duplicated verbatim in 10 page components. | Frontend | 1.1 |
| **B-19** | 🟡 | `text-body-md` used in `StoreRegistryGrid` but **never defined** in `globals.css` — a silent no-op. | Styling | 1.2 |
| **B-20** | 🟡 | `FieldError` lives in `features/officer/` but is used across features. | Frontend layout | R1.4 |
| **B-21** | 🟠 | No shared `Button`, `Input`, `Modal`, `Toast`, `Alert` — markup duplicated across every page; modal overlay copied 5×. | Frontend | 1.1 |
| **B-22** | 🟡 | Modal overlays use non-token `bg-slate-950/40`; `ForecastDetailModal` diverges with `bg-black/50`. | Styling | 1.1 |
| **B-23** | 🟠 | No toast/alert component — **no mutation gives visible feedback**, failing the Definition of Done for every write feature. | Frontend | 1.3 |
| **B-24** | 🟡 | 8 orphaned components incl. 2 same-name duplicates; `(test)/test-page` has hardcoded `localhost` fetches. | Frontend | R1.1 |
| **B-25** | 🟡 | `backend/dist/` (65 files) and 9 generated report artifacts are tracked in git. | Repo hygiene | R1.2 |
| **B-26** | 🟡 | `GET /api/test` debug route logs env values to console. | Backend | R2.2 |
| **B-27** | 🟠 | Generated reports are written to the backend's local disk and served from `/reports/files` — they do not survive an ephemeral redeploy, and horizontal scaling serves 404s from whichever instance didn't generate the file. **Blocks production deployment.** | Backend / infra | 2.4 |

---

## Session Log

Newest first. One entry per work session — what was done, where it stopped, what's next.
The *next step* field matters most: write it so someone with zero context can pick it up.

| Date | Worked on | Outcome | Next step |
|---|---|---|---|
| 2026-08-13 | Context pack install + full documentation pass; D-3/D-6/D-7 settled | Pack relocated from nested `context/` to repo root so skill links resolve. All 8 docs written from the real codebase. Baseline verified: backend `tsc` clean, frontend `tsc` clean, 6/6 tests pass. 27 blockers catalogued, incl. **2 critical (B-1 privilege escalation, B-2 null-deref crash)**. Refactor planned per-file as Phases R0–R3. All 7 decisions now settled — added R0.3 (remove `PUBLIC` role) and 2.4 (report storage independence). **Zero code files modified.** | Start **R0.1** — build `backend/src/shared/middleware/authorize.ts` and attach it to all 7 protected route files per [build-plan.md](build-plan.md) R0.1. Then R0.2, then R0.3 (**query for existing `PUBLIC` users before migrating**). Work happens in `c:\WebDev\AD\price-service-v2`; the original `price-service` is the untouched backup. |
