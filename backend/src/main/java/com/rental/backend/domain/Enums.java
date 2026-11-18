package com.rental.backend.domain;

/** Namespace holder for small domain enums so they live next to each other. */
public final class Enums {
    private Enums() {}

    public enum Role { CUSTOMER, ADMIN }

    public enum VehicleType { HATCHBACK, SEDAN, SUV, MUV, LUXURY }

    public enum Transmission { MANUAL, AUTOMATIC }

    public enum FuelType { PETROL, DIESEL, CNG, EV, HYBRID }

    /**
     * Vehicle lifecycle:
     * AVAILABLE -> RENTED (customer books) -> UNDER_REVIEW (customer returns)
     * -> AVAILABLE (admin accepts) | MAINTENANCE (admin reports damage)
     * MAINTENANCE -> AVAILABLE (repairs done). Any idle vehicle can be RETIRED and reinstated.
     */
    public enum VehicleStatus { AVAILABLE, RENTED, UNDER_REVIEW, MAINTENANCE, RETIRED }

    /** ACTIVE (car with customer) -> RETURNED (awaiting inspection) -> COMPLETED. */
    public enum BookingStatus { ACTIVE, RETURNED, COMPLETED }
}
