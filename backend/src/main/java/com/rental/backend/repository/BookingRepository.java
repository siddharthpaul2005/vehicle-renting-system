package com.rental.backend.repository;

import com.rental.backend.domain.Booking;
import com.rental.backend.domain.Enums.BookingStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    @EntityGraph(attributePaths = {"vehicle", "user"})
    List<Booking> findByUserIdOrderByCreatedAtDesc(Long userId);

    @EntityGraph(attributePaths = {"vehicle", "user"})
    List<Booking> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = {"vehicle", "user"})
    List<Booking> findByStatusOrderByCreatedAtDesc(BookingStatus status);

    @EntityGraph(attributePaths = {"vehicle", "user"})
    Optional<Booking> findWithDetailsById(Long id);

    boolean existsByVehicleId(Long vehicleId);

    long countByStatus(BookingStatus status);

    @Query("select coalesce(sum(b.totalPrice), 0) from Booking b")
    BigDecimal totalRevenue();
}
