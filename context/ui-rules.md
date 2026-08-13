# UI Rules

## 1. Purpose

Defines the design system for **PresyoSerbisyo** so the same look, feel, and component conventions are reproduced consistently across every screen.

The system is a **Material 3** palette expressed as **Tailwind CSS v4 `@theme inline` tokens**. There is no `tailwind.config.js` — [frontend/src/app/globals.css](../frontend/src/app/globals.css) is the single source of truth, and tokens become utility classes automatically (`--color-primary` → `bg-primary`, `text-primary`, `border-primary`).

> Known styling defects are tracked in [progress.md](progress.md) → Blockers, referenced inline as **B-n**.

---

## 2. Design Tokens

Defined in `globals.css` under `@theme inline`. These are the only source of color/spacing truth — nothing may hardcode a hex a token covers.

### Primary

| Token | Value | Usage |
|---|---|---|
| `--color-primary` | `#004ac6` | Primary brand — headers, primary buttons, active nav |
| `--color-primary-container` | `#2563eb` | Filled containers, lighter primary surfaces |
| `--color-primary-fixed` | `#dbe1ff` | Pale tint — selected backgrounds |
| `--color-primary-fixed-dim` | `#b4c5ff` | Dimmer tint |
| `--color-on-primary` | `#ffffff` | Text/icons on primary |
| `--color-on-primary-container` | `#eeefff` | Text on primary container |
| `--color-on-primary-fixed` | `#00174b` | Text on pale primary |
| `--color-on-primary-fixed-variant` | `#003ea8` | Secondary text on pale primary |

### Secondary and tertiary

| Token | Value | Usage |
|---|---|---|
| `--color-secondary` | `#735c00` | Secondary accent (gold family) |
| `--color-secondary-container` | `#fed01b` | DTI gold — highlights, warnings |
| `--color-secondary-fixed` | `#ffe083` | Pale gold |
| `--color-on-secondary` | `#ffffff` | Text on secondary |
| `--color-tertiary` | `#4b566a` | Muted slate accent |
| `--color-tertiary-container` | `#636e83` | Tertiary surfaces |
| `--color-tertiary-fixed` | `#d8e3fb` | Pale slate |

### Surfaces

| Token | Value | Usage |
|---|---|---|
| `--color-background` | `#faf8ff` | App background |
| `--color-surface` | `#faf8ff` | Base surface |
| `--color-surface-container-lowest` | `#ffffff` | **Cards** — the standard card background |
| `--color-surface-container-low` | `#f3f3fe` | Subtle raised areas |
| `--color-surface-container` | `#ededf9` | Default container |
| `--color-surface-container-high` | `#e7e7f3` | **Table headers, chips, filter bars** |
| `--color-surface-container-highest` | `#e1e2ed` | Footer, deepest container |
| `--color-surface-variant` | `#e1e2ed` | Hover backgrounds |
| `--color-surface-dim` | `#d9d9e5` | Dimmed surface |

### Text and outline

| Token | Value | Usage |
|---|---|---|
| `--color-on-surface` | `#191b23` | **Primary text** |
| `--color-on-surface-variant` | `#434655` | **Secondary/muted text** — most-used token in the app |
| `--color-outline` | `#737686` | Icon and placeholder grey |
| `--color-outline-variant` | `#c3c6d7` | **Borders** — the standard border color |
| `--color-inverse-surface` | `#2e3039` | Tooltips, inverse chips |
| `--color-inverse-on-surface` | `#f0f0fb` | Text on inverse |
| `--color-inverse-primary` | `#b4c5ff` | Primary on inverse |

### Radius and spacing

| Token | Value | Usage |
|---|---|---|
| `--radius-lg` | `0.5rem` | Inputs, small elements |
| `--radius-xl` | `0.75rem` | Standard card radius |
| `--radius-full` | `9999px` | Pills, nav items, avatars |
| `--spacing-stack-sm` | `0.25rem` | Tight stack gap |
| `--spacing-stack-md` | `0.75rem` | Default stack gap |
| `--spacing-stack-lg` | `1.5rem` | Section gap |
| `--spacing-container-margin-mobile` | `1rem` | Page gutter, mobile |
| `--spacing-container-margin-desktop` | `2rem` | Page gutter, desktop |

### Semantic / status colors

| Purpose | Background | Text |
|---|---|---|
| Error | `--color-error-container` `#ffdad6` | `--color-on-error-container` `#93000a` |
| Error (solid) | `--color-error` `#ba1a1a` | `--color-on-error` `#ffffff` |
| Success | *not defined* | *not defined* |
| Info | *not defined* | *not defined* |
| Warning | *not defined* | *not defined* |
| Neutral | `--color-surface-container-high` `#e7e7f3` | `--color-on-surface-variant` `#434655` |

> ⚠️ **B-13** — only error tokens exist. The three `PriceStatus` values are the single most important signal in this app and are currently styled with ad-hoc greens and ambers that drift per component. Success / warning / info tokens are needed.

---

## 3. Theme

- **Style**: flat Material 3 card-based dashboard — white cards on a faint lavender-white background, soft shadows, generous rounding
- **Primary identity color**: DTI blue `#004ac6`, applied as a solid — no gradients
- **Accent hierarchy**: primary blue → secondary gold `#fed01b` → tertiary slate → error red
- **Typography**: **Inter** (400/600/700/800) loaded from Google Fonts, fallback `"Segoe UI", sans-serif`
- **Elevation**: `.data-card-shadow` is the single card elevation; `shadow-sm` for the top bar, `shadow-lg` for the mobile bottom nav
- **Corner radius scale**: `rounded-lg` inputs/buttons · `rounded-xl` cards · `rounded-xl` modals · `rounded-full` pills
- **Motion**: `transition-colors` / `transition-all` at Tailwind defaults; `.animate-stats` runs a 0.8s `countUp` entrance on stat tiles
- **Icons**: **two libraries currently in use** — `react-icons` and Material Symbols Outlined. Prefer Material Symbols for new work to match the M3 language (**B-14**)

---

## 4. Utility Classes

The project uses Tailwind v4. Prefer native utilities; the classes below are the hand-rolled helpers that exist and must be reused rather than re-declared.

### Type scale

Each step is both a font utility and a size utility, applied together (`font-h2-desktop text-h2-desktop`).

```
.text-h1-desktop    40px / 1.2 / 700 / -0.02em   hero headings, desktop
.text-h1-mobile     30px / 1.2 / 700 / -0.01em   hero headings, mobile
.text-h2-desktop    24px / 1.3 / 600             page titles, app bar title
.text-h3-desktop    18px / 1.4 / 600             card titles
.text-body-lg       16px / 1.6 / 400             body copy
.text-body-sm       14px / 1.5 / 400             secondary copy — most common
.text-body-xs       12px / 1.4 / 400             fine print
.text-price-display 20px / 1.2 / 700             price figures
.text-label-caps    12px / 1   / 600 / 0.05em    uppercase labels
```

### Other helpers

```
.data-card-shadow          0 4px 6px -1px rgba(0,0,0,.1), 0 2px 4px -2px rgba(0,0,0,.05)
.animate-stats             0.8s countUp entrance (fade + 10px rise)
.scrollbar-none            hides scrollbar, keeps scrolling
.material-symbols-outlined Material Symbols font-variation settings
```

### Badge pill utility

**Not implemented.** There is no `.badge` class. Status pills are currently written inline per component with `rounded-full` plus ad-hoc colors — the direct consequence of the missing status tokens (**B-13**). When status tokens land, a `.badge` + `.badge-green/red/blue/gold/gray` set should be added here and registered in [ui-registry.md](ui-registry.md).

### ⚠️ Do not use

`globals.css` also declares `.text-primary`, `.text-on-surface`, `.text-on-surface-variant`, `.text-on-primary`, and `.text-outline` as hardcoded hexes with **`!important`**, shadowing the tokens of the same name. Changing a token silently fails for these five. Removing them is **B-3** — the highest-priority styling cleanup.

---

## 5. Layout Structure

### Auth screen
- Standalone centered card at `app/(auth)/login`, no shell chrome
- Login form with role-aware redirect after authentication

### App screen
Not a fixed two-column layout — a **responsive drawer** pattern:

- `TopAppBar` — `sticky top-0 z-50`, border-bottom, hosts the drawer toggle below `lg`
- `NavigationDrawer` — persistent left rail at `lg` and up (18rem, content offsets `lg:ml-72`); off-canvas overlay below `lg`
- `MobileBottomNav` — `fixed bottom-0 z-50`, `lg:hidden`
- `FooterSection` — offsets by `lg:ml-72` to clear the rail
- `.nav-item.active` equivalent: `rounded-full` pill, `bg-primary` with `text-on-primary`

### Responsive breakpoints

Verified at every visual-verify gate. Do not retrofit.

- **1024px (`lg`)** — the primary structural break: drawer becomes persistent, bottom nav hides, footer offsets
- **768px (`md`)** — grids reduce; form rows collapse to one column; container gutter `1rem` → `2rem`
- **480px** — single-column; tables scroll horizontally inside their wrapper

> The generic standard names 768/480. This app's real structural break is **1024px**, so check **1024, 768, and 480**.

---

## 6. Component Styling Reference

One row per component. Keep in lockstep with [ui-registry.md](ui-registry.md) — this describes *how it looks*, the registry records *where it lives*.

| Component | Class(es) | Notes |
|---|---|---|
| Card | `rounded-xl border border-outline-variant bg-surface-container-lowest data-card-shadow` | The canonical card recipe |
| Stat card | card recipe + `animate-stats` | Entrance animation on mount |
| Grid layouts | `grid gap-4 md:grid-cols-2 lg:grid-cols-4` | Collapses at `md` |
| Buttons | primary: `rounded-full bg-primary px-6 py-3 text-on-primary transition-colors` · secondary: `rounded-full border border-outline-variant hover:bg-surface-variant` | |
| Table | wrapper `overflow-x-auto`; header `bg-surface-container-high` | Wrapper is required — tables must never break the page |
| Modal | overlay + `rounded-xl bg-surface-container-lowest` | |
| Form | `rounded-lg border border-outline-variant px-4 py-3 focus:border-primary` | `FieldError` renders validation text |
| Chip / filter | `rounded-full border border-outline-variant px-3 py-1 text-label-caps` | |
| Nav item | `mx-2 flex items-center gap-4 rounded-full px-6 py-3 transition-all hover:bg-surface-variant` | Active: `bg-primary text-on-primary` |
| Top app bar | `sticky top-0 z-50 border-b border-outline-variant bg-surface shadow-sm` | |
| Bottom nav | `fixed bottom-0 z-50 rounded-t-xl border-t border-outline-variant bg-surface shadow-lg lg:hidden` | |
| Footer | `border-t border-outline-variant bg-surface-container-highest lg:ml-72` | |
| Alerts | *not implemented* | No shared alert component exists yet |
| Progress bar | *not implemented* | |
| Toast | *not implemented* | Write feedback currently relies on refetch alone |

---

## 7. Inline / Dynamic Styling Patterns

Values computed at runtime get bound to data, not hardcoded:

- **Price status color** — bind to the `PriceStatus` enum, never to a comparison recomputed in the view:
  `COMPLIANT` → success · `OVERPRICE` → error · `UNDERPRICE` → info/warning
- **Progress fill width** — `style={{ width: `${pct}%` }}`
- **Chart colors** — read from tokens; never let Chart.js fall back to its own defaults

---

## 8. Scrollbar

Browser default, except where `.scrollbar-none` is applied — horizontal chip rows and the drawer nav — which hides the scrollbar without disabling scrolling.

---

## 9. Implementation Notes

- Tokens live in `@theme inline` in `globals.css`. Add new tokens **there**, never as a raw hex in a component.
- Prefer native Tailwind v4 utilities over hand-rolled helper classes.
- Preserve component naming (`card`, `badge`, `btn-*`, `nav-item`, `modal-*`) as the convention for equivalent components, so this doc stays a valid cross-reference.
- Chart.js (via `react-chartjs-2`) replaces any CSS-only chart placeholder.
- Nine `--font-*` tokens all resolve to the identical Inter stack; collapse them to `--font-sans` (**B-15**).
- `body { min-height: max(884px, 100dvh) }` forces an 884px floor and causes a scrollbar on short viewports (**B-16**).
