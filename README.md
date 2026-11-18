<div align="center">

# 🚗 DriveXpress

### Car rental platform: browse, book, drive, return. Every car is inspected before its next trip.

[![Java](https://img.shields.io/badge/Java-21-orange?logo=openjdk&logoColor=white)](#tech-stack)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.1-6DB33F?logo=springboot&logoColor=white)](#backend)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](#frontend)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](#frontend)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql&logoColor=white)](#database)
[![Flyway](https://img.shields.io/badge/Migrations-Flyway-CC0200?logo=flyway&logoColor=white)](#migrations)
[![Docker](https://img.shields.io/badge/Deploy-Docker%20%2B%20Render-2496ED?logo=docker&logoColor=white)](#deployment)

<img src="docs/screenshots/home.png" alt="DriveXpress home page" width="900" />

</div>

---

## Try it

| Role | Email | Password | What you can do |
|---|---|---|---|
| 👤 **Customer** | `demo@drivexpress.com` | `demo1234` | Browse, book a car, return it, see trip history |
| 🛠️ **Admin** | `admin@drivexpress.com` | `admin1234` | Everything above, plus fleet management, inspections and all bookings |

The login page has one-click buttons for both accounts, and anyone can also sign up for a new customer account. These demo accounts are public on purpose, and their passwords are reset every time the server starts (see [Seeding](#seeding)).

---

## Table of contents

1. [Overview](#overview)
2. [Features](#features)
3. [Screenshots](#screenshots)
4. [Tech stack](#tech-stack)
5. [System architecture](#system-architecture)
6. [Backend](#backend)
   - [Package layout](#package-layout) · [Request lifecycle](#request-lifecycle) · [Authentication & authorization](#authentication--authorization) · [Business rules](#business-rules) · [Concurrency control](#concurrency-control) · [Validation & errors](#validation--error-handling) · [Seeding](#seeding)
7. [Database](#database)
   - [ER diagram](#entity-relationship-diagram) · [Tables](#tables) · [Constraints & indexes](#constraints-and-indexes) · [Migrations](#migrations) · [Useful queries](#useful-queries)
8. [Frontend](#frontend)
9. [API reference](#api-reference)
10. [Getting started](#getting-started)
11. [Configuration](#configuration)
12. [Testing](#testing)
13. [Deployment](#deployment)
14. [Operations & troubleshooting](#operations--troubleshooting)
15. [Security](#security)
16. [Roadmap](#roadmap)
17. [Photo credits](#photo-credits)

---

## Overview

DriveXpress models the full lifecycle of a rental fleet:

- **Customers** browse cars across city hubs, book one for specific dates at a transparent daily price, and hand it back when they're done.
- **Admins** run the fleet: they add and edit cars, send them for servicing, retire them, and inspect every returned car before it can be rented again.

All business rules live on the server. The UI never decides whether a car can be rented; it only shows what the API allows. The database backs those rules up with `CHECK` constraints, foreign keys and a partial unique index, so the data stays consistent even under concurrent requests or direct API calls.

---

## Features

### Customers
- **Accounts:** sign up and log in with email and password. Passwords are BCrypt-hashed, sessions use JWTs and survive reloads, and sign-up has a password-strength meter and show/hide toggle.
- **Browse & filter:** free-text search, filters for city, body type, fuel, gearbox and "free right now", and sorting by name, price or newest. Filters live in the URL, so a search can be shared.
- **Book:** pick dates on the car's page and see the exact total (days × daily rate, ₹0 fees) before confirming.
- **My trips:** current and past trips with friendly status messages, a one-click return, and the inspection result once the car is checked.
- **Smart redirects:** trying to book while logged out sends you to log in, then straight back to the same car.

### Admins
- **Overview:** fleet size, cars ready, cars on trips, pending inspections, customers, booked revenue, a fleet-status bar and the latest bookings.
- **Fleet management:**
  - Add or edit cars, with a live image preview.
  - Send a car to the workshop, mark it fixed, retire it or reinstate it.
- **Inspection queue:** approve a returned car (back to the fleet), or record damage (notes required), which sends it to maintenance.
- **Bookings ledger:** every booking with customer, car, dates, total and status, filterable by status.

### Platform
- The lifecycle is enforced on the server; invalid status changes return `409 Conflict`.
- Double-booking is impossible: a row lock plus a database-level unique index.
- Every error is RFC 9457 problem JSON, with messages per field.
- Schema changes are versioned with Flyway, and Hibernate validates the schema at startup.
- One deployable: the React build ships inside the Spring Boot jar.

---

## Screenshots

| Sign up | Car details & booking |
|---|---|
| <img src="docs/screenshots/sign-up.png" width="440" /> | <img src="docs/screenshots/vehicle-detail.png" width="440" /> |
| **My trips** | **Admin: overview** |
| <img src="docs/screenshots/my-trips.png" width="440" /> | <img src="docs/screenshots/admin-overview.png" width="440" /> |
| **Admin: fleet** | **Mobile** |
| <img src="docs/screenshots/admin-fleet.png" width="440" /> | <img src="docs/screenshots/mobile.png" width="220" /> |

---

## Tech stack

| Layer | Technology | Why |
|---|---|---|
| Language | **Java 21** | LTS. Records for DTOs, switch expressions |
| Framework | **Spring Boot 4.1** (Web MVC, Data JPA, Validation, Security) | Batteries-included, well-known production stack |
| Auth | **Spring Security OAuth2 Resource Server** + Nimbus JOSE | Standard, audited JWT validation instead of hand-rolled parsing |
| ORM | **Hibernate 7** via Spring Data JPA | Repositories, derived queries, entity graphs, optimistic locking |
| Database | **PostgreSQL** (local 17, Neon serverless in production) | Partial indexes, `CHECK` constraints, `TIMESTAMPTZ`, row locks |
| Migrations | **Flyway** | Versioned, repeatable schema changes |
| Frontend | **React 19**, **TypeScript (strict)**, **Vite**, **Tailwind CSS v4**, React Router | Fast dev loop, type safety, utility-first glass design system |
| Testing | JUnit 5, Mockito, AssertJ | Fast unit tests for the booking state machine |
| Delivery | Multi-stage **Dockerfile** → **Render** | One image, non-root runtime |

---

## System architecture

```mermaid
flowchart LR
    subgraph Client
        UI["React SPA<br/>(TypeScript)"]
    end

    subgraph Render["Render: one Docker container"]
        direction TB
        SEC["Spring Security<br/>JWT filter · role rules · CORS"]
        CTRL["REST controllers<br/>/api/**"]
        SVC["Services<br/>business rules · transactions"]
        REPO["Spring Data JPA<br/>repositories"]
        SPA["Static React build<br/>+ SPA route forwarding"]
    end

    DB[("PostgreSQL<br/>Neon")]

    UI -- "HTTPS /api/** + Bearer JWT" --> SEC --> CTRL --> SVC --> REPO -- "JDBC / SSL" --> DB
    UI -- "GET /, /admin, /vehicles/…" --> SPA
```

- **Production:** a single container serves the API under `/api/**` and the compiled React app for everything else. Client-side routes such as `/admin` are forwarded to `index.html`, so deep links and refreshes work.
- **Development:** Vite serves the React app on `:5173` with hot reload and proxies `/api` to Spring Boot on `:8080`.
- **Stateless:** there are no server sessions; every request carries its JWT. Any number of app instances can run behind a load balancer, with the database as the only shared state.

---

## Backend

Source: [`backend/src/main/java/com/rental/backend`](backend/src/main/java/com/rental/backend)

### Package layout

| Package | Responsibility | Key types |
|---|---|---|
| `config` | Application wiring and startup data | `AppConfig` (a `Clock` fixed to Asia/Kolkata, so "today" is consistent and testable), `DataSeeder` |
| `domain` | JPA entities and enums: the core model | `User`, `Vehicle`, `Booking`, `Enums` (`Role`, `VehicleType`, `Transmission`, `FuelType`, `VehicleStatus`, `BookingStatus`) |
| `dto` | API request/response records. **Entities are never serialized directly** | `Dtos.*Request`, `Dtos.*Response` |
| `repository` | Data access through Spring Data JPA | `UserRepository`, `VehicleRepository`, `BookingRepository` |
| `service` | Business logic and transaction boundaries | `AuthService`, `VehicleService`, `BookingService`, `StatsService` |
| `security` | JWT issuing/validation, access rules, CORS, password hashing | `SecurityConfig`, `JwtService` |
| `web` | HTTP layer: thin controllers that delegate to services | `AuthController`, `VehicleController`, `BookingController`, `AdminController`, `SpaController` |
| `exception` | Error model and global translation to HTTP | `ApiException`, `GlobalExceptionHandler` |

Design rules the code follows:
- **Controllers are thin.** They validate input (`@Valid`), read the user from the JWT and call one service method.
- **Services own transactions.** Every public method is `@Transactional`, with `readOnly = true` for queries. Entities are mapped to DTOs inside the transaction, so lazy-loading never leaks out (`spring.jpa.open-in-view=false`).
- **Entities protect their own state.** State changes go through meaningful methods (`booking.markReturned()`, `booking.complete(...)`) rather than raw setters.

### Request lifecycle

Here is what happens when a customer books a car (`POST /api/bookings`):

```mermaid
sequenceDiagram
    autonumber
    participant UI as React app
    participant SEC as Security filter chain
    participant C as BookingController
    participant S as BookingService
    participant DB as PostgreSQL

    UI->>SEC: POST /api/bookings {vehicleId, startDate, endDate}<br/>Authorization: Bearer <JWT>
    SEC->>SEC: Verify HS256 signature, issuer, expiry<br/>Map "role" claim → ROLE_CUSTOMER
    SEC->>C: Authenticated request (Jwt principal)
    C->>C: @Valid → 400 with field errors if invalid
    C->>S: create(userId = jwt.sub, request)
    S->>S: validateDates() (not past, ≤ 90 days ahead, ≤ 30 days long)
    S->>DB: SELECT … FROM vehicles WHERE id = ? FOR UPDATE
    DB-->>S: vehicle row (locked until commit)
    alt status ≠ AVAILABLE
        S-->>UI: 409 "Sorry, this vehicle is no longer available."
    else available
        S->>DB: UPDATE vehicles SET status = 'RENTED', version = version + 1
        S->>DB: INSERT INTO bookings (…, total_price = days × rate, status = 'ACTIVE')
        S-->>C: BookingResponse
        C-->>UI: 201 Created
    end
```

### Authentication & authorization

**Sign-up / login** (`AuthService`)
- Emails are trimmed and lower-cased before they are stored or compared.
- Passwords are hashed with **BCrypt** (cost 10) and never returned or logged.
- Login answers both "unknown email" and "wrong password" with the same `401 "Invalid email or password."`, so it doesn't reveal which emails have accounts.
- Public sign-up can only create `CUSTOMER` accounts. Admins come from configuration ([Seeding](#seeding)).

**Tokens** (`JwtService`, `SecurityConfig`)

| Claim | Example | Purpose |
|---|---|---|
| `iss` | `drivexpress` | Validated on every request |
| `sub` | `42` | User ID used by the backend to identify the caller |
| `role` | `CUSTOMER` / `ADMIN` | Mapped to the Spring authority `ROLE_…` |
| `email`, `name` | | Convenience for clients |
| `iat`, `exp` | | Issued-at and expiry (default **24 h**, set with `JWT_EXPIRY_HOURS`) |

- Signed with **HS256** using `JWT_SECRET`. The app refuses to start if the secret is shorter than 32 bytes.
- Validated by Spring's OAuth2 Resource Server: signature, expiry and issuer are all checked.
- When a token expires or is invalid, the API returns `401`, and the frontend clears the stored session.

**Access rules** (evaluated in order)

| Request | Rule |
|---|---|
| `POST /api/auth/register`, `POST /api/auth/login` | Public |
| `GET /api/vehicles/**` | Public (the catalogue) |
| `/api/admin/**` | `ROLE_ADMIN` only (a customer gets `403`) |
| any other `/api/**` | Any logged-in user |
| everything else | Public (React static files) |

**Ownership:** customers can only list and return their *own* bookings. Someone else's booking ID returns `404`, not `403`, so it doesn't reveal that the booking exists.

The API is stateless, so there are no sessions or cookies and CSRF protection is disabled (it only matters for cookie-based auth). CORS is limited to `CORS_ALLOWED_ORIGINS`; in production the app is same-origin, so no CORS is needed.

### Business rules

**Vehicle lifecycle** (`VehicleStatus`)

```mermaid
stateDiagram-v2
    [*] --> AVAILABLE : admin adds car
    AVAILABLE --> RENTED : customer books
    RENTED --> UNDER_REVIEW : customer returns
    UNDER_REVIEW --> AVAILABLE : inspection passed
    UNDER_REVIEW --> MAINTENANCE : damage reported
    AVAILABLE --> MAINTENANCE : admin sends to service
    MAINTENANCE --> AVAILABLE : admin marks fixed
    AVAILABLE --> RETIRED : admin removes (has history)
    MAINTENANCE --> RETIRED : admin removes (has history)
    RETIRED --> AVAILABLE : admin reinstates
```

**Booking lifecycle** (`BookingStatus`)

```mermaid
stateDiagram-v2
    [*] --> ACTIVE : booked (vehicle → RENTED)
    ACTIVE --> RETURNED : customer returns (vehicle → UNDER_REVIEW)
    RETURNED --> COMPLETED : admin inspects (vehicle → AVAILABLE or MAINTENANCE)
```

**Rules enforced in the service layer**

| Rule | Where | Response if broken |
|---|---|---|
| Only `AVAILABLE` cars can be booked | `BookingService.create` | `409` |
| Start date ≥ today (India time) | `BookingService.validateDates` | `400` |
| Start date ≤ today + 90 days | `validateDates` | `400` |
| End date ≥ start date | `validateDates` (and a DB `CHECK`) | `400` |
| Rental length ≤ 30 days, counting both ends (same-day = 1 day) | `validateDates` | `400` |
| `total_price = days × price_per_day`, fixed at booking time | `Booking` constructor | n/a |
| Only the booking's owner can return it, and only while `ACTIVE` | `BookingService.returnVehicle` | `404` / `409` |
| Only `RETURNED` bookings can be inspected | `BookingService.inspect` | `409` |
| Reporting damage requires inspection notes | `BookingService.inspect` | `400` |
| Only an `AVAILABLE` car can be sent to maintenance | `VehicleService.sendToMaintenance` | `409` |
| Only a `MAINTENANCE`/`RETIRED` car can be made available | `VehicleService.markAvailable` | `409` |
| A car on a trip or awaiting inspection can't be removed | `VehicleService.remove` | `409` |
| Removing a car with booking history **retires** it (keeps records); a car never booked is deleted | `VehicleService.remove` | n/a |
| Hub city names are normalized (`"  new delhi "` → `"New Delhi"`) so filters group correctly | `VehicleService.titleCase` | n/a |

### Concurrency control

Three layers stop two people from renting the same car at the same moment:

1. **Pessimistic row lock:** `VehicleRepository.findByIdForUpdate` issues `SELECT … FOR UPDATE`. A second booking for the same car waits for the first transaction to finish, then sees `RENTED` and gets `409`.
2. **Optimistic locking:** `vehicles.version` (`@Version`) makes any update based on a stale read (for example, two admins editing the same car) fail with `409 "This record was changed by someone else."`.
3. **Database guarantee:** the partial unique index `uq_bookings_open_per_vehicle` allows at most one `ACTIVE`/`RETURNED` booking per vehicle, even if application code were bypassed.

### Validation & error handling

- Request DTOs are annotated with Jakarta Bean Validation (`@NotBlank`, `@Email`, `@Size`, `@Min`/`@Max`, `@DecimalMin`, `@Digits`, `@Pattern`).
- `GlobalExceptionHandler` turns every failure into **RFC 9457 `ProblemDetail`** JSON:

| Source | Status | Body |
|---|---|---|
| Bean validation | `400` | `detail` plus an `errors` map from field to message |
| `ApiException` (business rule) | `400`/`401`/`404`/`409` | Readable `detail` |
| Optimistic lock / constraint violation | `409` | "This record was changed by someone else. Refresh and try again." |
| Missing / invalid token | `401` | From Spring Security |
| Wrong role | `403` | From Spring Security |
| Anything unexpected | `500` | Generic message; the full stack trace is logged on the server only |

```json
{ "type": "about:blank", "title": "Bad Request", "status": 400,
  "detail": "Some fields are invalid.",
  "errors": { "email": "must be a well-formed email address", "password": "must be 8-72 characters" } }
```

### Seeding

`DataSeeder` runs on every start when `SEED_DATA=true` (the default). **It never deletes data.**

| What | Behaviour |
|---|---|
| Admin account (`ADMIN_EMAIL` / `ADMIN_PASSWORD`) | Created if missing. If it exists, its password is reset to the configured value |
| Demo customer (`DEMO_EMAIL` / `DEMO_PASSWORD`) | Same as the admin |
| Demo fleet (10 cars in 6 cities, with real photos) | Inserted **only if the `vehicles` table is empty** |

Keeping the passwords in sync means changing `ADMIN_PASSWORD` on the host and restarting is all it takes to rotate the admin password. Set `SEED_DATA=false` to turn seeding off completely.

---

## Database

PostgreSQL 14+ (developed on 17, runs on Neon in production). The schema is owned by **Flyway**; Hibernate only validates it (`ddl-auto: validate`) and never changes it.

### Entity-relationship diagram

```mermaid
erDiagram
    USERS ||--o{ BOOKINGS : "makes"
    VEHICLES ||--o{ BOOKINGS : "is rented in"

    USERS {
        BIGSERIAL id PK
        VARCHAR_100 full_name "NOT NULL"
        VARCHAR_255 email UK "NOT NULL, stored lower-case"
        VARCHAR_100 password_hash "NOT NULL, BCrypt"
        VARCHAR_20 role "CUSTOMER or ADMIN"
        TIMESTAMPTZ created_at "DEFAULT now()"
    }

    VEHICLES {
        BIGSERIAL id PK
        VARCHAR_60 brand "NOT NULL"
        VARCHAR_60 model "NOT NULL"
        VARCHAR_20 vehicle_type "HATCHBACK SEDAN SUV MUV LUXURY"
        VARCHAR_20 transmission "MANUAL AUTOMATIC"
        VARCHAR_20 fuel_type "PETROL DIESEL CNG EV HYBRID"
        SMALLINT seats "2 to 12"
        NUMERIC_10_2 price_per_day "greater than 0"
        VARCHAR_60 hub_city "NOT NULL"
        VARCHAR_1000 image_url "nullable"
        VARCHAR_20 status "AVAILABLE RENTED UNDER_REVIEW MAINTENANCE RETIRED"
        BIGINT version "optimistic lock"
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    BOOKINGS {
        BIGSERIAL id PK
        BIGINT user_id FK
        BIGINT vehicle_id FK
        DATE start_date "NOT NULL"
        DATE end_date "NOT NULL, at least start_date"
        NUMERIC_12_2 total_price "fixed at booking time"
        VARCHAR_20 status "ACTIVE RETURNED COMPLETED"
        VARCHAR_500 inspection_notes "nullable"
        BOOLEAN damage_reported "DEFAULT false"
        TIMESTAMPTZ created_at
        TIMESTAMPTZ returned_at "nullable"
        TIMESTAMPTZ completed_at "nullable"
    }
```

### Tables

#### `users`: people who can log in
| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `BIGSERIAL` | PK | Also the JWT `sub` |
| `full_name` | `VARCHAR(100)` | `NOT NULL` | |
| `email` | `VARCHAR(255)` | `NOT NULL`, `UNIQUE` | Lower-cased by the app; lookups are case-insensitive |
| `password_hash` | `VARCHAR(100)` | `NOT NULL` | BCrypt hash, e.g. `$2a$10$…` |
| `role` | `VARCHAR(20)` | `NOT NULL`, `CHECK IN ('CUSTOMER','ADMIN')` | |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | |

#### `vehicles`: the fleet
| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `BIGSERIAL` | PK | |
| `brand`, `model` | `VARCHAR(60)` | `NOT NULL` | |
| `vehicle_type` | `VARCHAR(20)` | `CHECK` enum | `HATCHBACK`, `SEDAN`, `SUV`, `MUV`, `LUXURY` |
| `transmission` | `VARCHAR(20)` | `CHECK` enum | `MANUAL`, `AUTOMATIC` |
| `fuel_type` | `VARCHAR(20)` | `CHECK` enum | `PETROL`, `DIESEL`, `CNG`, `EV`, `HYBRID` |
| `seats` | `SMALLINT` | `CHECK BETWEEN 2 AND 12` | |
| `price_per_day` | `NUMERIC(10,2)` | `CHECK > 0` | Exact decimal money, never floating point |
| `hub_city` | `VARCHAR(60)` | `NOT NULL` | Title-cased by the app |
| `image_url` | `VARCHAR(1000)` | nullable | The frontend shows a placeholder when empty or broken |
| `status` | `VARCHAR(20)` | `CHECK` enum | See [vehicle lifecycle](#business-rules) |
| `version` | `BIGINT` | `NOT NULL DEFAULT 0` | JPA `@Version` for optimistic locking |
| `created_at`, `updated_at` | `TIMESTAMPTZ` | `NOT NULL` | `updated_at` is maintained by `@PreUpdate` |

#### `bookings`: one row per rental
| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `BIGSERIAL` | PK | |
| `user_id` | `BIGINT` | `NOT NULL`, FK → `users(id)` | The customer |
| `vehicle_id` | `BIGINT` | `NOT NULL`, FK → `vehicles(id)` | |
| `start_date`, `end_date` | `DATE` | `NOT NULL`, `CHECK (end_date >= start_date)` | Calendar dates; both days are counted |
| `total_price` | `NUMERIC(12,2)` | `NOT NULL` | Snapshot at booking time; later price changes don't affect it |
| `status` | `VARCHAR(20)` | `CHECK IN ('ACTIVE','RETURNED','COMPLETED')` | |
| `inspection_notes` | `VARCHAR(500)` | nullable | Required when damage is reported |
| `damage_reported` | `BOOLEAN` | `NOT NULL DEFAULT false` | |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | |
| `returned_at`, `completed_at` | `TIMESTAMPTZ` | nullable | Audit trail of the lifecycle |

#### `flyway_schema_history`
Managed by Flyway; it records which migrations have been applied. Never edit it by hand.

### Constraints and indexes

| Name | Definition | Why it exists |
|---|---|---|
| `users_email_key` | `UNIQUE (email)` | One account per email |
| `idx_vehicles_status` | `(status)` | Catalogue and dashboard filter by status |
| `idx_vehicles_hub_city` | `(lower(hub_city))` | Case-insensitive city search |
| `idx_bookings_user` | `(user_id)` | "My trips" |
| `idx_bookings_vehicle` | `(vehicle_id)` | "Has this car ever been booked?" (retire vs delete) |
| `idx_bookings_status` | `(status)` | Inspection queue, dashboard counts |
| **`uq_bookings_open_per_vehicle`** | `UNIQUE (vehicle_id) WHERE status IN ('ACTIVE','RETURNED')` | Database-level guarantee that a car has at most one open rental |
| `chk_booking_dates` | `CHECK (end_date >= start_date)` | Impossible date ranges can't be stored |
| Foreign keys | `bookings.user_id`, `bookings.vehicle_id` (`NO ACTION` on delete) | History can't be orphaned. This is why cars with bookings are *retired*, not deleted |

**Data types:** money uses `NUMERIC`, never `FLOAT`, so there are no rounding errors. Timestamps use `TIMESTAMPTZ` and are stored in UTC (`hibernate.jdbc.time_zone=UTC`). Enums are stored as readable strings and guarded by `CHECK` constraints.

### Migrations

Migrations live in [`backend/src/main/resources/db/migration`](backend/src/main/resources/db/migration) and run automatically at startup.

| Version | File | Contents |
|---|---|---|
| V1 | `V1__init_schema.sql` | Tables, constraints and indexes above |

To change the schema:
1. Add a new file, e.g. `V2__add_vehicle_color.sql`. **Never edit a migration that has already run**: Flyway checksums each file and will refuse to start.
2. Update the matching JPA entity. Hibernate's `validate` mode fails fast at startup if the two disagree.
3. Restart. The migration applies itself on every environment, including Neon.

### Useful queries

```sql
-- Fleet by status
SELECT status, count(*) FROM vehicles GROUP BY status ORDER BY status;

-- Cars waiting for inspection, oldest first
SELECT b.id, v.brand, v.model, u.email, b.returned_at
FROM bookings b JOIN vehicles v ON v.id = b.vehicle_id JOIN users u ON u.id = b.user_id
WHERE b.status = 'RETURNED' ORDER BY b.returned_at;

-- Revenue per city
SELECT v.hub_city, sum(b.total_price) AS revenue, count(*) AS trips
FROM bookings b JOIN vehicles v ON v.id = b.vehicle_id
GROUP BY v.hub_city ORDER BY revenue DESC;

-- Applied migrations
SELECT version, description, installed_on, success FROM flyway_schema_history;
```

---

## Frontend

Source: [`frontend/src`](frontend/src)

| Folder | Contents |
|---|---|
| `auth/` | `AuthContext`: session state, login/register/logout, restores the session from the stored token via `/auth/me`, and reacts to expired tokens |
| `lib/` | `api.ts` (typed fetch client, Bearer token, `ApiError` with field errors), `types.ts` (mirrors the API DTOs), `format.ts` (₹, dates, inclusive day counts), `human.ts` (greetings and friendly status copy) |
| `components/` | `Layout` (glass navbar/footer), `VehicleCard`, `StatusBadge`, `Modal`, `Toast`, `ProtectedRoute` (login and role guards) |
| `pages/` | `HomePage`, `VehicleDetailPage`, `AuthPages`, `MyBookingsPage`, `admin/AdminPage` (overview, fleet, inspections, bookings), `CreditsPage` |

- **Design:** a frosted-glass system built as Tailwind v4 `@utility` classes (`glass`, `card`, `btn-*`, `input`, `chip`) over a warm gradient background. It is responsive down to 360 px and respects `prefers-reduced-motion`.
- **State:** server data is fetched per page, and filters are stored in the URL (`useSearchParams`), so views can be shared and survive a refresh.
- **Security:** the post-login `?next=` redirect only accepts same-site paths. The admin UI is hidden from customers, and the API enforces the same rule regardless.

---

## API reference

Base URL: `/api`. Authenticated endpoints need `Authorization: Bearer <token>`. All bodies are JSON.

### Auth
| Method | Path | Access | Body | Response |
|---|---|---|---|---|
| `POST` | `/auth/register` | Public | `{ fullName, email, password }` | `201` `{ token, expiresAt, user }` |
| `POST` | `/auth/login` | Public | `{ email, password }` | `200` `{ token, expiresAt, user }` |
| `GET` | `/auth/me` | Logged in | | `{ id, fullName, email, role }` |

### Catalogue
| Method | Path | Access | Notes |
|---|---|---|---|
| `GET` | `/vehicles` | Public | Query params: `city`, `q`, `type`, `fuel`, `transmission`, `availableOnly`, `sort` = `price_asc` / `price_desc` / `newest`. Retired cars are hidden |
| `GET` | `/vehicles/{id}` | Public | `404` if missing or retired |
| `GET` | `/vehicles/cities` | Public | Cities that have active cars |

### Bookings
| Method | Path | Access | Body / notes |
|---|---|---|---|
| `POST` | `/bookings` | Logged in | `{ vehicleId, startDate, endDate }` (ISO dates) → `201` |
| `GET` | `/bookings/me` | Logged in | Newest first |
| `POST` | `/bookings/{id}/return` | Owner | `ACTIVE` → `RETURNED` |

### Admin (`ROLE_ADMIN`)
| Method | Path | Notes |
|---|---|---|
| `GET` | `/admin/stats` | `{ totalVehicles, vehiclesByStatus, activeBookings, pendingInspections, completedBookings, customers, totalRevenue }` |
| `GET` | `/admin/vehicles` | Same filters as the catalogue, plus `includeRetired` (default `true`) |
| `POST` | `/admin/vehicles` | Create: `{ brand, model, vehicleType, transmission, fuelType, seats, pricePerDay, hubCity, imageUrl? }` |
| `PUT` | `/admin/vehicles/{id}` | Update details (status changes use the endpoints below) |
| `POST` | `/admin/vehicles/{id}/maintenance` | `AVAILABLE` → `MAINTENANCE` |
| `POST` | `/admin/vehicles/{id}/available` | `MAINTENANCE` / `RETIRED` → `AVAILABLE` |
| `DELETE` | `/admin/vehicles/{id}` | `204`. Deletes, or retires if the car has booking history |
| `GET` | `/admin/bookings?status=` | All bookings, optionally filtered |
| `POST` | `/admin/bookings/{id}/inspection` | `{ approved: boolean, notes?: string }` (notes required when `approved` is `false`) |

**Example:**
```bash
TOKEN=$(curl -s -X POST localhost:8080/api/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"demo@drivexpress.com","password":"demo1234"}' | jq -r .token)

curl -s -X POST localhost:8080/api/bookings -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"vehicleId":2,"startDate":"2026-12-01","endDate":"2026-12-03"}'
```

---

## Getting started

### Prerequisites
JDK **21+** · Node.js **20.19+** · PostgreSQL **14+** (or a free [Neon](https://neon.tech) database)

### 1. Clone and create a database
```bash
git clone https://github.com/siddharthpaul2005/vehicle-renting-system.git
cd vehicle-renting-system
psql -U postgres -c "CREATE DATABASE drivexpress;"
```

### 2. Configure
```bash
cp backend/.env.example backend/.env
```
Then set `DB_PASSWORD` and `JWT_SECRET` (any random string of 32+ characters) in `backend/.env`. The file is git-ignored.

### 3. Run the backend: http://localhost:8080
```bash
cd backend
./mvnw spring-boot:run          # Windows: .\mvnw.cmd spring-boot:run
```
Flyway creates the schema and the seeder adds the demo accounts and fleet.

### 4. Run the frontend: http://localhost:5173
```bash
cd frontend
npm install
npm run dev
```

Log in with `demo@drivexpress.com` / `demo1234` or `admin@drivexpress.com` / `admin1234`.

---

## Configuration

All settings are environment variables. Locally they can also come from `backend/.env`; real environment variables always win.

| Variable | Default | Description |
|---|---|---|
| `DB_URL` | `jdbc:postgresql://localhost:5432/drivexpress` | JDBC URL. **Required in production** |
| `DB_USERNAME` | `postgres` | |
| `DB_PASSWORD` | *(empty)* | |
| `DB_POOL_SIZE` | `5` | Max connections in the HikariCP pool |
| `JWT_SECRET` | dev-only value | **Required in production.** At least 32 characters |
| `JWT_EXPIRY_HOURS` | `24` | How long a login lasts |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Only needed if the frontend is hosted on another origin |
| `SEED_DATA` | `true` | Create/sync demo accounts and seed an empty fleet |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | `admin@drivexpress.com` / `admin1234` | Admin account (password re-applied on start) |
| `DEMO_EMAIL` / `DEMO_PASSWORD` | `demo@drivexpress.com` / `demo1234` | Demo customer account |
| `PORT` | `8080` | HTTP port (Render sets this itself) |
| `VITE_API_URL` *(frontend, build time)* | same origin | Point the SPA at an API on a different host |

---

## Testing

```bash
cd backend  && ./mvnw test      # JUnit 5 + Mockito: booking state machine, pricing, date rules, ownership
cd frontend && npm run build    # strict TypeScript type-check + production build
cd frontend && npm run lint     # oxlint
```

`BookingServiceTest` covers:
- inclusive day pricing
- refusing to rent an unavailable car
- past, reversed and too-long date ranges
- the full rent → return → damage → maintenance flow
- blocking returns of another user's booking
- requiring notes when damage is reported

Time-dependent logic uses an injected `Clock`, so tests are deterministic.

---

## Deployment

The production setup is **Neon** (serverless PostgreSQL) plus **Render** (one Docker web service).

### Docker image
The root [`Dockerfile`](Dockerfile) is a three-stage build:
1. `node:22-slim`: `npm ci && npm run build` produces the React bundle.
2. `maven:3.9-temurin-21`: copies the bundle into `static/` and runs `mvn package`, producing one fat jar.
3. `eclipse-temurin:21-jre-alpine`: a slim runtime running as a non-root user, with `-XX:MaxRAMPercentage=75`.

```bash
docker build -t drivexpress .
docker run -p 8080:8080 -e DB_URL=… -e DB_USERNAME=… -e DB_PASSWORD=… -e JWT_SECRET=… drivexpress
```

### Neon
1. Create a project (region: *AWS Asia Pacific (Singapore)* for India) and open **Connect**.
2. Turn **connection pooling off** and use the direct host (the one *without* `-pooler`). Flyway takes a session-level lock during migrations, which a transaction pooler breaks.
3. Convert the connection string to JDBC form, and drop `channel_binding` (`sslmode=require` is enough):
   ```
   postgresql://USER:PASS@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
   → DB_URL=jdbc:postgresql://ep-xxx.region.aws.neon.tech/neondb?sslmode=require
     DB_USERNAME=USER
     DB_PASSWORD=PASS
   ```

You don't run any SQL by hand: the first start creates the schema and the demo data.

### Render
1. **New → Web Service**, connect this repository, runtime **Docker**, branch `main`.
2. Under **Environment**, add `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` and `JWT_SECRET`. **Add from .env** lets you paste them all at once.
3. Optional: set **Health Check Path** to `/api/vehicles/cities`.
4. Deploy. Every push to `main` redeploys automatically. A healthy start logs:
   ```
   Successfully validated 1 migration
   Started VehicleRentalSystemApplication in … seconds
   ```

---

## Operations & troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `Connection to localhost:5432 refused` on Render | `DB_URL` not set, so the app falls back to its local default | Add the database env vars on Render and redeploy |
| Flyway hangs or fails with lock errors on Neon | Using the `-pooler` host | Use the direct (non-pooler) host |
| `Validate failed: Migration checksum mismatch` | An already-applied migration file was edited | Revert the edit and put the change in a new `V{n}__…sql` |
| `Schema-validation: missing column …` at startup | An entity changed without a migration | Add a migration for the change |
| Login returns `403` in local dev | The page's origin isn't in `CORS_ALLOWED_ORIGINS` | Use `localhost:5173` / `127.0.0.1:5173`, or add your origin |
| The first request after idling takes about 1 minute | Render's free plan sleeps after 15 minutes idle; Neon also auto-suspends | Expected on free plans; use a paid instance to avoid it |
| Blank page in local dev after many file edits | Vite served a stale module | Hard refresh (Ctrl+Shift+R) or restart `npm run dev` |

**Logs:** Render → service → **Logs**. Every unexpected error is logged with a full stack trace by `GlobalExceptionHandler`.
**Backups:** Neon keeps point-in-time history for each branch. Use **Branches → Restore**, or create a branch to test a migration against a copy of production data.
**Scaling:** the app is stateless. Add instances behind Render's load balancer, and keep `instances × DB_POOL_SIZE` within Neon's connection limit.

---

## Security

| Area | Measure |
|---|---|
| Passwords | BCrypt (cost 10); never logged or returned; 8–72 characters |
| Tokens | HS256 JWT; signature, issuer and expiry validated; secret must be ≥ 32 bytes |
| Authorization | Role rules on URL patterns; ownership checks in services; `404` for other users' records |
| Privilege escalation | Sign-up always creates `CUSTOMER`; admins only come from configuration |
| Input | Bean Validation on every request DTO; database `CHECK` constraints as a second line of defence |
| SQL injection | Only parameterized JPQL / Spring Data queries; no string-built SQL |
| Secrets | Environment variables only; `.env` and `deploy/render.env` are git-ignored |
| Redirects | The login `?next=` parameter accepts same-site paths only (no open redirects) |
| Container | Runs as a non-root user on a minimal JRE image |

> **Demo-mode note:** the demo admin credentials are public, so anyone can manage the fleet on the live demo. For a real deployment, set a strong `ADMIN_PASSWORD` and either a private `DEMO_PASSWORD` or `SEED_DATA=false`.

---

## Roadmap

- [ ] Online payments (Razorpay or Stripe) with refunds
- [ ] Future reservations that don't block the car until pick-up day
- [ ] Email notifications for bookings and inspection results
- [ ] Image uploads to object storage instead of URLs
- [ ] Password reset and email verification
- [ ] Integration tests with Testcontainers, plus CI on GitHub Actions
- [ ] Rate limiting on the auth endpoints

---

## Photo credits

The demo fleet uses real photos of each exact model from [Wikimedia Commons](https://commons.wikimedia.org), credited in the app at **`/credits`**.

| Car | Photographer | License |
|---|---|---|
| Mahindra Thar | Ank Kumar | CC BY-SA 4.0 |
| Hyundai Creta | CARS WORLD Kannada | CC BY 3.0 |
| Maruti Suzuki Swift | Alexander-93 | CC BY-SA 4.0 |
| Honda City | Dairokkan9 | CC BY-SA 4.0 |
| Tata Nexon EV | DriveSpark | CC BY 3.0 |
| Toyota Innova Crysta | Premnath Kudva | CC BY-SA 4.0 |
| Kia Seltos | Damian B Oh | CC BY-SA 4.0 |
| Mercedes-Benz C-Class | Alexander Migl | CC BY-SA 4.0 |
| Tata Tiago | Dairokkan9 | CC BY-SA 4.0 |
| Toyota Urban Cruiser Hyryder | DriveSpark | CC BY 3.0 |

Hero and sign-in background images are from [Unsplash](https://unsplash.com/license).
