CREATE TABLE users (
    id            BIGSERIAL PRIMARY KEY,
    full_name     VARCHAR(100) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(100) NOT NULL,
    role          VARCHAR(20)  NOT NULL CHECK (role IN ('CUSTOMER', 'ADMIN')),
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE vehicles (
    id            BIGSERIAL PRIMARY KEY,
    brand         VARCHAR(60)    NOT NULL,
    model         VARCHAR(60)    NOT NULL,
    vehicle_type  VARCHAR(20)    NOT NULL CHECK (vehicle_type IN ('HATCHBACK', 'SEDAN', 'SUV', 'MUV', 'LUXURY')),
    transmission  VARCHAR(20)    NOT NULL CHECK (transmission IN ('MANUAL', 'AUTOMATIC')),
    fuel_type     VARCHAR(20)    NOT NULL CHECK (fuel_type IN ('PETROL', 'DIESEL', 'CNG', 'EV', 'HYBRID')),
    seats         SMALLINT       NOT NULL CHECK (seats BETWEEN 2 AND 12),
    price_per_day NUMERIC(10, 2) NOT NULL CHECK (price_per_day > 0),
    hub_city      VARCHAR(60)    NOT NULL,
    image_url     VARCHAR(1000),
    status        VARCHAR(20)    NOT NULL CHECK (status IN ('AVAILABLE', 'RENTED', 'UNDER_REVIEW', 'MAINTENANCE', 'RETIRED')),
    version       BIGINT         NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE INDEX idx_vehicles_status   ON vehicles (status);
CREATE INDEX idx_vehicles_hub_city ON vehicles (lower(hub_city));

CREATE TABLE bookings (
    id               BIGSERIAL PRIMARY KEY,
    user_id          BIGINT         NOT NULL REFERENCES users (id),
    vehicle_id       BIGINT         NOT NULL REFERENCES vehicles (id),
    start_date       DATE           NOT NULL,
    end_date         DATE           NOT NULL,
    total_price      NUMERIC(12, 2) NOT NULL,
    status           VARCHAR(20)    NOT NULL CHECK (status IN ('ACTIVE', 'RETURNED', 'COMPLETED')),
    inspection_notes VARCHAR(500),
    damage_reported  BOOLEAN        NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ    NOT NULL DEFAULT now(),
    returned_at      TIMESTAMPTZ,
    completed_at     TIMESTAMPTZ,
    CONSTRAINT chk_booking_dates CHECK (end_date >= start_date)
);

CREATE INDEX idx_bookings_user    ON bookings (user_id);
CREATE INDEX idx_bookings_vehicle ON bookings (vehicle_id);
CREATE INDEX idx_bookings_status  ON bookings (status);

-- A vehicle can have at most one open (ACTIVE or RETURNED) booking at a time.
CREATE UNIQUE INDEX uq_bookings_open_per_vehicle ON bookings (vehicle_id) WHERE status IN ('ACTIVE', 'RETURNED');
