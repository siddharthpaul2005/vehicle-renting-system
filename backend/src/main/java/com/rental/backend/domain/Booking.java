package com.rental.backend.domain;

import com.rental.backend.domain.Enums.BookingStatus;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@Entity
@Table(name = "bookings")
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate endDate;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal totalPrice;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BookingStatus status;

    @Column(length = 500)
    private String inspectionNotes;

    @Column(nullable = false)
    private boolean damageReported;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    private Instant returnedAt;
    private Instant completedAt;

    protected Booking() {}

    public Booking(User user, Vehicle vehicle, LocalDate startDate, LocalDate endDate) {
        this.user = user;
        this.vehicle = vehicle;
        this.startDate = startDate;
        this.endDate = endDate;
        this.totalPrice = vehicle.getPricePerDay().multiply(BigDecimal.valueOf(daysBetween(startDate, endDate)));
        this.status = BookingStatus.ACTIVE;
    }

    /** Rental days are inclusive: a same-day rental counts as 1 day. */
    public static long daysBetween(LocalDate start, LocalDate end) {
        return ChronoUnit.DAYS.between(start, end) + 1;
    }

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }

    public void markReturned() {
        status = BookingStatus.RETURNED;
        returnedAt = Instant.now();
    }

    public void complete(boolean damageReported, String notes) {
        this.status = BookingStatus.COMPLETED;
        this.damageReported = damageReported;
        this.inspectionNotes = notes;
        this.completedAt = Instant.now();
    }

    public long getDays() { return daysBetween(startDate, endDate); }

    public Long getId() { return id; }
    public User getUser() { return user; }
    public Vehicle getVehicle() { return vehicle; }
    public LocalDate getStartDate() { return startDate; }
    public LocalDate getEndDate() { return endDate; }
    public BigDecimal getTotalPrice() { return totalPrice; }
    public BookingStatus getStatus() { return status; }
    public String getInspectionNotes() { return inspectionNotes; }
    public boolean isDamageReported() { return damageReported; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getReturnedAt() { return returnedAt; }
    public Instant getCompletedAt() { return completedAt; }
}
