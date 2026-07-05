package com.rental.backend.controller;

import com.rental.backend.model.Vehicle;
import com.rental.backend.service.VehicleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vehicles")
@CrossOrigin(origins = "*") // Allows seamless frontend connections
public class VehicleController {

    @Autowired
    private VehicleService vehicleService;

    @GetMapping
    public List<Vehicle> getAllVehicles() {
        return vehicleService.getAllVehicles();
    }

    @GetMapping("/search")
    public List<Vehicle> searchVehicles(@RequestParam String hubLocation) {
        return vehicleService.getAvailableVehiclesByHub(hubLocation);
    }

    @PostMapping
    public Vehicle addVehicle(@RequestBody Vehicle vehicle) {
        return vehicleService.addVehicle(vehicle);
    }

    @DeleteMapping("/{id}")
    public void deleteVehicle(@ModelAttribute("id") @PathVariable Long id) {
        vehicleService.removeVehicle(id);
    }

    @PostMapping("/{id}/rent")
    public Vehicle rentVehicle(@PathVariable Long id) {
        return vehicleService.rentVehicle(id);
    }

    @PostMapping("/{id}/return")
    public Vehicle returnVehicle(@PathVariable Long id) {
        return vehicleService.returnVehicle(id);
    }

    @PostMapping("/{id}/review")
    public Vehicle approveVehicle(@PathVariable Long id) {
        return vehicleService.adminApproveVehicle(id);
    }
}