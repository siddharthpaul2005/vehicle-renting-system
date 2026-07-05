package com.rental.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "vehicles")
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String modelName;
    private String brand;
    private String vehicleType;
    private String transmission;
    private String fuelType;
    private Double pricePerDay;
    private String currentHubLocation;
    private String imageUrl;
    private String status; // <-- Make sure this is here!

    public Vehicle() {}

    public Vehicle(Long id, String modelName, String brand, String vehicleType, String transmission, 
                   String fuelType, Double pricePerDay, String currentHubLocation, String imageUrl, String status) {
        this.id = id;
        this.modelName = modelName;
        this.brand = brand;
        this.vehicleType = vehicleType;
        this.transmission = transmission;
        this.fuelType = fuelType;
        this.pricePerDay = pricePerDay;
        this.currentHubLocation = currentHubLocation;
        this.imageUrl = imageUrl;
        this.status = status;
    }

    // Standard Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getModelName() { return modelName; }
    public void setModelName(String modelName) { this.modelName = modelName; }

    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }

    public String getVehicleType() { return vehicleType; }
    public void setVehicleType(String vehicleType) { this.vehicleType = vehicleType; }

    public String getTransmission() { return transmission; }
    public void setTransmission(String transmission) { this.transmission = transmission; }

    public String getFuelType() { return fuelType; }
    public void setFuelType(String fuelType) { this.fuelType = fuelType; }

    public Double getPricePerDay() { return pricePerDay; }
    public void setPricePerDay(Double pricePerDay) { this.pricePerDay = pricePerDay; }

    public String getCurrentHubLocation() { return currentHubLocation; }
    public void setCurrentHubLocation(String currentHubLocation) { this.currentHubLocation = currentHubLocation; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public String getStatus() { return status; } // <-- Required for line 24
    public void setStatus(String status) { this.status = status; } // <-- Required for line 25
}