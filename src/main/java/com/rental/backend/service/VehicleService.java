package com.rental.backend.service;

import com.rental.backend.model.Vehicle;
import com.rental.backend.repository.VehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class VehicleService {

    @Autowired
    private VehicleRepository vehicleRepository;

    public List<Vehicle> getAllVehicles() {
        return vehicleRepository.findAll();
    }

    public List<Vehicle> getAvailableVehiclesByHub(String hubLocation) {
        return vehicleRepository.findByCurrentHubLocationAndStatus(hubLocation, "AVAILABLE");
    }

    public Vehicle addVehicle(Vehicle vehicle) {
        if (vehicle.getStatus() == null) {
            vehicle.setStatus("AVAILABLE"); // New cars start out ready to rent
        }
        return vehicleRepository.save(vehicle);
    }

    public void removeVehicle(Long id) {
        vehicleRepository.deleteById(id);
    }

    // Lifecycle Action 1: User rents the car
    public Vehicle rentVehicle(Long id) {
        Vehicle vehicle = vehicleRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Vehicle not found"));
        vehicle.setStatus("RENTED");
        return vehicleRepository.save(vehicle);
    }

    // Lifecycle Action 2: User returns the car -> changes status to wait for admin review
    public Vehicle returnVehicle(Long id) {
        Vehicle vehicle = vehicleRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Vehicle not found"));
        vehicle.setStatus("UNDER_REVIEW");
        return vehicleRepository.save(vehicle);
    }

    // Lifecycle Action 3: Admin reviews the condition and posts it back onto the live stream
    public Vehicle adminApproveVehicle(Long id) {
        Vehicle vehicle = vehicleRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Vehicle not found"));
        vehicle.setStatus("AVAILABLE");
        return vehicleRepository.save(vehicle);
    }
}