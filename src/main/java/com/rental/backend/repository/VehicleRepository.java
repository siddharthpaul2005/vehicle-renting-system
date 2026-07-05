package com.rental.backend.repository;

import com.rental.backend.model.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
    // Make sure it says AndStatus at the end instead of AndAvailable!
    List<Vehicle> findByCurrentHubLocationAndStatus(String currentHubLocation, String status);
}