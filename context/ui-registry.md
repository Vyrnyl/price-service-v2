# UI Registry

> **Living document.** Updated after every component is built. Read this before building any new component — match existing patterns exactly before inventing new ones.

This registry catalogs every UI component in **PresyoSerbisyo**, its source location, and the exact classes it uses. The styling contract and design tokens live in [ui-rules.md](ui-rules.md). Stack, module structure, and conventions come from [architecture.md](architecture.md) and [code-standards.md](code-standards.md).

All paths are relative to `frontend/`.

---

## How to Use

**Before building any component:**

1. Check if a similar component already exists here.
2. If **yes** — match its exact classes and structure. Do not re-invent.
3. If **no** — build it following [ui-rules.md](ui-rules.md), then add it here.

**After building any component** — add the component name, file path, and exact classes used, plus a Change Log entry.

**Naming**: kebab-case files and folders, PascalCase component names ([code-standards.md](code-standards.md) §4). Group by feature module ([architecture.md](architecture.md) §5).

> ⚠️ **Read this before matching any card class.** The recipes below are what the code *actually contains*, and they are not consistent — card radius varies between `rounded-2xl` and `rounded-3xl` (never the documented `rounded-xl`), backgrounds alternate between `bg-surface-container-lowest` and hardcoded `bg-white`, and shadows vary across `data-card-shadow`, `shadow-sm`, and one arbitrary inline value. Converging these is **B-17**. Until it lands, prefer the token-based recipe in [ui-rules.md](ui-rules.md) §6 for new work and do not propagate `bg-white`.

---

## Legend

- **Status**: `planned` = not yet built · `prototype` = exists only in a design/prototype file · `built` = implemented in the app
- **⚠️ orphaned** = built but imported by nothing; slated for deletion in [build-plan.md](build-plan.md) R1.1
- **🗑️ delete** = decided for removal (D-3) — do not reuse or revive
- **File**: real path once built; the prototype file's name while prototype-only.

---

## 1. Foundations

| Token / Utility | Source | Reference |
|---|---|---|
| Design tokens (colors, radius, spacing) | `src/app/globals.css` → `@theme inline` | [ui-rules.md](ui-rules.md) §2 |
| Type scale (`.text-h1-desktop` … `.text-label-caps`) | `src/app/globals.css` | [ui-rules.md](ui-rules.md) §4 |
| `.data-card-shadow` · `.animate-stats` · `.scrollbar-none` | `src/app/globals.css` | [ui-rules.md](ui-rules.md) §4 |
| Badge pills | built — `src/shared/components/Badge.tsx` | 7 variants (`primary`/`secondary`/`error`/`success`/`warning`/`info`/`neutral`) — `success`/`warning`/`info` added in 2.2 (Audit Logging), first consumer to need more than 4 badge colors |

---

## 2. Layout Components

| Component | Status | File | Exact classes |
|---|---|---|---|
| AppShell | built | `src/shared/components/AppShell.tsx` | `flex min-h-screen flex-col` · main: `flex-1 pb-8 md:pb-10` |
| ClientAppShell | built | `src/shared/components/ClientAppShell.tsx` | none — `usePathname` wrapper around AppShell |
| TopAppBar | built | `src/shared/components/TopAppBar.tsx` | `sticky top-0 z-50 flex items-center justify-between gap-3 border-b border-outline-variant bg-surface px-container-margin-mobile py-stack-md shadow-sm md:px-container-margin-desktop` |
| NavigationDrawer | built | `src/shared/components/NavigationDrawer.tsx` | nav item: `mx-2 mt-2 flex items-center gap-4 rounded-full px-6 py-3 text-on-surface-variant transition-all hover:bg-surface-variant` |
| FooterSection | built | `src/shared/components/FooterSection.tsx` | `flex w-full lg:ml-72 lg:max-w-[calc(100%-18rem)] flex-col items-center justify-between gap-stack-md border-t border-outline-variant bg-surface-container-highest px-container-margin-mobile py-stack-lg md:flex-row md:px-container-margin-desktop` |
| PageShell | built | `src/shared/components/PageShell.tsx` | `min-h-screen lg:ml-72` + any extra `className` — extracts the wrapper that was repeated verbatim across page components (B-18, resolved 2026-08-16). **Adopted by all 9 applicable pages**: `DashboardPage`, `AdminDashboardPage`, `UsersManagementPage`, `CommodityManagementPage`, `StoreRegistryPage`, `PriceRecordsPage`, `ReportGenerationPage`, `MonitoringOfficerDashboardPage`, and `PriceAnalysisPage` (via the `className` extension for its extra `bg-surface-container-low`). `CommodityListPage`/`LoginPage` intentionally excluded — their `<main>` wrappers use a structurally different recipe (flex-1/overflow-based, or no sidebar offset at all), not the pattern this component targets. |

`AppShell` renders TopAppBar → NavigationDrawer → main → FooterSection.

> **R1.1 update (2026-08-13):** `MobileBottomNav` and `RoleSwitcher` are deleted per D-3 — no longer in the tree. `src/components/` and `src/lib/` no longer exist; everything moved to `src/shared/{components,services,utils}/` (R1.4). `FieldError` moved out of `features/officer/` to `src/shared/components/FieldError.tsx` — B-20 resolved.

---

## 1a. Shared UI Primitives (Phase 1.1)

Base component set built against the **documented** [ui-rules.md](ui-rules.md) §6 recipe, not the drifted inline markup found across existing pages (see the warning at the top of this file). Existing pages are **not yet migrated onto these** — that happens incrementally as each page is next touched. Demoed in full at `/component-gallery` (all roles, no auth).

| Component | Status | File | Variants / notes |
|---|---|---|---|
| Button | built | `src/shared/components/Button.tsx` | `primary`/`secondary`/`danger` × `sm`/`md`; `loading` (spinner), `disabled`. `rounded-full` per the documented spec. **Adopted 2026-08-16** by the 5 create/edit dialogs (submit + cancel actions) — remaining inline buttons are mostly filter/toggle pills (a different pattern, not a Button fit) |
| Card | built | `src/shared/components/Card.tsx` | `rounded-xl border border-outline-variant bg-surface-container-lowest data-card-shadow` — the one canonical recipe, per §6 |
| Badge | built | `src/shared/components/Badge.tsx` | `primary`/`secondary`/`error`/`success`/`warning`/`info`/`neutral` — `success`/`warning`/`info` added in 2.2 |
| Modal | built | `src/shared/components/Modal.tsx` | Overlay `bg-inverse-surface/40` (token-based) + `rounded-xl bg-surface-container-lowest` container. Escape-to-close, click-outside-to-close, `role="dialog"`/`aria-modal`. **No focus trap** — that gap (noted in the Cross-Cutting Checklist) is not closed by this component. **B-22 resolved 2026-08-16** — all 7 hand-rolled dialogs (`AddUserDialog`, `AddCommodityDialog`, `UpdateSrpDialog`, `CreateStoreDialog`, `StorePriceRecordsModal`, `ForecastDetailModal`, `CommodityListPage`'s inline modal) plus `PriceRecordsPage`'s inline overlay now render through this component. |
| Toast | built | `src/shared/components/Toast.tsx` | `ToastProvider` (mounted in root `layout.tsx`) + `useToast()` hook, `primary`/`success`/`error`/`neutral` variants (`success` added in 1.3 once B-13's token existed), auto-dismiss 4s, manual dismiss. **Wired into all 8 create/update/delete mutations across the app as of Phase 1.3** (2026-08-14) — closes B-23, self-verified via Playwright, pending human sign-off |
| Alert | built | `src/shared/components/Alert.tsx` | `error`/`neutral`; inline banner, `role="alert"` |
| Input | built | `src/shared/components/Input.tsx` | `forwardRef` (works with `react-hook-form`'s `register()`); `hasError` prop for the error border/ring treatment. **Adopted 2026-08-16** by the 5 create/edit dialogs' text/number/date/password fields. **`icon` prop added 2026-08-16** — renders a leading icon (`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-outline`) and switches the field to `pl-11 pr-4`; ref still forwards to the underlying `<input>`. Closed the last gap blocking B-21's toolbar adoption. |
| Select | built | `src/shared/components/Select.tsx` | Same pattern as Input. **Adopted 2026-08-16** by the 5 create/edit dialogs' role/status/store/commodity fields, and by `StoreRegistryToolbar`'s municipality/status filters (2026-08-16) |
| FormGroup | built | `src/shared/components/FormGroup.tsx` | Composes label + field + `FieldError`; matches the `space-y-1.5` field wrapper pattern already used everywhere. **Adopted 2026-08-16** by the 5 create/edit dialogs and by `PriceRecordFilters` (2026-08-16) |
| Chip | built | `src/shared/components/Chip.tsx` | New 2026-08-16, closes B-21's toolbar half. `active`/`rest` props, `<button type="button" aria-pressed>`. `rounded-full border px-4 py-1.5 text-label-caps font-medium` — active: `border-transparent bg-primary-container text-on-primary-container`; inactive: `border-outline-variant text-on-surface-variant hover:bg-surface-container-high`. Converges `UsersSearchFilters`' and `StoreRegistryToolbar`'s two previously-different toggle-pill recipes onto one. |
| Pagination | built | `src/shared/components/Pagination.tsx` | New 2026-08-16, closes **B-30**. `currentPage`/`totalPages`/`onPageChange`/`size` (`"sm"` \| `"md"`, default `"md"`) props. Windows the visible page-number buttons (max 7: first, last, current ±1, `…` ellipsis for gaps) instead of rendering one button per page — the previous inline pattern (`Array.from({ length: totalPages })`, duplicated across 7 files) rendered unbounded buttons in a single unwrapped row, which broke the page layout at high page counts (910 seeded price records ÷ 5/page = 182 buttons, ~7770px wide). Returns `null` when `totalPages <= 1`. `sm`: `h-8 w-8 text-[11px] sm:h-9 sm:w-9 sm:text-sm`, icon 18 — used by `PriceRecordsPage`, `StorePriceRecordsModal`, `CommodityListPage`'s record modal. `md`: `h-10 w-10 text-sm`, icon 20 — used by `UsersTable`, `CommodityTable`, `AuditLogTable`, `CommodityListPage`'s commodity table, `StoreRegistryPage`. Adopted at all 7 sites that previously duplicated the unwrapped-button markup; `stores.constants.ts`'s now-orphaned `ICON_BUTTON_CLASSES` was deleted. |

**Gallery page**: `src/app/(public)/component-gallery/page.tsx` — renders every component in every variant; visually verified at 1024/768/480 by the user on 2026-08-13.

---

## 3. Data Display

| Component | Status | File | Exact classes |
|---|---|---|---|
| UsersTable | built | `src/features/admin/users/components/UsersTable.tsx` | `overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-sm` |
| UsersStatsSection | built | `src/features/admin/users/components/UsersStatsSection.tsx` | `grid gap-4 sm:grid-cols-2 xl:grid-cols-4` |
| CommodityTable | built | `src/features/commodity/components/CommodityTable.tsx` | `flex min-h-105 flex-1 flex-col rounded-3xl border border-outline-variant bg-white p-6 data-card-shadow md:p-8` |
| CommoditySummaryCards | built | `src/features/commodity/components/CommoditySummaryCards.tsx` | `flex flex-wrap gap-6` |
| PriceRecordsTable | built | `src/features/price-record/components/PriceRecordsTable.tsx` | row actions: `flex flex-wrap items-center gap-2` |
| AuditLogTable | built | `src/features/admin/audit-log/components/AuditLogTable.tsx` | `overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest data-card-shadow` — built against the current (post-1.2) card recipe, not the drifted `rounded-2xl`/`shadow-sm` some older tables above still use |
| AuditLogFilters | built | `src/features/admin/audit-log/components/AuditLogFilters.tsx` | `flex flex-col gap-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 data-card-shadow` — search input + action-filter pills, same recipe as `UsersSearchFilters` |
| AuditLogDetailModal | built | `src/features/admin/audit-log/components/AuditLogDetailModal.tsx` | wraps the shared `Modal` — see §1a |
| StoreCard | built | `src/features/stores/components/StoreCard.tsx` | title: `mb-1 truncate font-h3-desktop text-h3-desktop text-on-surface` (compact variant: `text-sm font-semibold`) |
| StoreRegistryGrid | built | `src/features/stores/components/StoreRegistryGrid.tsx` | empty state: `rounded-2xl border border-dashed border-outline-variant bg-white p-8 text-center text-body-md text-on-surface-variant` — ⚠️ `text-body-md` **is not defined** in `globals.css` (B-19) |
| StoreRegistryHeader | built | `src/features/stores/components/StoreRegistryHeader.tsx` | `mb-2 flex items-center gap-2 text-primary` |
| RecentReportCard | built | `src/features/report/components/RecentReportCard.tsx` | `rounded-3xl border border-outline-variant bg-white p-5` |
| ReportTypeCard | built | `src/features/report/components/ReportTypeCard.tsx` | badge: `absolute right-4 top-4` |
| HeroSection | built | `src/features/dashboard/components/HeroSection.tsx` | `relative overflow-hidden bg-white px-container-margin-mobile py-16 md:px-container-margin-desktop md:py-24` |
| SummaryStats | built | `src/features/dashboard/components/SummaryStats.tsx` | `bg-surface-container-low px-container-margin-mobile py-12 md:px-container-margin-desktop` |
| PriceAnalysisHeader | built | `src/features/public/components/price-analysis/PriceAnalysisHeader.tsx` | `text-2xl font-semibold tracking-tight text-on-surface sm:text-3xl md:text-4xl` — ⚠️ raw sizes instead of the type scale |
| PriceAnalysisSummaryCards | built | `src/features/public/components/price-analysis/PriceAnalysisSummaryCards.tsx` | `grid gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-3` |
| ForecastSummaryPanel | built | `src/features/public/components/price-analysis/ForecastSummaryPanel.tsx` | `flex flex-col gap-4 sm:gap-6` |
| ForecastMethodPanel | built | `src/features/public/components/price-analysis/ForecastMethodPanel.tsx` | `rounded-3xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm sm:p-6` |
| DailyChangesPanel | built | `src/features/public/components/price-analysis/DailyChangesPanel.tsx` | `flex items-start justify-between gap-4` |

---

## 4. Charts

| Component | Status | File | Exact classes |
|---|---|---|---|
| PriceTrendPanel | built | `src/features/public/components/price-analysis/PriceTrendPanel.tsx` | header: `mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between` |
| PriceTrendLineChart | built | `src/shared/components/charts/PriceTrendLineChart.tsx` | card: `rounded-xl border border-outline-variant bg-surface-container-lowest p-6 data-card-shadow md:p-8`; states: `h-60 animate-pulse rounded-xl bg-surface-container` (loading), `flex h-60 items-center justify-center text-body-sm text-error\|text-on-surface-variant` (error/empty) |
| CommodityComparisonChart | built | `src/shared/components/charts/CommodityComparisonChart.tsx` | same card recipe as above; horizontal bar (`indexAxis: "y"`), single dataset in `--color-secondary` |
| SrpVsActualChart | built | `src/shared/components/charts/SrpVsActualChart.tsx` | same card recipe as above; grouped bar, SRP in `--color-outline`, actual average colored per-bar `--color-success`/`--color-error` depending on whether it exceeds SRP |

**Phase 2.1 (Dashboard Visualization) built the 3 new charts above** — the "price trend graphs" and "commodity comparison" visualizations [project-overview.md](project-overview.md) describes. They're presentational-only (`points`/`isLoading`/`error` props, no data fetching inside), live in `shared/components/` because both `AdminDashboardPage` and `MonitoringOfficerDashboardPage` consume them, and are demoed with real seeded data on both dashboards under a "Market Insights" section. All 4 Chart.js components now share the same token-reading pattern (`shared/utils/chart-tokens.ts`'s `readToken`/`hexToRgba`, extracted in this phase — `PriceTrendPanel` still inlines its own copy, not touched). Any new chart should use the shared util rather than re-inlining it a third time.

---

## 5. Forms & Inputs

| Component | Status | File | Exact classes |
|---|---|---|---|
| FieldError | built | `src/shared/components/FieldError.tsx` | `mt-1 text-xs font-medium text-error` |
| PriceRecordForm | built | `src/features/price-record/components/PriceRecordForm.tsx` | Built on `FormGroup`/`Input`/`Select`/`Button` as of 2026-08-16 (B-21) — no longer owns a card wrapper; renders through the `Modal` its caller (`PriceRecordsPage`) now wraps it in |
| PriceRecordFilters | built | `src/features/price-record/components/PriceRecordFilters.tsx` | `grid gap-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-5 data-card-shadow md:p-6` — now built on `FormGroup`/`Input`/`Select` as of 2026-08-16 (B-21 toolbar half) |
| UsersSearchFilters | built | `src/features/admin/users/components/UsersSearchFilters.tsx` | `flex flex-col gap-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 data-card-shadow lg:flex-row lg:items-center lg:justify-between` — search uses `Input`'s new `icon` prop, filter pills use `Chip` as of 2026-08-16 |
| StoreRegistryToolbar | built | `src/features/stores/components/StoreRegistryToolbar.tsx` | `rounded-xl border border-outline-variant bg-surface-container-lowest p-6 data-card-shadow` — search uses `Input`'s `icon` prop, municipality/status filters use `Select`, quick filters use `Chip` as of 2026-08-16 |

`FieldError` is the shared validation-message component — lives in `src/shared/components/` (moved there in R1.4, B-20 resolved).

Forms use `react-hook-form` + Zod resolvers. **B-21 fully resolved 2026-08-16** — the 5 create/edit dialogs already used `FormGroup`/`Input`/`Select`/`Button`; the 3 filter/search toolbars now do too, using `Input`'s new `icon` prop (leading search icon) and the new `Chip` component (toggle-pill filters) built for this. `shared/constants/form.constants.ts` was deleted earlier as dead code (unaffected by this pass).

---

## 6. Actions & Buttons

| Component | Status | File | Exact classes |
|---|---|---|---|
| ExportFormatButton | built | `src/features/report/components/ExportFormatButton.tsx` | label: `text-body-sm font-semibold` |
| Button | built | `src/shared/components/Button.tsx` | See §1a — Phase 1.1. **Adopted 2026-08-16** by the 5 create/edit dialogs' submit/cancel actions (B-21). Filter-pill/toggle buttons are a different pattern — those now use the new `Chip` component (§1a) instead. |

---

## 7. Feedback & Overlays

| Component | Status | File | Exact classes |
|---|---|---|---|
| AddUserDialog | built | `src/features/admin/users/components/AddUserDialog.tsx` | Renders through `Modal` (title/description) with `FormGroup`/`Input`/`Select`/`Button` fields as of 2026-08-16 |
| AddCommodityDialog | built | `src/features/commodity/components/AddCommodityDialog.tsx` | Same — `Modal` + `FormGroup`/`Input`/`Select`/`Button` |
| UpdateSrpDialog | built | `src/features/commodity/components/UpdateSrpDialog.tsx` | Same — `Modal` + `FormGroup`/`Input`/`Button` |
| CreateStoreDialog | built | `src/features/stores/components/CreateStoreDialog.tsx` | Same — `Modal` + `FormGroup`/`Input`/`Button` |
| StorePriceRecordsModal | built | `src/features/stores/components/StorePriceRecordsModal.tsx` | Renders through `Modal` (`title`/`description`/`maxWidth="max-w-4xl"`) as of 2026-08-16 — converged onto Modal's canonical `p-6`/`text-h3-desktop` header, replacing its previous bespoke compact recipe |
| ForecastDetailModal | built | `src/features/public/components/price-analysis/ForecastDetailModal.tsx` | Renders through `Modal` (`maxWidth="max-w-3xl"`, no `title` prop) as of 2026-08-16 — kept its own custom eyebrow-label header as children since it's structurally different from Modal's title/description shape |
| Modal | built | `src/shared/components/Modal.tsx` | See §1a — Phase 1.1. **B-22 resolved 2026-08-16** — all 7 dialogs above plus `CommodityListPage`'s inline price-records modal and `PriceRecordsPage`'s inline add/edit overlay now render through this component. No remaining hand-rolled overlay divs in the codebase. |
| Toast | built | `src/shared/components/Toast.tsx` | See §1a — Phase 1.3. Provider mounted globally; **wired into every create/update/delete across the app** as of 2026-08-14 (B-23 implemented, pending sign-off) |
| Alert | built | `src/shared/components/Alert.tsx` | See §1a — Phase 1.1 |
| Progress bar | **not implemented** | — | (B-23) |

---

## 8. Settings

| Component | Status | File | Exact classes |
|---|---|---|---|
| SettingsPage | built | `src/features/settings/pages/SettingsPage.tsx` | `PageShell` + `mx-auto max-w-3xl space-y-6`; loading skeleton: two `Card` instances, `h-56`/`h-72 animate-pulse` |
| ProfileForm | built | `src/features/settings/components/ProfileForm.tsx` | `Card` (`p-6 md:p-8`) wrapping a `grid gap-4 sm:grid-cols-2` form of `FormGroup`+`Input` pairs — first form built entirely on the Phase 1.1 primitives from the start, not migrated |
| PasswordForm | built | `src/features/settings/components/PasswordForm.tsx` | Same `Card`/`FormGroup`/`Input` recipe as `ProfileForm`; 3 password fields (current/new/confirm) |

Both `/admin/settings` and `/officer/settings` route files (`src/app/(protected)/{admin,officer}/settings/page.tsx`) now render the same `SettingsPage` — self-service profile + password change, backed by `GET/PUT /api/v1/users/me` and `PUT /api/v1/users/me/password` (Phase 2.3, 2026-08-14). Closes the "route only" gap noted here previously.

---

## 9. Page Components

Route-level feature pages. Listed for completeness — these compose the components above rather than being reusable themselves.

| Page | Status | File |
|---|---|---|
| LoginPage | built | `src/features/auth/components/LoginPage.tsx` |
| DashboardPage | built | `src/features/dashboard/pages/DashboardPage.tsx` |
| AdminDashboardPage | built | `src/features/admin/pages/AdminDashboardPage.tsx` |
| UsersManagementPage | built | `src/features/admin/users/pages/UsersManagementPage.tsx` |
| CommodityManagementPage | built | `src/features/commodity/pages/CommodityManagementPage.tsx` |
| CommodityListPage | built | `src/features/commodity/pages/CommodityListPage.tsx` |
| MonitoringOfficerDashboardPage | built | `src/features/officer/pages/MonitoringOfficerDashboardPage.tsx` |
| PriceRecordsPage | built | `src/features/price-record/pages/PriceRecordsPage.tsx` |
| StoreRegistryPage | built | `src/features/stores/pages/StoreRegistryPage.tsx` |
| ReportGenerationPage | built | `src/features/report/pages/ReportGenerationPage.tsx` |
| PriceAnalysisPage | built | `src/features/public/pages/PriceAnalysisPage.tsx` |
| SettingsPage | built | `src/features/settings/pages/SettingsPage.tsx` |

---

## Change Log

| Date | Component(s) | Change |
|---|---|---|
| 2026-08-13 | All | Registry populated from the existing codebase — 43 components catalogued, 8 flagged orphaned, 6 shared primitives identified as missing. |
| 2026-08-13 | MobileBottomNav, RoleSwitcher | Marked 🗑️ delete per D-3 — both inspected and found to be non-functional template scaffolding, not usable components. |
| 2026-08-13 | All | Reconciled every file path after refactor phases R1–R3: `src/components/`→`src/shared/components/`, `src/lib/`→`src/shared/{services,utils}/`, `features/officer/`→`features/{price-record,stores,report,officer}/` domain split, and every other feature's `pages/`/`components/`/`services/` normalization. Removed 8 deleted orphans (MobileBottomNav, RoleSwitcher, FeaturedSection, TopCommoditiesGrid, CommodityDetailsDialog, PublicUserDashboardPage, and the 2 duplicate UsersManagementPage/ReportGenerationPage entries) — they no longer exist in the tree. `FieldError` now correctly shown under Layout's shared note (B-20 resolved). |
| 2026-08-13 | Button, Card, Badge, Modal, Toast, Alert, Input, Select, FormGroup, PageShell | Phase 1.1 — the base component set Phase 0.2 never produced. All 10 added under §1a, built against the documented ui-rules.md §6 recipe rather than the drifted inline markup already in the app. Demoed at `/component-gallery`, visually verified at 1024/768/480 by the user. None of the 10 have been adopted by existing pages yet — that's incremental follow-up, not part of this feature. |
| 2026-08-14 | All cards, `Toast`, `NavigationDrawer` | Phase 1.2 — success/warning/info tokens added to `globals.css`; card recipe converged to `rounded-xl border border-outline-variant bg-surface-container-lowest data-card-shadow` across ~37 files; modal/drawer overlays converged to `bg-inverse-surface/40`\|`/30`; undefined `text-body-md` fixed. Visually signed off by the user. |
| 2026-08-14 | Toast | Phase 1.3 — added a `success` variant (B-13's token made this possible); wired `showToast` into all 8 create/update/delete handlers across the app. Self-verified via Playwright screenshots; pending human sign-off. |
| 2026-08-14 | PriceTrendLineChart, CommodityComparisonChart, SrpVsActualChart | Phase 2.1 — 3 new dashboard charts added under §4, all in `shared/components/charts/` (consumed by both `AdminDashboardPage` and `MonitoringOfficerDashboardPage`). Visually verified by the user at 1024/768/480 (mock data), then re-verified rendering real seeded aggregates after backend wiring. Extracted `readToken`/`hexToRgba` into `shared/utils/chart-tokens.ts` so a 3rd/4th copy of `PriceTrendPanel`'s inline helpers wasn't needed. |
| 2026-08-14 | SettingsPage, ProfileForm, PasswordForm | Phase 2.3 — new `features/settings/` domain, added under §5/§8/§9. First feature built entirely on the Phase 1.1 shared primitives (`PageShell`/`Card`/`FormGroup`/`Input`/`Button`/`Alert`) from the start rather than migrating existing markup. Replaces the two empty-shell `/admin/settings` and `/officer/settings` routes. Visually verified by the user at 1024/768/480. |
| 2026-08-16 | PageShell, Modal, Button, Input, Select, FormGroup | Adoption sweep closing B-18, B-22, and most of B-21 — 9 pages migrated onto `PageShell`; 7 hand-rolled dialogs + `PriceRecordsPage`'s inline overlay migrated onto `Modal`; the 5 create/edit dialogs migrated onto `FormGroup`/`Input`/`Select`/`Button`. Deleted the now-dead `shared/constants/form.constants.ts`. The 3 filter/search toolbars were deliberately left inline (icon/chip pattern not yet supported by the current component API). Pending human visual sign-off. |
| 2026-08-16 | Chip (new), Input | **B-21 fully closed.** Added `Input`'s `icon` prop (leading-icon slot, `pl-11` field padding) and a new `Chip` toggle-pill component (converges `UsersSearchFilters`' and `StoreRegistryToolbar`'s two previously-different pill recipes onto one: `border-transparent bg-primary-container text-on-primary-container` active / `border-outline-variant text-on-surface-variant hover:bg-surface-container-high` inactive). Migrated all 3 remaining filter/search toolbars (`UsersSearchFilters`, `StoreRegistryToolbar`, `PriceRecordFilters`) onto `Input`/`Select`/`FormGroup`/`Chip` — no hand-rolled filter markup remains anywhere in the app. Visually verified via Playwright at 1024/768/480 against the live seeded Neon DB (screenshots + chip-click interaction checks), zero console errors. **Human sign-off given 2026-08-16** (reviewed the screenshots directly). |
| 2026-08-16 | Pagination (new) | **B-30 closed** (found and fixed same session). New windowed pagination component — the identical unwrapped `Array.from({ length: totalPages })` button-list pattern was duplicated across 7 files, which broke the page layout once a table had enough pages (910 seeded price records → 182 buttons, ~7770px page width). Adopted at all 7 sites: `PriceRecordsPage`, `StorePriceRecordsModal`, `CommodityListPage` (both its commodity table and its record modal), `AuditLogTable`, `UsersTable`, `CommodityTable`, `StoreRegistryPage`. Deleted the now-orphaned `ICON_BUTTON_CLASSES` constant from `stores.constants.ts`. Verified `body.scrollWidth` stays at viewport width (was ~7770px) on `/admin/price-records`; visually verified via Playwright across all 5 adopting pages, zero console errors. **Human sign-off given 2026-08-16** (reviewed a published before/after screenshot gallery). |
