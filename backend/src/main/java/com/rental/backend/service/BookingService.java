package com.rental.backend.service;

import com.rental.backend.domain.Booking;
import com.rental.backend.domain.Enums.BookingStatus;
import com.rental.backend.domain.Enums.VehicleStatus;
import com.rental.backend.domain.User;
import com.rental.backend.domain.Vehicle;
import com.rental.backend.dto.Dtos.BookingRequest;
import com.rental.backend.dto.Dtos.BookingResponse;
import com.rental.backend.dto.Dtos.InspectionRequest;
import com.rental.backend.exception.ApiException;
import com.rental.backend.repository.BookingRepository;
import com.rental.backend.repository.UserRepository;
import com.rental.backend.repository.VehicleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.util.List;

@Service
public class BookingService {

    static final int MAX_RENTAL_DAYS = 30;
    static final int MAX_DAYS_AHEAD = 90;

    private final BookingRepository bookings;
    private final VehicleRepository vehicles;
    private final UserRepository users;
    private final Clock clock;

    public BookingService(BookingRepository bookings, VehicleRepository vehicles, UserRepository users, Clock clock) {
        this.bookings = bookings;
        this.vehicles = vehicles;
        this.users = users;
        this.clock = clock;
    }

    /** Customer rents an AVAILABLE car. The vehicle row is locked so it can't be double-rented. */
    @Transactional
    public BookingResponse create(Long userId, BookingRequest req) {
        validateDates(req.startDate(), req.endDate());

        Vehicle vehicle = vehicles.findByIdForUpdate(req.vehicleId())
                .orElseThrow(() -> ApiException.notFound("Vehicle not found."));
        if (vehicle.getStatus() != VehicleStatus.AVAILABLE) {
            throw ApiException.conflict("Sorry, this vehicle is no longer available.");
        }
        User user = users.findById(userId)
                .orElseThrow(() -> ApiException.unauthorized("Account no longer exists."));

        vehicle.setStatus(VehicleStatus.RENTED);
        Booking booking = bookings.save(new Booking(user, vehicle, req.startDate(), req.endDate()));
        return BookingResponse.from(booking);
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> forUser(Long userId) {
        return bookings.findByUserIdOrderByCreatedAtDesc(userId).stream().map(BookingResponse::from).toList();
    }

    /** Customer hands the car back; it waits for admin inspection. */
    @Transactional
    public BookingResponse returnVehicle(Long userId, Long bookingId) {
        Booking booking = bookings.findWithDetailsById(bookingId)
                .filter(b -> b.getUser().getId().equals(userId))
                .orElseThrow(() -> ApiException.notFound("Booking not found."));
        if (booking.getStatus() != BookingStatus.ACTIVE) {
            throw ApiException.conflict("This booking has already been returned.");
        }
        booking.markReturned();
        booking.getVehicle().setStatus(VehicleStatus.UNDER_REVIEW);
        return BookingResponse.from(booking);
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> all(BookingStatus status) {
        List<Booking> list = status == null
                ? bookings.findAllByOrderByCreatedAtDesc()
                : bookings.findByStatusOrderByCreatedAtDesc(status);
        return list.stream().map(BookingResponse::from).toList();
    }

    /** Admin inspects a returned car: approve -> AVAILABLE, damage -> MAINTENANCE. */
    @Transactional
    public BookingResponse inspect(Long bookingId, InspectionRequest req) {
        Booking booking = bookings.findWithDetailsById(bookingId)
                .orElseThrow(() -> ApiException.notFound("Booking not found."));
        if (booking.getStatus() != BookingStatus.RETURNED) {
            throw ApiException.conflict("Only returned bookings can be inspected.");
        }
        boolean approved = req.approved();
        if (!approved && (req.notes() == null || req.notes().isBlank())) {
            throw ApiException.badRequest("Please describe the damage when rejecting a return.");
        }
        String notes = req.notes() == null || req.notes().isBlank() ? null : req.notes().trim();
        booking.complete(!approved, notes);
        booking.getVehicle().setStatus(approved ? VehicleStatus.AVAILABLE : VehicleStatus.MAINTENANCE);
        return BookingResponse.from(booking);
    }

    void validateDates(LocalDate start, LocalDate end) {
        LocalDate today = LocalDate.now(clock);
        if (start.isBefore(today)) {
            throw ApiException.badRequest("Start date can't be in the past.");
        }
        if (start.isAfter(today.plusDays(MAX_DAYS_AHEAD))) {
            throw ApiException.badRequest("Bookings can be made at most " + MAX_DAYS_AHEAD + " days ahead.");
        }
        if (end.isBefore(start)) {
            throw ApiException.badRequest("End date must be on or after the start date.");
        }
        if (Booking.daysBetween(start, end) > MAX_RENTAL_DAYS) {
            throw ApiException.badRequest("A single rental can be at most " + MAX_RENTAL_DAYS + " days.");
        }
    }
}
