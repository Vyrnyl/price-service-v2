---
name: add-component
description: Build a new UI component without duplicating an existing one. Use when creating any button, card, table, modal, form field, chart, badge, panel, or other reusable UI piece (e.g. "make a stat card component", "add a dropdown", "create a data table", "I need a new modal"). Enforces registry-first lookup, design tokens, and registry update after building.
---

# Add Component

Enforces the registry discipline: **match existing patterns exactly before inventing new ones.**

## 1. Check the registry FIRST — always

Read [ui-registry.md](../../../context/ui-registry.md) before writing a single line.

- **Exists?** → Reuse it. Match its exact classes and structure. Do not create a near-duplicate with a different name.
- **Close but not exact?** → Extend the existing component with a variant/prop. Prefer a variant over a new component.
- **Nothing fits?** → Build new, following the steps below.

If a similar component exists in the project's prototype or design reference but isn't yet ported, **port that one** — don't design from scratch.

## 2. Build it

- **Tokens only.** Colors, radius, shadow, spacing come from [ui-rules.md](../../../context/ui-rules.md) §2. Never hardcode a hex value that a token already covers.
- **Match the established look** — [ui-rules.md](../../../context/ui-rules.md) §6 is the styling contract. Keep class names consistent so the registry stays a valid cross-reference.
- **Conventions** ([code-standards.md](../../../context/code-standards.md) §4, §7.1): kebab-case files, PascalCase component names, small and focused, functional components, UI logic separate from business logic.
- **Location:** shared/reusable → `src/shared/components/`; feature-specific → `src/features/<feature>/components/`.
- **Typed props.** No `any`. Variants as a union type, not loose strings.
- **States:** handle loading, empty, error, and disabled where the component can encounter them.
- **Responsive:** verify at 768px and 480px per [ui-rules.md](../../../context/ui-rules.md) §5.
- **Accessibility:** labels tied to inputs, visible focus ring, keyboard-operable interactive elements, modals trap focus.

## 3. Verify visually

Render it in every variant and state before considering it done. This is the same gate as Feature Loop step 2 — if it's part of a feature build, get the user's confirmation.

## 4. Register it — required

Add a row to the correct section of [ui-registry.md](../../../context/ui-registry.md):

| Field | Value |
|---|---|
| Component | Its name |
| Status | `built` |
| File | Real path (`src/shared/components/...`) |
| Exact classes | Every class it uses, including variant/state modifiers |

If you ported a prototype component, flip its existing row to `built` and replace the prototype path with the real one rather than adding a second row.

Add a Change Log entry at the bottom of the registry with today's date.

If the component introduced a genuinely new styling pattern or token, also update [ui-rules.md](../../../context/ui-rules.md).

## Hard rules

- Never build a component without checking the registry first.
- Never leave a built component unregistered — an unregistered component gets duplicated by the next session.
- Never hardcode values that tokens cover.
- Never create a second component that does what an existing one already does.
