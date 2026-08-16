# PresyoSerbisyo

A web-based commodity price monitoring and decision-support system for the **Department of Trade and Industry (DTI) Catanduanes**. Field officers record store prices on site, the system automatically classifies them against the official Suggested Retail Price (SRP), and the public gets price transparency. Core domains: commodity & SRP reference data, store registry, field price records, reporting, and ARIMA price forecasting.

Roles: `ADMIN` · `OFFICER` (accounts) · unauthenticated public access

## Current state — read this first

**The application is built, running, and structurally current.** Nine product modules work end to end for both account roles plus unauthenticated public access. It was built *before* these standards existed, but refactor phases R0–R3 closed the structural gap, and Phases 0, P, 1, and 2 are all complete.

Check [context/progress.md](context/progress.md) at the start of every session — it is the single source of truth for what is actually built. Never assume a feature exists; verify there first.

> ✅ **No open security findings, any severity.** The report IDOR (B-43) was closed by **Phase 4.1** on 2026-08-16 and live-verified with two real officer accounts.

**Two phases are in play:**

- **Phase 3 — Public Transparency** (3.1–3.3, findings B-31–B-38) — **unstarted.** **3.1 is the highest value-per-line item in the plan** — the public commodity table computes compliance status and price for every row and then renders neither; backend, transport, and row-mapping are already done. **D-9 is open and gates 3.3 only**; 3.1 and 3.2 are unblocked.
- **Phase 4 — Hardening & Scale** (4.1–4.6, findings B-43–B-52) — **1/6 done.** 4.1 ● (B-43, B-44). The remaining five can be done in any order; **4.2 Auth Hardening** is the next-highest value for the effort.

**Ownership is not a role check.** `authorize(...roles)` gates *who may use a route*, never *whose row this is*. Any id-addressed route on an own-data domain also needs its module's scope helper applied in the repository — on writes as much as reads. That gap is what made B-43 reachable; see [context/architecture.md](context/architecture.md) §8.

Verified baseline (2026-08-16): backend `tsc` clean · frontend `tsc` clean · `npm test` 55/55 passing.

## The one rule that governs everything

**UI-first, mock-data-first.** Every feature is built as a full, visible page with mock data and **visually verified by a human before any logic is written**. Then functionality is wired to that UI step by step.

**There are no invisible backend phases.** If you can't see it on screen, it isn't done. Never build a backend module "ahead" of its UI — that inverts the entire method.

The six-step **Feature Loop** (UI+Mock → Visual Verify → Contract → Wire Read → Wire Write → Test & Done) and its gates are defined in [context/build-plan.md](context/build-plan.md) §1. Do not start step N+1 until step N passes its gate.

> **Exception — refactor phases R0–R3.** Those change structure, not behavior, so there is no mock stage and no visual-verify gate. They use the **Refactor Gate** ([context/build-plan.md](context/build-plan.md) §5a): `tsc` clean, tests pass, behavior manually exercised, one commit per feature. A refactor that needs a behavior change must be split out and labeled as such.

## Use the skills

These encode the workflow — prefer them over ad-hoc work:

| Skill | When |
|---|---|
| `build-feature` | Implementing any feature/page/screen from the build plan |
| `add-component` | Creating any reusable UI piece (button, card, table, modal, chart…) |
| `checkpoint` | Saving/resuming session state; updating the tracker |
| `debug` | Anything broken, erroring, or rendering wrong |

## Documentation map

| File | Purpose |
|---|---|
| [context/build-plan.md](context/build-plan.md) | **What to build** — Feature Loop, Definition of Done, phases, settled decisions |
| [context/progress.md](context/progress.md) | **What is done** — per-feature status, 52 blockers, session log. Update every session |
| [context/ui-rules.md](context/ui-rules.md) | Design tokens, theme, component styling contract |
| [context/ui-registry.md](context/ui-registry.md) | Every UI component + its exact classes. **Check before building any component** |
| [context/architecture.md](context/architecture.md) | Module structure, data flow, API design, RBAC model |
| [context/database-design.md](context/database-design.md) | Schema, tables, ORM models, indexes |
| [context/code-standards.md](context/code-standards.md) | Naming, TypeScript, formatting, security standards |
| [context/project-overview.md](context/project-overview.md) | Scope, roles, modules, expected benefits |

## Stack

**Frontend**: Next.js 16 (App Router) · React 19 · TypeScript strict · Tailwind CSS v4 (Material 3 tokens) · `react-icons` (sole icon library — Material Symbols was removed in B-14; don't reintroduce it) · Chart.js via `react-chartjs-2`
**Backend**: Node.js · Express 4 · TypeScript strict · Prisma 7 · PostgreSQL
**Auth**: JWT signed with `JWT_SECRET`, delivered as an httpOnly `accessToken` cookie; the Next.js BFF layer converts it to a Bearer header so the token never reaches client JavaScript

## Settled decisions — do not re-litigate

- **`stores/` (plural) is the retail-store domain.** A "store" here is a shop, not a state container. Never name a state folder `store/` in this project. *(D-1)*
- **Roles are a flat `UserRole` enum on `User`** — no `roles`/`permissions` join tables. Granular runtime permissions are out of scope and would require a migration. *(D-2)*
- **`.validator.ts` is merged into `.schema.ts`.** Zod schemas serve as both shape and validator. *(D-4)*
- **Docs describe the target structure**, with every gap tracked in [context/progress.md](context/progress.md) → Blockers. *(D-5)*
- **Feature folders are domains, not roles.** `price-record/`, `stores/`, `commodity/` — never a folder named after who uses it.
- **There is no `PUBLIC` role.** Only `ADMIN` and `OFFICER` hold accounts; public access is unauthenticated via `/api/public/*`. *(D-7, removed in R0.3)*
- **Report storage never touches the local filesystem.** Report bytes are stored as `Bytes` columns on the `Report` row in Postgres and served through `GET /api/v1/reports/:id/download`. The originally-planned pluggable `ReportStorage`/S3 interface was **not** built — there was no S3 credential or SDK to verify a second driver against. *(D-6, revised and built in Phase 2.4)*
- **`MobileBottomNav` and `RoleSwitcher` are deleted**, not revived — both were non-functional scaffolding. No replacement bottom nav was built in Phase 1.1; if one is ever wanted it is net-new work. *(D-3)*
- **Public compliance status comes from the price range, not the mean.** A commodity is non-compliant if *any* monitored store prices it above SRP — averaging across stores lets an overpricing store hide behind a cheaper one. *(D-8, Phase 3.2)*

**One decision is open: D-9** — consumer violation reports, refer out to DTI Consumer Care vs. build an in-app form + `consumer_reports` table + admin queue. It gates Phase 3.3 only; 3.1 and 3.2 are unblocked. The register lives in [context/build-plan.md](context/build-plan.md) §7.

## Conventions

- **Files/folders**: kebab-case. **React components**: PascalCase `.tsx`. **Types/classes**: PascalCase. **Vars/functions**: camelCase. **Constants/env**: UPPER_SNAKE_CASE.
- **Backend module shape**: controller · service · repository · routes · schema · types · scope · index. Controllers stay thin; business logic lives in services; all DB access goes through repositories.
- **Data flow**: UI → feature service → route → controller → service → repository → ORM → database → shared handlers → UI.
- **Always** use the singleton `asyncHandler` and centralized `errorHandler`. Never swallow errors.
- **Validate on both sides** — frontend and backend. Reject invalid requests early.
- **Every protected route** gets RBAC middleware, *and* own-data roles get service-layer scoping. Both layers are required — see [context/architecture.md](context/architecture.md) §8.
- **Imports use the `@/` alias**, never `../../../../`.
- 2-space indent, semicolons, double quotes, TypeScript strict, avoid `any`.
- Mock data lives in `src/shared/mocks/<feature>.mock.ts` and is removed from the render path once real data is wired.

## Gotchas

- **Check [context/ui-registry.md](context/ui-registry.md) before building any component.** The shared primitives live in `frontend/src/shared/components/` — `Button`, `Card`, `Badge`, `Modal`, `Toast`, `Alert`, `Input`, `Select`, `FormGroup`, `PageShell`, `Chip`, `Pagination`, `FieldError` — most demoed at `/component-gallery`. Use them; never hand-roll a sixth copy of markup one of them already owns.
- **The card recipe is settled**: `rounded-xl border border-outline-variant bg-surface-container-lowest data-card-shadow` (buttons `rounded-full`, form inputs `rounded-lg`). Converged across the app in Phase 1.2 — match it, and match [context/ui-rules.md](context/ui-rules.md) §6 for anything new.
- **Every mutation must show a toast.** `Toast` is wired into all 8 write handlers (1.3); a new write without visible feedback fails the Definition of Done.
- **The public pages are the exception to the adoption sweeps.** B-18/B-21/B-22 were closed for the admin/officer surface, but `CommodityListPage` and `HeroSection` still hand-roll their wrapper, toolbar, and CTA (B-35). Phase 3.1 fixes this — don't cite them as precedent.
- **`/api/*` in frontend code is the BFF namespace, not the backend contract.** Backend version changes are absorbed in `app/api/[...path]/route.ts`; don't rewrite the 30 client call sites.
- **The real responsive break is 1024px (`lg`)**, not the 768px the generic standard assumes. Check 1024, 768, *and* 480.
- **Every screen needs loading, empty, and error states drawn** — a blank state fails the visual-verify gate.
- [context/build-plan.md](context/build-plan.md) and [context/progress.md](context/progress.md) are tightly coupled: adding a feature to one requires a matching entry and count update in the other.
- Secrets come from env vars only. Never hardcode them. `.env` is gitignored and correctly untracked — keep it that way.
- **Work happens in `price-service-v2`.** The original `price-service` is the untouched backup.
