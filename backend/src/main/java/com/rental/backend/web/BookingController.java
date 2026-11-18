package com.rental.backend.web;

import com.rental.backend.dto.Dtos.BookingRequest;
import com.rental.backend.dto.Dtos.BookingResponse;
import com.rental.backend.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** The logged-in user's own rentals. */
@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookings;

    public BookingController(BookingService bookings) {
        this.bookings = bookings;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BookingResponse create(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody BookingRequest req) {
        return bookings.create(CurrentUser.id(jwt), req);
    }

    @GetMapping("/me")
    public List<BookingResponse> mine(@AuthenticationPrincipal Jwt jwt) {
        return bookings.forUser(CurrentUser.id(jwt));
    }

    @PostMapping("/{id}/return")
    public BookingResponse returnVehicle(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return bookings.returnVehicle(CurrentUser.id(jwt), id);
    }
}
