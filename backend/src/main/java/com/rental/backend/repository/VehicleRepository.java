package com.rental.backend.repository;

import com.rental.backend.domain.Enums.FuelType;
import com.rental.backend.domain.Enums.Transmission;
import com.rental.backend.domain.Enums.VehicleStatus;
import com.rental.backend.domain.Enums.VehicleType;
import com.rental.backend.domain.Vehicle;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {

    /**
     * Flexible fleet search. Empty strings / null enums mean "no filter" (empty strings avoid
     * PostgreSQL's untyped-null parameter problem with lower()).
     */
    @Query("""
            select v from Vehicle v
            where v.status in :statuses
              and (:city = '' or lower(v.hubCity) = lower(:city))
              and (:q = '' or lower(concat(v.brand, ' ', v.model)) like lower(concat('%', :q, '%')))
              and (:type is null or v.vehicleType = :type)
              and (:fuel is null or v.fuelType = :fuel)
              and (:transmission is null or v.transmission = :transmission)
            """)
    List<Vehicle> search(@Param("statuses") Collection<VehicleStatus> statuses,
                         @Param("city") String city,
                         @Param("q") String q,
                         @Param("type") VehicleType type,
                         @Param("fuel") FuelType fuel,
                         @Param("transmission") Transmission transmission,
                         Sort sort);

    @Query("select distinct v.hubCity from Vehicle v where v.status <> com.rental.backend.domain.Enums.VehicleStatus.RETIRED order by v.hubCity")
    List<String> findActiveCities();

    /** Row lock so two customers can't rent the same car at the same instant. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select v from Vehicle v where v.id = :id")
    Optional<Vehicle> findByIdForUpdate(@Param("id") Long id);

    long countByStatus(VehicleStatus status);
}
