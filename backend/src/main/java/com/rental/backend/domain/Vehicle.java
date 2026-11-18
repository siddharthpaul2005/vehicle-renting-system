package com.rental.backend.domain;

import com.rental.backend.domain.Enums.FuelType;
import com.rental.backend.domain.Enums.Transmission;
import com.rental.backend.domain.Enums.VehicleStatus;
import com.rental.backend.domain.Enums.VehicleType;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "vehicles")
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 60)
    private String brand;

    @Column(nullable = false, length = 60)
    private String model;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private VehicleType vehicleType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Transmission transmission;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private FuelType fuelType;

    @Column(nullable = false)
    private short seats;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal pricePerDay;

    @Column(nullable = false, length = 60)
    private String hubCity;

    @Column(length = 1000)
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private VehicleStatus status = VehicleStatus.AVAILABLE;

    /** Optimistic locking: two admins/customers can't silently overwrite each other. */
    @Version
    private long version;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    protected Vehicle() {}

    public Vehicle(String brand, String model, VehicleType vehicleType, Transmission transmission,
                   FuelType fuelType, int seats, BigDecimal pricePerDay, String hubCity, String imageUrl) {
        updateDetails(brand, model, vehicleType, transmission, fuelType, seats, pricePerDay, hubCity, imageUrl);
    }

    public void updateDetails(String brand, String model, VehicleType vehicleType, Transmission transmission,
                              FuelType fuelType, int seats, BigDecimal pricePerDay, String hubCity, String imageUrl) {
        this.brand = brand;
        this.model = model;
        this.vehicleType = vehicleType;
        this.transmission = transmission;
        this.fuelType = fuelType;
        this.seats = (short) seats;
        this.pricePerDay = pricePerDay;
        this.hubCity = hubCity;
        this.imageUrl = imageUrl;
    }

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public String getBrand() { return brand; }
    public String getModel() { return model; }
    public VehicleType getVehicleType() { return vehicleType; }
    public Transmission getTransmission() { return transmission; }
    public FuelType getFuelType() { return fuelType; }
    public int getSeats() { return seats; }
    public BigDecimal getPricePerDay() { return pricePerDay; }
    public String getHubCity() { return hubCity; }
    public String getImageUrl() { return imageUrl; }
    public VehicleStatus getStatus() { return status; }
    public void setStatus(VehicleStatus status) { this.status = status; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
