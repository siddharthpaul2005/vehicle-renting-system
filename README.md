<div align="center">

# 🚗 DriveXpress

**A full-stack car rental platform: browse, book, drive, return. Every car is inspected by a real person before the next trip.**

![Java](https://img.shields.io/badge/Java-21-orange?logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.1-6DB33F?logo=springboot&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)

<img src="docs/screenshots/home.png" alt="DriveXpress home page" width="900" />

</div>

---

## Contents

- [Overview](#overview)
- [Features](#features)
- [Screenshots](#screenshots)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [API reference](#api-reference)
- [Testing](#testing)
- [Deployment](#deployment)
- [Security](#security)
- [Project structure](#project-structure)
- [Photo credits](#photo-credits)
- [Roadmap](#roadmap)

## Overview

DriveXpress models how a real rental fleet operates. **Customers** browse cars across city hubs, book them for specific dates at a transparent daily price, and hand them back when they're done. **Admins** run the fleet: they add and edit cars, send them for servicing, and inspect every returned car before it can be rented again.

All the business rules live on the server. The UI never decides whether a car can be rented; it only reflects what the API allows. The database backs those rules up with constraints, so the data stays consistent even when two people act at the same time.

## Features

### For customers
| | |
|---|---|
| 🔐 **Accounts** | Sign up and log in with email and password. Passwords are BCrypt-hashed. Sessions are JWT-based and survive page reloads. A password-strength meter and show/hide toggle help on sign-up. |
| 🔎 **Browse & filter** | Search by brand or model. Filter by city, body type, fuel, gearbox or "free right now", and sort by price or newest. Filters live in the URL, so a search can be shared. |
| 📅 **Book** | Pick dates on the car's page and see the exact total (days × daily rate, ₹0 fees) before confirming. Rentals can start up to 90 days ahead and last at most 30 days. |
| 🧳 **My trips** | Current and past trips with friendly status messages ("You're on the road, day 1 of 2. Drive safe!"), a one-click return, and the inspection outcome once checked. |
| ↩️ **Smart redirects** | If you try to book while logged out, you're sent to log in and brought straight back to the same car. |

### For admins
| | |
|---|---|
| 📊 **Overview** | Live stats: fleet size, cars ready, cars out on trips, pending inspections, customers and booked revenue. Also a fleet-status bar and the latest bookings. |
| 🚙 **Fleet management** | Add or edit cars (with image preview), send cars to the workshop, mark them fixed, retire or reinstate them. Cars with trip history are retired, not deleted, so records stay intact. |
| 🔍 **Inspections** | Every returned car lands in a queue. **Looks good** puts it back in the fleet. **Found damage** (notes required) sends it to the workshop and records the damage on the booking. |
| 📒 **Bookings** | Every booking with customer, car, dates, total and status, filterable by status. |

### Platform
- **Enforced lifecycle.** Invalid status changes are rejected with `409 Conflict`.
- **No double-booking.** The car's row is locked while it's being rented, and a partial unique index allows only one open booking per car.
- **Consistent errors.** Every error is RFC 9457 problem JSON, with per-field validation messages.
- **Versioned schema.** Flyway migrations, with Hibernate validating the schema at startup.
- **Safe seeding.** The first start creates an admin, a demo customer and a 10-car demo fleet. It never deletes data.
- **One deployable.** The React build is bundled into the Spring Boot jar, so a single Docker image serves everything.

### Vehicle lifecycle

```mermaid
stateDiagram-v2
    [*] --> AVAILABLE : admin adds car
    AVAILABLE --> RENTED : customer books
    RENTED --> UNDER_REVIEW : customer returns
    UNDER_REVIEW --> AVAILABLE : admin - looks good
    UNDER_REVIEW --> MAINTENANCE : admin - found damage
    AVAILABLE --> MAINTENANCE : admin - send to service
    MAINTENANCE --> AVAILABLE : admin - fixed
    AVAILABLE --> RETIRED : admin removes
    MAINTENANCE --> RETIRED : admin removes
    RETIRED --> AVAILABLE : admin reinstates
```

Bookings move `ACTIVE → RETURNED (awaiting inspection) → COMPLETED`.

## Screenshots

| Sign up | Car details & booking |
|---|---|
| <img src="docs/screenshots/sign-up.png" width="440" /> | <img src="docs/screenshots/vehicle-detail.png" width="440" /> |
| **My trips** | **Admin: overview** |
| <img src="docs/screenshots/my-trips.png" width="440" /> | <img src="docs/screenshots/admin-overview.png" width="440" /> |
| **Admin: fleet** | **Mobile** |
| <img src="docs/screenshots/admin-fleet.png" width="440" /> | <img src="docs/screenshots/mobile.png" width="220" /> |

## Tech stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4 (glassmorphism design system), React Router, lucide-react icons |
| **Backend** | Java 21, Spring Boot 4.1 (Web MVC, Data JPA, Validation, Security), OAuth2 Resource Server (JWT) |
| **Database** | PostgreSQL 17 locally, Neon in the cloud. Schema managed by Flyway |
| **Auth** | Stateless HS256 JWTs, BCrypt password hashing, role-based access (`CUSTOMER`, `ADMIN`) |
| **Testing** | JUnit 5, Mockito, AssertJ |
| **Ops** | Multi-stage Dockerfile (Node → Maven → JRE, non-root), deployable to Render |

## Architecture

```mermaid
flowchart LR
    subgraph Browser
        UI[React SPA]
    end
    subgraph "Spring Boot (one jar)"
        SEC[Security filter<br/>JWT + roles]
        CTRL[REST controllers]
        SVC[Services<br/>business rules]
        REPO[Spring Data JPA]
        STATIC[Static React build]
    end
    DB[(PostgreSQL)]

    UI -- "/api/** + Bearer token" --> SEC --> CTRL --> SVC --> REPO --> DB
    UI -- "/, /admin, /vehicles/…" --> STATIC
```

In development, Vite serves the React app on `:5173` and proxies `/api` to Spring Boot on `:8080`. In production, Spring Boot serves both. Client-side routes are forwarded to `index.html`, so deep links and refreshes work.

### Data model

```mermaid
erDiagram
    USERS ||--o{ BOOKINGS : makes
    VEHICLES ||--o{ BOOKINGS : "is rented in"
    USERS {
        bigint id PK
        varchar full_name
        varchar email UK
        varchar password_hash
        varchar role "CUSTOMER | ADMIN"
    }
    VEHICLES {
        bigint id PK
        varchar brand
        varchar model
        varchar vehicle_type "HATCHBACK | SEDAN | SUV | MUV | LUXURY"
        varchar transmission "MANUAL | AUTOMATIC"
        varchar fuel_type "PETROL | DIESEL | CNG | EV | HYBRID"
        smallint seats
        numeric price_per_day
        varchar hub_city
        varchar status
        bigint version "optimistic lock"
    }
    BOOKINGS {
        bigint id PK
        bigint user_id FK
        bigint vehicle_id FK
        date start_date
        date end_date
        numeric total_price
        varchar status "ACTIVE | RETURNED | COMPLETED"
        boolean damage_reported
        varchar inspection_notes
    }
```

## Getting started

### Prerequisites
- **JDK 21+**
- **Node.js 20+**
- **PostgreSQL 14+** running locally

### 1. Create the database
```sql
CREATE DATABASE drivexpress;
```

### 2. Configure secrets
```bash
cp backend/.env.example backend/.env
```
Then edit `backend/.env`: set `DB_PASSWORD` to your Postgres password and `JWT_SECRET` to any random string of 32 or more characters. The file is git-ignored.

### 3. Start the backend: http://localhost:8080
```bash
cd backend
./mvnw spring-boot:run            # Windows: .\mvnw.cmd spring-boot:run
```
On first start, Flyway creates the tables and the seeder adds the demo data.

### 4. Start the frontend: http://localhost:5173
```bash
cd frontend
npm install
npm run dev
```

### Demo accounts
| Role | Email | Password |
|---|---|---|
| Admin | `admin@drivexpress.com` | `Admin@123` |
| Customer | `demo@drivexpress.com` | `Demo@1234` |

In dev mode, the login page has one-click buttons that fill these in. You can also sign up as a new customer.

> ⚠️ Set `ADMIN_PASSWORD` before the first start in any shared or deployed environment.

## Configuration

All settings are environment variables. Locally they can also come from `backend/.env`; real environment variables always win.

| Variable | Default | Description |
|---|---|---|
| `DB_URL` | `jdbc:postgresql://localhost:5432/drivexpress` | JDBC connection URL |
| `DB_USERNAME` | `postgres` | Database user |
| `DB_PASSWORD` | *(empty)* | Database password |
| `JWT_SECRET` | dev-only value | **Required in production.** HS256 signing key, at least 32 characters |
| `JWT_EXPIRY_HOURS` | `24` | How long a login lasts |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Only needed when the frontend is hosted on a different origin |
| `SEED_DATA` | `true` | Create the admin, demo user and demo fleet if missing |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | `admin@drivexpress.com` / `Admin@123` | Initial admin account |
| `DB_POOL_SIZE` | `5` | Max database connections |
| `PORT` | `8080` | HTTP port |
| `VITE_API_URL` *(frontend, build time)* | *(same origin)* | Point the SPA at an API on another host |

## API reference

Base path: `/api`. Authenticated requests send `Authorization: Bearer <token>`.

### Auth
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Create a customer account → `{ token, expiresAt, user }` |
| `POST` | `/auth/login` | Public | Log in → `{ token, expiresAt, user }` |
| `GET` | `/auth/me` | Logged in | The current user |

### Catalogue
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/vehicles` | Public | Search. Query params: `city`, `q`, `type`, `fuel`, `transmission`, `availableOnly`, `sort` (`price_asc`, `price_desc`, `newest`) |
| `GET` | `/vehicles/{id}` | Public | One vehicle |
| `GET` | `/vehicles/cities` | Public | Cities that have active vehicles |

### Bookings
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/bookings` | Logged in | `{ vehicleId, startDate, endDate }` → books the car |
| `GET` | `/bookings/me` | Logged in | The current user's bookings |
| `POST` | `/bookings/{id}/return` | Owner | Return the car; it then awaits inspection |

### Admin
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/admin/stats` | Dashboard numbers |
| `GET` | `/admin/vehicles` | All vehicles, including retired |
| `POST` | `/admin/vehicles` | Add a vehicle |
| `PUT` | `/admin/vehicles/{id}` | Edit details |
| `POST` | `/admin/vehicles/{id}/maintenance` | `AVAILABLE` → `MAINTENANCE` |
| `POST` | `/admin/vehicles/{id}/available` | `MAINTENANCE`/`RETIRED` → `AVAILABLE` |
| `DELETE` | `/admin/vehicles/{id}` | Delete, or retire if the car has booking history |
| `GET` | `/admin/bookings?status=` | All bookings |
| `POST` | `/admin/bookings/{id}/inspection` | `{ approved, notes }`. Notes are required when `approved` is `false` |

### Errors
Every error is returned as [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457) problem JSON:
```json
{ "status": 409, "title": "Conflict", "detail": "Sorry, this vehicle is no longer available." }
```
Validation failures (`400`) also include an `errors` map:
```json
{ "status": 400, "detail": "Some fields are invalid.", "errors": { "password": "must be 8-72 characters" } }
```

## Testing

```bash
cd backend && ./mvnw test          # unit tests: booking lifecycle, pricing, date rules, ownership
cd frontend && npm run build       # strict TypeScript check + production build
cd frontend && npm run lint        # oxlint
```

## Deployment

### Docker
```bash
docker build -t drivexpress .
docker run -p 8080:8080 \
  -e DB_URL=jdbc:postgresql://host:5432/drivexpress \
  -e DB_USERNAME=postgres -e DB_PASSWORD=secret \
  -e JWT_SECRET=$(openssl rand -hex 32) \
  -e ADMIN_PASSWORD=change-me \
  drivexpress
```

### Render
Create a **Web Service** from this repository with runtime **Docker**. Set `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET` and `ADMIN_PASSWORD` in the environment. Render provides `PORT` automatically.

### Neon (cloud PostgreSQL)
No manual SQL is needed. Point the app at an **empty** Neon database and it sets everything up on first start.

1. In a Neon project, open **Connect** and copy the host, database, user and password. Neon shows a `postgresql://user:pass@host/db` URL; Spring needs it split into the JDBC form below.
2. Put the values in `backend/.env` for local runs against Neon, or in your host's environment variables:
   ```
   DB_URL=jdbc:postgresql://<endpoint>.<region>.aws.neon.tech/neondb?sslmode=require
   DB_USERNAME=<neon-user>
   DB_PASSWORD=<neon-password>
   ```
3. Start the app. Flyway creates the tables, and the seeder adds the admin account, the demo customer and the 10-car fleet with real photos.

> If you reuse a Neon database that already has tables from an older version of this project, Flyway will refuse to start. Use a fresh database or branch instead.

## Security

- Passwords are hashed with **BCrypt** and never logged or returned.
- JWTs are signed with HS256, and the issuer and expiry are validated on every request.
- Public sign-up can only create `CUSTOMER` accounts. Admins come from the seeder or the database.
- `/api/admin/**` requires `ROLE_ADMIN`. Customers can only see and return their own bookings; anyone else's booking returns `404`, so its existence isn't revealed.
- The login `?next=` redirect only accepts same-site paths, which prevents open redirects.
- Secrets come from the environment. `.env` files are git-ignored, and `backend/.env.example` documents them.
- CORS is limited to configured origins.

## Project structure

```
vehicle-renting-system/
├── backend/
│   ├── src/main/java/com/rental/backend/
│   │   ├── config/        Clock bean, demo-data seeder
│   │   ├── domain/        JPA entities (User, Vehicle, Booking) and enums
│   │   ├── dto/           API request/response records
│   │   ├── exception/     ApiException + global ProblemDetail handler
│   │   ├── repository/    Spring Data repositories
│   │   ├── security/      JWT service, security & CORS configuration
│   │   ├── service/       Auth, vehicle, booking and stats logic
│   │   └── web/           REST controllers, SPA forwarding
│   ├── src/main/resources/
│   │   ├── application.yml
│   │   └── db/migration/  Flyway migrations
│   └── src/test/          Unit tests
├── frontend/
│   └── src/
│       ├── auth/          Auth context (session, login, register)
│       ├── components/    Layout, cards, badges, modal, toasts
│       ├── lib/           API client, types, formatting, friendly-copy helpers
│       └── pages/         Home, vehicle detail, auth, my trips, admin
├── docs/screenshots/
└── Dockerfile
```

## Photo credits

The demo fleet uses real photos of each exact model from [Wikimedia Commons](https://commons.wikimedia.org), linked as 960px thumbnails. They are licensed CC BY or CC BY-SA, and are credited in the app at **`/credits`** (linked in the footer).

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

## Roadmap

- [ ] Online payments (e.g. Razorpay or Stripe) with refunds
- [ ] Future reservations without blocking the car until pick-up day
- [ ] Email notifications for bookings and inspection results
- [ ] Image uploads to object storage instead of image URLs
- [ ] Password reset and email verification
- [ ] Integration tests with Testcontainers
