# Project Overview

# PresyoSerbisyo

## Overview

PresyoSerbisyo is a web-based price monitoring and decision-support system built for the **Department of Trade and Industry (DTI) Catanduanes**. It replaces manual, paper-based commodity price monitoring with a digital platform where field officers record store prices, the system automatically compares them against the DTI **Suggested Retail Price (SRP)**, and the public can view price transparency data.

The system manages:

- **Commodity & SRP reference data** — the catalog of monitored goods and their official suggested retail prices
- **Field price monitoring** — store registry and officer-submitted price records with automatic SRP compliance classification
- **Analytics & reporting** — trend visualization, ARIMA time-series forecasting, and exportable official reports
- **Access & identity** — role-based accounts for DTI staff and public consumers

The primary goal is to give DTI Catanduanes accurate, timely pricing intelligence for enforcement decisions, while giving consumers transparent access to market prices.

---

# Objectives

- Replace manual price monitoring with structured digital data capture in the field
- Detect SRP violations automatically instead of by manual comparison
- Give DTI officers a single dashboard view of market pricing status
- Produce official monitoring reports without manual compilation
- Publish price transparency data to consumers
- Support enforcement planning with price trend forecasting

---

# Target Users

Three roles, backed by the `UserRole` enum (`ADMIN` · `OFFICER` · `PUBLIC`). These drive the RBAC matrix in [architecture.md](architecture.md) §8.

---

# 1. Admin

Full system access. Owns reference data and user accounts; the only role permitted to manage identity.

## Responsibilities

### User management

- Create, edit, and deactivate user accounts
- Assign roles (`ADMIN`, `OFFICER`, `PUBLIC`)
- Activate/deactivate access via the `isActive` flag

### Reference data

- Create and maintain the commodity catalog
- Set and update SRP values with effective dates

### Oversight

- View all price records across all officers
- View all generated reports, system-wide
- Access the admin dashboard

---

# 2. Monitoring Officer

DTI field staff who collect price data on site. Sees and manages **only their own** records.

## Responsibilities

### Field data capture

- Register stores (name, location) in the store registry
- Record commodity prices observed at a store
- Record date/time and the store visited

### Own-scope review

- View and edit their own price records
- Generate and download monitoring reports scoped to their own data

### Read-only reference

- Browse the commodity catalog and current SRP values

---

# 3. Consumer / Public User

Unauthenticated or low-privilege public access. Read-only, no data entry.

## Responsibilities

### Price transparency

- Browse the public commodity list with current prices
- Compare observed store prices against SRP
- View price trend charts and forecast analysis

---

# Core Modules

One section per module. Each maps to a backend module ([architecture.md](architecture.md) §4.1) and a frontend feature folder (§5.1).

## Auth

Features:

- Email/password login issuing a JWT
- Session retrieval (`/me`) and logout
- Cookie- and Bearer-token credential handling

---

## User

Features:

- Full CRUD over user accounts
- Role assignment and active/inactive state
- Admin-only by design

> ⚠️ **Role enforcement is currently missing on this module.** See [progress.md](progress.md) → Blockers. This is the highest-priority defect in the system.

---

## Commodity

Features:

- CRUD over the monitored commodity catalog
- Category and status classification
- Public read projection for consumers

---

## SRP

Features:

- CRUD over Suggested Retail Price entries
- Effective-dated pricing per commodity
- Supplies the reference value for compliance checks

---

## Store

Features:

- Store registry CRUD (name, location)
- Ownership tied to the registering officer
- `lastVisited` tracking for monitoring cadence

---

## Price Record

Features:

- CRUD over field-captured price observations
- Automatic SRP comparison producing `COMPLIANT` / `OVERPRICE` / `UNDERPRICE`
- Role-scoped visibility — officers see only their own records

---

## Report

Features:

- Generation of `MONTHLY`, `SRP_COMPLIANCE`, and `TREND` reports
- Export to PDF, Excel, and CSV
- Role-scoped listing and file download

---

## Forecast

Features:

- ARIMA time-series forecasting over historical price data
- Predicted price with a confidence value per commodity
- Persisted forecasts with forecast dates

---

## Public

Features:

- Unauthenticated commodity listing
- Unauthenticated forecast retrieval by commodity
- Backs the consumer-facing transparency pages

---

# Security Features

- Role-Based Access Control (RBAC) across three roles
- JWT authentication via `Authorization: Bearer` header or `accessToken` cookie
- Password hashing with bcrypt
- Schema validation on every request payload (Zod, both frontend and backend)
- Centralized error handling that never leaks internals to clients
- Secrets sourced from environment variables only

**Not yet implemented** (tracked in [progress.md](progress.md)):

- Audit logging of critical actions
- Refresh-token rotation
- RBAC middleware — role checks are currently ad-hoc and incomplete

---

# Technology Stack

## Frontend

- Next.js 16 (App Router)
- React 19 · TypeScript
- Tailwind CSS v4 with Material 3 design tokens
- `react-icons` + Material Symbols Outlined
- `react-hook-form` + Zod resolvers

## Backend

- Node.js
- Express 4
- TypeScript (strict)

## Database

- PostgreSQL
- Prisma 7 (`@prisma/adapter-pg`)

## Authentication

- JWT access tokens signed with `JWT_SECRET`
- Delivered as an `accessToken` cookie, accepted as cookie or Bearer header
- No refresh-token rotation yet — single access token

## Analytics / Charts

- Chart.js 4 via `react-chartjs-2`
- `arima` npm package for time-series forecasting

## Reporting

- `pdfkit` (PDF) · `exceljs` (XLSX/CSV)

---

# Expected Benefits

- Faster, more accurate field data capture than paper forms
- Immediate, automatic detection of SRP violations
- Official reports produced in seconds instead of manual compilation
- Consumer price transparency and better purchasing decisions
- Forecast-driven planning turns the system from a monitoring tool into a decision-support tool
