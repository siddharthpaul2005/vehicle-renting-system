package com.rental.backend.service;

import com.rental.backend.domain.Enums.FuelType;
import com.rental.backend.domain.Enums.Transmission;
import com.rental.backend.domain.Enums.VehicleStatus;
import com.rental.backend.domain.Enums.VehicleType;
import com.rental.backend.domain.Vehicle;
import com.rental.backend.dto.Dtos.VehicleRequest;
import com.rental.backend.dto.Dtos.VehicleResponse;
import com.rental.backend.exception.ApiException;
import com.rental.backend.repository.BookingRepository;
import com.rental.backend.repository.VehicleRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumSet;
import java.util.List;
import java.util.Set;

@Service
public class VehicleService {

    /** Everything a customer may see in the catalogue (retired cars are hidden). */
    private static final Set<VehicleStatus> VISIBLE = EnumSet.complementOf(EnumSet.of(VehicleStatus.RETIRED));

    private final VehicleRepository vehicles;
    private final BookingRepository bookings;

    public VehicleService(VehicleRepository vehicles, BookingRepository bookings) {
        this.vehicles = vehicles;
        this.bookings = bookings;
    }

    public record Filter(String city, String q, VehicleType type, FuelType fuel,
                         Transmission transmission, boolean availableOnly, String sort) {}

    @Transactional(readOnly = true)
    public List<VehicleResponse> search(Filter f, boolean includeRetired) {
        Set<VehicleStatus> statuses = f.availableOnly()
                ? EnumSet.of(VehicleStatus.AVAILABLE)
                : includeRetired ? EnumSet.allOf(VehicleStatus.class) : VISIBLE;
        return vehicles.search(statuses, blankToEmpty(f.city()), blankToEmpty(f.q()),
                        f.type(), f.fuel(), f.transmission(), toSort(f.sort()))
                .stream().map(VehicleResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public VehicleResponse get(Long id, boolean includeRetired) {
        Vehicle v = find(id);
        if (!includeRetired && v.getStatus() == VehicleStatus.RETIRED) {
            throw ApiException.notFound("Vehicle not found.");
        }
        return VehicleResponse.from(v);
    }

    @Transactional(readOnly = true)
    public List<String> cities() {
        return vehicles.findActiveCities();
    }

    @Transactional
    public VehicleResponse create(VehicleRequest r) {
        Vehicle v = new Vehicle(r.brand().trim(), r.model().trim(), r.vehicleType(), r.transmission(),
                r.fuelType(), r.seats(), r.pricePerDay(), titleCase(r.hubCity()), emptyToNull(r.imageUrl()));
        return VehicleResponse.from(vehicles.save(v));
    }

    @Transactional
    public VehicleResponse update(Long id, VehicleRequest r) {
        Vehicle v = find(id);
        v.updateDetails(r.brand().trim(), r.model().trim(), r.vehicleType(), r.transmission(),
                r.fuelType(), r.seats(), r.pricePerDay(), titleCase(r.hubCity()), emptyToNull(r.imageUrl()));
        return VehicleResponse.from(v);
    }

    /** Admin grounds an idle car for servicing. */
    @Transactional
    public VehicleResponse sendToMaintenance(Long id) {
        Vehicle v = find(id);
        requireStatus(v, "send to maintenance", VehicleStatus.AVAILABLE);
        v.setStatus(VehicleStatus.MAINTENANCE);
        return VehicleResponse.from(v);
    }

    /** Admin puts a repaired or retired car back on the catalogue. */
    @Transactional
    public VehicleResponse markAvailable(Long id) {
        Vehicle v = find(id);
        requireStatus(v, "make available", VehicleStatus.MAINTENANCE, VehicleStatus.RETIRED);
        v.setStatus(VehicleStatus.AVAILABLE);
        return VehicleResponse.from(v);
    }

    /**
     * Cars with booking history are retired (kept for records); cars never booked are deleted.
     * A car that is currently rented or awaiting inspection can't be removed.
     */
    @Transactional
    public void remove(Long id) {
        Vehicle v = find(id);
        if (v.getStatus() == VehicleStatus.RENTED || v.getStatus() == VehicleStatus.UNDER_REVIEW) {
            throw ApiException.conflict("This vehicle has an open rental. Finish it before removing the vehicle.");
        }
        if (bookings.existsByVehicleId(id)) {
            v.setStatus(VehicleStatus.RETIRED);
        } else {
            vehicles.delete(v);
        }
    }

    private Vehicle find(Long id) {
        return vehicles.findById(id).orElseThrow(() -> ApiException.notFound("Vehicle not found."));
    }

    static void requireStatus(Vehicle v, String action, VehicleStatus... allowed) {
        for (VehicleStatus s : allowed) {
            if (v.getStatus() == s) return;
        }
        throw ApiException.conflict("Cannot " + action + " a vehicle that is " + v.getStatus() + ".");
    }

    private static Sort toSort(String sort) {
        if (sort == null) return Sort.by("brand", "model");
        return switch (sort) {
            case "price_asc" -> Sort.by("pricePerDay").ascending();
            case "price_desc" -> Sort.by("pricePerDay").descending();
            case "newest" -> Sort.by("createdAt").descending();
            default -> Sort.by("brand", "model");
        };
    }

    private static String blankToEmpty(String s) {
        return s == null ? "" : s.trim();
    }

    private static String emptyToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    /** "  new delhi " -> "New Delhi" so city filters group consistently. */
    static String titleCase(String s) {
        String[] parts = s.trim().toLowerCase().split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (String p : parts) {
            if (sb.length() > 0) sb.append(' ');
            sb.append(Character.toUpperCase(p.charAt(0))).append(p.substring(1));
        }
        return sb.toString();
    }
}
