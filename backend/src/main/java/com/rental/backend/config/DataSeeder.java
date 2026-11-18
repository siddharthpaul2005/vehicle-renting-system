package com.rental.backend.config;

import com.rental.backend.domain.Enums.FuelType;
import com.rental.backend.domain.Enums.Role;
import com.rental.backend.domain.Enums.Transmission;
import com.rental.backend.domain.Enums.VehicleType;
import com.rental.backend.domain.User;
import com.rental.backend.domain.Vehicle;
import com.rental.backend.repository.UserRepository;
import com.rental.backend.repository.VehicleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;

/**
 * Creates the admin account and a demo fleet on first start. It never deletes anything:
 * vehicles are only inserted when the table is empty, users only when the email is missing.
 */
@Component
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true")
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);
    /**
     * Real photos of each exact model from Wikimedia Commons (960px thumbnails, hotlinking is permitted).
     * Licenses are CC BY / CC BY-SA, so credits are shown on the app's /credits page.
     */
    private static final String COMMONS = "https://thumb.wikimedia.org/wikipedia/commons/thumb/";

    private final UserRepository users;
    private final VehicleRepository vehicles;
    private final PasswordEncoder passwordEncoder;
    private final String adminEmail;
    private final String adminPassword;

    public DataSeeder(UserRepository users, VehicleRepository vehicles, PasswordEncoder passwordEncoder,
                      @Value("${app.seed.admin-email}") String adminEmail,
                      @Value("${app.seed.admin-password}") String adminPassword) {
        this.users = users;
        this.vehicles = vehicles;
        this.passwordEncoder = passwordEncoder;
        this.adminEmail = adminEmail.toLowerCase(Locale.ROOT);
        this.adminPassword = adminPassword;
    }

    @Override
    @Transactional
    public void run(String... args) {
        createUserIfMissing("Fleet Admin", adminEmail, adminPassword, Role.ADMIN);
        createUserIfMissing("Demo Customer", "demo@drivexpress.com", "Demo@1234", Role.CUSTOMER);

        if (vehicles.count() == 0) {
            vehicles.saveAll(demoFleet());
            log.info("Seeded demo fleet with {} vehicles", vehicles.count());
        }
    }

    private void createUserIfMissing(String name, String email, String password, Role role) {
        if (!users.existsByEmailIgnoreCase(email)) {
            users.save(new User(name, email, passwordEncoder.encode(password), role));
            log.info("Created {} account {}", role, email);
        }
    }

    private static List<Vehicle> demoFleet() {
        return List.of(
                v("Mahindra", "Thar", VehicleType.SUV, Transmission.MANUAL, FuelType.DIESEL, 4, 3500, "Ahmedabad",
                        "5/51/Mahindra_Thar_SUV_in_%22Red_Rage%22_color_at_Ashiana_Brahmanda%2C_East_Singbhum_India_%28Ank_Kumar%2C_Infosys_limited%29_02_%28cropped%29.jpg"),
                v("Hyundai", "Creta", VehicleType.SUV, Transmission.AUTOMATIC, FuelType.PETROL, 5, 2800, "Patna",
                        "2/21/2024_Hyundai_Creta_1.5_MPi_SX%28O%29_%28India%29_front_view.png"),
                v("Maruti Suzuki", "Swift", VehicleType.HATCHBACK, Transmission.MANUAL, FuelType.PETROL, 5, 1400, "Ahmedabad",
                        "3/3d/Suzuki_Swift_%282024%29_hybrid_DSC_6076.jpg"),
                v("Honda", "City", VehicleType.SEDAN, Transmission.AUTOMATIC, FuelType.PETROL, 5, 2200, "Mumbai",
                        "5/5c/2022_Honda_City_ZX_i-VTEC_%28India%29_front_view.jpg"),
                v("Tata", "Nexon EV", VehicleType.SUV, Transmission.AUTOMATIC, FuelType.EV, 5, 2600, "Bengaluru",
                        "e/ea/2020_Tata_Nexon_EV_%28India%29_front_view.png"),
                v("Toyota", "Innova Crysta", VehicleType.MUV, Transmission.MANUAL, FuelType.DIESEL, 7, 3800, "Delhi",
                        "8/87/Toyota_Innova_Crysta_2.4_Z_front_right.jpg"),
                v("Kia", "Seltos", VehicleType.SUV, Transmission.AUTOMATIC, FuelType.DIESEL, 5, 3000, "Pune",
                        "6/6c/Kia_Seltos_SP2_PE_Snow_White_Pearl_%2817%29_%28cropped%29.jpg"),
                v("Mercedes-Benz", "C-Class", VehicleType.LUXURY, Transmission.AUTOMATIC, FuelType.PETROL, 5, 9500, "Mumbai",
                        "b/be/Mercedes-Benz_W206_IMG_6380.jpg"),
                v("Tata", "Tiago", VehicleType.HATCHBACK, Transmission.MANUAL, FuelType.CNG, 5, 1200, "Patna",
                        "c/ca/2022_Tata_Tiago_XZA%2B_front_20230512.jpg"),
                v("Toyota", "Urban Cruiser Hyryder", VehicleType.SUV, Transmission.AUTOMATIC, FuelType.HYBRID, 5, 3200, "Bengaluru",
                        "4/4c/2022_Toyota_Urban_Cruiser_Hyryder_V_Hybrid_%28India%29_front_view.jpg"));
    }

    /** {@code commonsPath} is "<hash>/<file>" as in Commons' upload paths; we request the 960px thumbnail. */
    private static Vehicle v(String brand, String model, VehicleType type, Transmission tx, FuelType fuel,
                             int seats, int price, String city, String commonsPath) {
        String file = commonsPath.substring(commonsPath.lastIndexOf('/') + 1);
        String url = COMMONS + commonsPath + "/960px-" + file;
        return new Vehicle(brand, model, type, tx, fuel, seats, BigDecimal.valueOf(price), city, url);
    }
}
