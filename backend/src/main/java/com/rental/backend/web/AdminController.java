package com.rental.backend.web;

import com.rental.backend.domain.Enums.BookingStatus;
import com.rental.backend.domain.Enums.FuelType;
import com.rental.backend.domain.Enums.Transmission;
import com.rental.backend.domain.Enums.VehicleType;
import com.rental.backend.dto.Dtos.*;
import com.rental.backend.service.BookingService;
import com.rental.backend.service.StatsService;
import com.rental.backend.service.VehicleService;
import com.rental.backend.service.VehicleService.Filter;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Fleet + booking management. Secured to ROLE_ADMIN in SecurityConfig. */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final VehicleService vehicles;
    private final BookingService bookings;
    private final StatsService stats;

    public AdminController(VehicleService vehicles, BookingService bookings, StatsService stats) {
        this.vehicles = vehicles;
        this.bookings = bookings;
        this.stats = stats;
    }

    @GetMapping("/stats")
    public StatsResponse stats() {
        return stats.stats();
    }

    // ----- vehicles -----

    @GetMapping("/vehicles")
    public List<VehicleResponse> vehicles(@RequestParam(required = false) String city,
                                          @RequestParam(required = false) String q,
                                          @RequestParam(required = false) VehicleType type,
                                          @RequestParam(required = false) FuelType fuel,
                                          @RequestParam(required = false) Transmission transmission,
                                          @RequestParam(defaultValue = "true") boolean includeRetired,
                                          @RequestParam(required = false) String sort) {
        return vehicles.search(new Filter(city, q, type, fuel, transmission, false, sort), includeRetired);
    }

    @PostMapping("/vehicles")
    @ResponseStatus(HttpStatus.CREATED)
    public VehicleResponse create(@Valid @RequestBody VehicleRequest req) {
        return vehicles.create(req);
    }

    @PutMapping("/vehicles/{id}")
    public VehicleResponse update(@PathVariable Long id, @Valid @RequestBody VehicleRequest req) {
        return vehicles.update(id, req);
    }

    @PostMapping("/vehicles/{id}/maintenance")
    public VehicleResponse maintenance(@PathVariable Long id) {
        return vehicles.sendToMaintenance(id);
    }

    @PostMapping("/vehicles/{id}/available")
    public VehicleResponse available(@PathVariable Long id) {
        return vehicles.markAvailable(id);
    }

    @DeleteMapping("/vehicles/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(@PathVariable Long id) {
        vehicles.remove(id);
    }

    // ----- bookings -----

    @GetMapping("/bookings")
    public List<BookingResponse> bookings(@RequestParam(required = false) BookingStatus status) {
        return bookings.all(status);
    }

    @PostMapping("/bookings/{id}/inspection")
    public BookingResponse inspect(@PathVariable Long id, @Valid @RequestBody InspectionRequest req) {
        return bookings.inspect(id, req);
    }
}
