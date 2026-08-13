# Database Design

## 1. Overview

This design supports the core business domains of PresyoSerbisyo: identity, commodity reference data, SRP pricing, the store registry, field price observations, generated reports, and forecasts.

It is structured to be:
- modular and extensible
- role-aware
- suitable for **PostgreSQL**
- compatible with **Prisma 7** (`@prisma/adapter-pg`)
- scalable for future growth

> Known schema defects are tracked in [progress.md](progress.md) → Blockers. Referenced inline below as **B-n**.

---

## 2. Database Principles

- Use relational tables for core entities and transactions
- Normalize recurring business data such as roles, categories, and statuses
- Support auditability through created/updated timestamps and audit logs
- Maintain referential integrity between related records
- Support reporting through summarized and relational data
- UUID primary keys throughout (`@db.Uuid`)
- Money stored as `Decimal(20, 4)` — **never** float

---

## 3. Core Database Modules

### 3.1 Authentication and Users

#### Tables
- `User`

#### Purpose
Stores user accounts, authentication details, and role assignment.

#### Role model — settled decision: **flat enum**

Role lives as a `UserRole` enum column directly on `User`. There is **no** `roles` / `permissions` / `user_roles` / `role_permissions` structure.

**Rationale:** the three roles (`ADMIN`, `OFFICER`, `PUBLIC`) are fixed by DTI's organizational structure and are not configured at runtime. A relational role model would add four tables and a permission-resolution layer to express what an enum expresses exactly.

**The tradeoff, explicitly:** "manage access permissions" can only ever mean *assign one of three fixed roles*. Granular per-capability permissions are **not supported** and would require migrating to the relational model — a schema migration, not a feature toggle.

Not implemented: `refresh_tokens`, `audit_logs`. The audit-logging requirement in [build-plan.md](build-plan.md) §4 therefore has no storage backing it (**B-6**).

#### Suggested Fields

users
- id (UUID, PK)
- name
- email (unique — the only index in the database)
- password (bcrypt hash)
- role (`UserRole`, default `PUBLIC`)
- is_active (default true)
- created_at

Missing vs. the standard: `updated_at`, `last_login_at` (**B-7**).

---

### 3.2 Commodity Catalog

#### Tables
- `Commodity`

#### Purpose
The catalog of goods DTI monitors. Parent of SRP entries, price records, and forecasts.

#### Suggested Fields

commodities
- id (UUID, PK)
- name
- status (free-text — should be an enum, **B-8**)
- category (free-text — should be an enum or lookup table, **B-8**)
- created_at

---

### 3.3 Suggested Retail Price

#### Tables
- `SRP`

#### Purpose
Effective-dated official prices. Multiple rows per commodity form a price history; the current SRP is the latest row whose `effectiveDate` has passed.

#### Suggested Fields

srps
- id (UUID, PK)
- commodity_id (FK → commodities.id)
- price (Decimal 20,4)
- effective_date
- created_at

---

### 3.4 Store Registry

#### Tables
- `Store`

#### Purpose
Retail establishments visited by officers. Owned by the registering officer, which is what makes officer-scoped queries possible.

#### Suggested Fields

stores
- id (UUID, PK)
- name
- location
- user_id (FK → users.id — the owning officer)
- last_visited (nullable)
- created_at

---

### 3.5 Price Records

#### Tables
- `PriceRecord`

#### Purpose
The core transactional table — one observed price, for one commodity, at one store, at one time, with its SRP compliance verdict computed at write time.

#### Suggested Fields

price_records
- id (UUID, PK)
- commodity_id (FK → commodities.id)
- store_id (FK → stores.id, **nullable**, `ON DELETE SET NULL`)
- user_id (FK → users.id — the recording officer)
- price (Decimal 20,4)
- date_and_time (when the price was observed)
- status (`PriceStatus`)
- created_at

> 🔴 **B-2 — nullability drift.** The database allows `store_id` to be `NULL`; `schema.prisma` still declares it non-null. See §5.

---

### 3.6 Reports

#### Tables
- `Report`

#### Purpose
Metadata for generated report files. The file itself lives on the backend filesystem.

#### Suggested Fields

reports
- id (UUID, PK)
- type (`ReportType`)
- generated_by (FK → users.id — drives report scoping)
- period (free-text period label)
- file_url (path under `/reports/files`)
- created_at

---

### 3.7 Forecasts

#### Tables
- `Forecast`

#### Purpose
Persisted ARIMA output — a predicted price for a commodity at a future date.

#### Suggested Fields

forecasts
- id (UUID, PK)
- commodity_id (FK → commodities.id)
- predicted_price (Decimal 20,4)
- confidence (Float)
- forecast_date
- created_at

---

## 4. Relationship Overview

The main relationships are:
- users -> stores (officer owns stores)
- users -> price_records (officer records prices)
- users -> reports (officer generates reports)
- commodities -> srps
- commodities -> price_records
- commodities -> forecasts
- stores -> price_records (`ON DELETE SET NULL`)

```text
User ──< Store ──< PriceRecord >── Commodity ──< SRP
 │                     │                └──< Forecast
 ├──────────────────────┘
 └──< Report
```

`User.id` is the scoping key for the entire RBAC model — officer-scoped queries filter `PriceRecord.userId` and `Report.generatedBy` ([architecture.md](architecture.md) §8).

---

## 5. Recommended ORM Models

Current Prisma models. The `storeId` correction for **B-2** is marked.

```prisma
model User {
  id        String        @id @default(uuid()) @db.Uuid
  name      String
  email     String        @unique
  password  String
  role      UserRole      @default(PUBLIC)
  isActive  Boolean       @default(true)
  createdAt DateTime      @default(now())
  prices    PriceRecord[]
  reports   Report[]
  stores    Store[]
}

model Commodity {
  id        String        @id @default(uuid()) @db.Uuid
  name      String
  status    String
  category  String
  createdAt DateTime      @default(now())
  srps      SRP[]
  prices    PriceRecord[]
  forecasts Forecast[]
}

model SRP {
  id            String    @id @default(uuid()) @db.Uuid
  commodityId   String    @db.Uuid
  price         Decimal   @db.Decimal(20, 4)
  effectiveDate DateTime
  createdAt     DateTime  @default(now())
  commodity     Commodity @relation(fields: [commodityId], references: [id])
}

model Store {
  id          String        @id @default(uuid()) @db.Uuid
  name        String
  location    String
  userId      String        @db.Uuid
  lastVisited DateTime?
  createdAt   DateTime      @default(now())
  prices      PriceRecord[]
  user        User          @relation(fields: [userId], references: [id])
}

model PriceRecord {
  id          String      @id @default(uuid()) @db.Uuid
  commodityId String      @db.Uuid
  storeId     String?     @db.Uuid   // B-2: currently String — must become String?
  userId      String      @db.Uuid
  price       Decimal     @db.Decimal(20, 4)
  dateAndTime DateTime
  status      PriceStatus
  createdAt   DateTime    @default(now())
  commodity   Commodity   @relation(fields: [commodityId], references: [id])
  store       Store?      @relation(fields: [storeId], references: [id])  // B-2: currently Store
  user        User        @relation(fields: [userId], references: [id])
}

model Report {
  id          String     @id @default(uuid()) @db.Uuid
  type        ReportType
  generatedBy String     @db.Uuid
  period      String
  fileUrl     String
  createdAt   DateTime   @default(now())
  user        User       @relation(fields: [generatedBy], references: [id])
}

model Forecast {
  id             String    @id @default(uuid()) @db.Uuid
  commodityId    String    @db.Uuid
  predictedPrice Decimal   @db.Decimal(20, 4)
  confidence     Float
  forecastDate   DateTime
  createdAt      DateTime  @default(now())
  commodity      Commodity @relation(fields: [commodityId], references: [id])
}
```

Live schema: [backend/prisma/schema.prisma](../backend/prisma/schema.prisma).

> **B-9** — the `postgresql` datasource block declares no `url`; the connection comes from `prisma.config.ts` / the adapter instead. It works, but it is non-obvious and breaks default `prisma migrate` ergonomics.

---

## 6. Suggested Indexes

### Existing

| Index | Table | Column |
|---|---|---|
| `User_email_key` | `User` | `email` (unique) |

**That is the only index in the database.**

### Recommended — not yet implemented (B-10)

Prisma does not auto-create foreign-key indexes on PostgreSQL, so every FK below is unindexed while being filtered on constantly:

| Table | Column(s) | Why |
|---|---|---|
| price_records | commodity_id | filtered on every commodity view |
| price_records | store_id | store price-history modal |
| price_records | user_id | **every officer-scoped query** |
| price_records | date_and_time | all range and trend queries |
| price_records | (commodity_id, date_and_time) | composite — the ARIMA series read |
| srps | (commodity_id, effective_date) | composite — current-SRP lookup |
| reports | generated_by | officer report scoping |
| forecasts | commodity_id | forecast retrieval |
| stores | user_id | officer store registry |

Invisible at demo data volumes; the first thing that hurts at scale.

---

## 7. Data Integrity Rules

- Enforce non-null fields where necessary
- Use foreign keys for relational integrity
- Restrict invalid statuses and role values via enums where possible
- Prevent duplicate records where uniqueness is a business rule
- Track created and updated timestamps for all major entities

### Enums in use

```prisma
enum UserRole    { ADMIN  OFFICER  PUBLIC }
enum PriceStatus { COMPLIANT  OVERPRICE  UNDERPRICE }
enum ReportType  { MONTHLY  SRP_COMPLIANCE  TREND }
```

### Integrity gaps

| Gap | Ref |
|---|---|
| No `updated_at` on **any** model — modification time is unrecoverable | B-7 |
| `commodities.status` / `commodities.category` unconstrained free-text | B-8 |
| No uniqueness rule preventing duplicate price records for the same store + commodity + timestamp | B-11 |
| No `CHECK` constraint enforcing non-negative prices | B-11 |
| No seed script producing reproducible demo data ([build-plan.md](build-plan.md) Phase 0.5) | B-12 |
