package com.rental.backend.service;

import com.rental.backend.domain.Booking;
import com.rental.backend.domain.Enums.*;
import com.rental.backend.domain.User;
import com.rental.backend.domain.Vehicle;
import com.rental.backend.dto.Dtos.BookingRequest;
import com.rental.backend.dto.Dtos.InspectionRequest;
import com.rental.backend.exception.ApiException;
import com.rental.backend.repository.BookingRepository;
import com.rental.backend.repository.UserRepository;
import com.rental.backend.repository.VehicleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.*;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class BookingServiceTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 11, 18);

    private BookingRepository bookings;
    private VehicleRepository vehicles;
    private UserRepository users;
    private BookingService service;
    private Vehicle car;
    private User customer;

    @BeforeEach
    void setUp() {
        bookings = mock(BookingRepository.class);
        vehicles = mock(VehicleRepository.class);
        users = mock(UserRepository.class);
        Clock clock = Clock.fixed(TODAY.atStartOfDay(ZoneOffset.UTC).toInstant(), ZoneOffset.UTC);
        service = new BookingService(bookings, vehicles, users, clock);

        car = new Vehicle("Hyundai", "Creta", VehicleType.SUV, Transmission.AUTOMATIC, FuelType.PETROL,
                5, new BigDecimal("2800"), "Patna", null);
        ReflectionTestUtils.setField(car, "id", 7L);
        customer = new User("Asha", "asha@example.com", "hash", Role.CUSTOMER);
        ReflectionTestUtils.setField(customer, "id", 1L);

        when(vehicles.findByIdForUpdate(7L)).thenReturn(Optional.of(car));
        when(users.findById(1L)).thenReturn(Optional.of(customer));
        when(bookings.save(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void renting_marks_vehicle_rented_and_prices_inclusive_days() {
        var res = service.create(1L, new BookingRequest(7L, TODAY, TODAY.plusDays(2)));

        assertThat(res.days()).isEqualTo(3);
        assertThat(res.totalPrice()).isEqualByComparingTo("8400");
        assertThat(res.status()).isEqualTo(BookingStatus.ACTIVE);
        assertThat(car.getStatus()).isEqualTo(VehicleStatus.RENTED);
    }

    @Test
    void cannot_rent_a_vehicle_that_is_not_available() {
        car.setStatus(VehicleStatus.RENTED);

        assertThatThrownBy(() -> service.create(1L, new BookingRequest(7L, TODAY, TODAY)))
                .isInstanceOf(ApiException.class)
                .extracting(e -> ((ApiException) e).getStatus()).isEqualTo(HttpStatus.CONFLICT);
        verify(bookings, never()).save(any());
    }

    @Test
    void rejects_past_and_reversed_and_too_long_dates() {
        assertThatThrownBy(() -> service.validateDates(TODAY.minusDays(1), TODAY)).hasMessageContaining("past");
        assertThatThrownBy(() -> service.validateDates(TODAY.plusDays(3), TODAY.plusDays(1))).hasMessageContaining("End date");
        assertThatThrownBy(() -> service.validateDates(TODAY, TODAY.plusDays(30))).hasMessageContaining("at most");
    }

    @Test
    void full_lifecycle_return_then_damage_sends_car_to_maintenance() {
        Booking booking = new Booking(customer, car, TODAY, TODAY);
        car.setStatus(VehicleStatus.RENTED);
        when(bookings.findWithDetailsById(5L)).thenReturn(Optional.of(booking));

        service.returnVehicle(1L, 5L);
        assertThat(booking.getStatus()).isEqualTo(BookingStatus.RETURNED);
        assertThat(car.getStatus()).isEqualTo(VehicleStatus.UNDER_REVIEW);

        service.inspect(5L, new InspectionRequest(false, "Scratched rear bumper"));
        assertThat(booking.getStatus()).isEqualTo(BookingStatus.COMPLETED);
        assertThat(booking.isDamageReported()).isTrue();
        assertThat(car.getStatus()).isEqualTo(VehicleStatus.MAINTENANCE);
    }

    @Test
    void customer_cannot_return_someone_elses_booking() {
        Booking booking = new Booking(customer, car, TODAY, TODAY);
        when(bookings.findWithDetailsById(5L)).thenReturn(Optional.of(booking));

        assertThatThrownBy(() -> service.returnVehicle(99L, 5L))
                .isInstanceOf(ApiException.class)
                .extracting(e -> ((ApiException) e).getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void rejecting_a_return_requires_notes() {
        Booking booking = new Booking(customer, car, TODAY, TODAY);
        booking.markReturned();
        when(bookings.findWithDetailsById(5L)).thenReturn(Optional.of(booking));

        assertThatThrownBy(() -> service.inspect(5L, new InspectionRequest(false, "  ")))
                .hasMessageContaining("describe the damage");
    }
}
