package com.rental.backend.dto;

import com.rental.backend.domain.Booking;
import com.rental.backend.domain.Enums.*;
import com.rental.backend.domain.User;
import com.rental.backend.domain.Vehicle;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;

/** All request/response shapes of the API. Entities are never exposed directly. */
public final class Dtos {
    private Dtos() {}

    // ---------- Auth ----------

    public record RegisterRequest(
            @NotBlank @Size(max = 100) String fullName,
            @NotBlank @Email @Size(max = 255) String email,
            @NotBlank @Size(min = 8, max = 72, message = "must be 8-72 characters") String password) {}

    public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {}

    public record UserResponse(Long id, String fullName, String email, Role role) {
        public static UserResponse from(User u) {
            return new UserResponse(u.getId(), u.getFullName(), u.getEmail(), u.getRole());
        }
    }

    public record AuthResponse(String token, Instant expiresAt, UserResponse user) {}

    // ---------- Vehicles ----------

    public record VehicleRequest(
            @NotBlank @Size(max = 60) String brand,
            @NotBlank @Size(max = 60) String model,
            @NotNull VehicleType vehicleType,
            @NotNull Transmission transmission,
            @NotNull FuelType fuelType,
            @NotNull @Min(2) @Max(12) Integer seats,
            @NotNull @DecimalMin(value = "1.00") @Digits(integer = 8, fraction = 2) BigDecimal pricePerDay,
            @NotBlank @Size(max = 60) String hubCity,
            @Size(max = 1000) @Pattern(regexp = "^$|^https?://.+", message = "must be an http(s) URL") String imageUrl) {}

    public record VehicleResponse(Long id, String brand, String model, VehicleType vehicleType,
                                  Transmission transmission, FuelType fuelType, int seats,
                                  BigDecimal pricePerDay, String hubCity, String imageUrl,
                                  VehicleStatus status) {
        public static VehicleResponse from(Vehicle v) {
            return new VehicleResponse(v.getId(), v.getBrand(), v.getModel(), v.getVehicleType(),
                    v.getTransmission(), v.getFuelType(), v.getSeats(), v.getPricePerDay(),
                    v.getHubCity(), v.getImageUrl(), v.getStatus());
        }
    }

    // ---------- Bookings ----------

    public record BookingRequest(
            @NotNull Long vehicleId,
            @NotNull LocalDate startDate,
            @NotNull LocalDate endDate) {}

    public record InspectionRequest(
            @NotNull Boolean approved,
            @Size(max = 500) String notes) {}

    public record BookingVehicle(Long id, String brand, String model, String hubCity, String imageUrl,
                                 BigDecimal pricePerDay, VehicleStatus status) {}

    public record BookingCustomer(Long id, String fullName, String email) {}

    public record BookingResponse(Long id, BookingVehicle vehicle, BookingCustomer customer,
                                  LocalDate startDate, LocalDate endDate, long days,
                                  BigDecimal totalPrice, BookingStatus status,
                                  boolean damageReported, String inspectionNotes,
                                  Instant createdAt, Instant returnedAt, Instant completedAt) {
        public static BookingResponse from(Booking b) {
            Vehicle v = b.getVehicle();
            User u = b.getUser();
            return new BookingResponse(
                    b.getId(),
                    new BookingVehicle(v.getId(), v.getBrand(), v.getModel(), v.getHubCity(), v.getImageUrl(),
                            v.getPricePerDay(), v.getStatus()),
                    new BookingCustomer(u.getId(), u.getFullName(), u.getEmail()),
                    b.getStartDate(), b.getEndDate(), b.getDays(), b.getTotalPrice(), b.getStatus(),
                    b.isDamageReported(), b.getInspectionNotes(),
                    b.getCreatedAt(), b.getReturnedAt(), b.getCompletedAt());
        }
    }

    // ---------- Admin ----------

    public record StatsResponse(long totalVehicles, Map<VehicleStatus, Long> vehiclesByStatus,
                                long activeBookings, long pendingInspections, long completedBookings,
                                long customers, BigDecimal totalRevenue) {}
}
