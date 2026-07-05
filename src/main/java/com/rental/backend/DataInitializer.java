package com.rental.backend;

import com.rental.backend.model.Vehicle;
import com.rental.backend.repository.VehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private VehicleRepository vehicleRepository;

    @Override
    public void run(String... args) throws Exception {
        // Erase old data if structure changes to re-seed clean status lines
        vehicleRepository.deleteAll();
        
        vehicleRepository.save(new Vehicle(
            null, "Thar", "Mahindra", "SUV", "Manual", "Diesel", 3500.0, "Ahmedabad", "https://images.unsplash.com/photo-1609630875171-b1321377ee65?auto=format&fit=crop&w=600&q=80", "AVAILABLE"
        ));
        
        vehicleRepository.save(new Vehicle(
            null, "Creta", "Hyundai", "SUV", "Automatic", "Petrol", 2800.0, "Patna", "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80", "AVAILABLE"
        ));
        
        System.out.println("🌱 Cloud Database successfully updated with uniform Lifecycle Statuses!");
    }
}