package com.rental.backend.service;

import com.rental.backend.domain.Enums.BookingStatus;
import com.rental.backend.domain.Enums.Role;
import com.rental.backend.domain.Enums.VehicleStatus;
import com.rental.backend.dto.Dtos.StatsResponse;
import com.rental.backend.repository.BookingRepository;
import com.rental.backend.repository.UserRepository;
import com.rental.backend.repository.VehicleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumMap;
import java.util.Map;

@Service
public class StatsService {

    private final VehicleRepository vehicles;
    private final BookingRepository bookings;
    private final UserRepository users;

    public StatsService(VehicleRepository vehicles, BookingRepository bookings, UserRepository users) {
        this.vehicles = vehicles;
        this.bookings = bookings;
        this.users = users;
    }

    @Transactional(readOnly = true)
    public StatsResponse stats() {
        Map<VehicleStatus, Long> byStatus = new EnumMap<>(VehicleStatus.class);
        long fleet = 0;
        for (VehicleStatus s : VehicleStatus.values()) {
            long n = vehicles.countByStatus(s);
            byStatus.put(s, n);
            if (s != VehicleStatus.RETIRED) fleet += n;
        }
        return new StatsResponse(fleet, byStatus,
                bookings.countByStatus(BookingStatus.ACTIVE),
                bookings.countByStatus(BookingStatus.RETURNED),
                bookings.countByStatus(BookingStatus.COMPLETED),
                users.countByRole(Role.CUSTOMER),
                bookings.totalRevenue());
    }
}
