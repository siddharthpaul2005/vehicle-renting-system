package com.rental.backend.web;

import com.rental.backend.domain.Enums.FuelType;
import com.rental.backend.domain.Enums.Transmission;
import com.rental.backend.domain.Enums.VehicleType;
import com.rental.backend.dto.Dtos.VehicleResponse;
import com.rental.backend.service.VehicleService;
import com.rental.backend.service.VehicleService.Filter;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Public catalogue: anyone can browse. */
@RestController
@RequestMapping("/api/vehicles")
public class VehicleController {

    private final VehicleService vehicles;

    public VehicleController(VehicleService vehicles) {
        this.vehicles = vehicles;
    }

    @GetMapping
    public List<VehicleResponse> search(@RequestParam(required = false) String city,
                                        @RequestParam(required = false) String q,
                                        @RequestParam(required = false) VehicleType type,
                                        @RequestParam(required = false) FuelType fuel,
                                        @RequestParam(required = false) Transmission transmission,
                                        @RequestParam(defaultValue = "false") boolean availableOnly,
                                        @RequestParam(required = false) String sort) {
        return vehicles.search(new Filter(city, q, type, fuel, transmission, availableOnly, sort), false);
    }

    @GetMapping("/cities")
    public List<String> cities() {
        return vehicles.cities();
    }

    @GetMapping("/{id}")
    public VehicleResponse get(@PathVariable Long id) {
        return vehicles.get(id, false);
    }
}
