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
 * Prepares a ready-to-explore demo. It never deletes anything:
 * <ul>
 *   <li>the admin and demo-customer accounts are created if missing, and their passwords are kept in sync
 *       with {@code ADMIN_PASSWORD} / {@code DEMO_PASSWORD}, so changing those env vars takes effect on restart;</li>
 *   <li>the demo fleet is inserted only when the vehicles table is empty.</li>
 * </ul>
 * Turn it off entirely with {@code SEED_DATA=false}.
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
    private final String demoEmail;
    private final String demoPassword;

    public DataSeeder(UserRepository users, VehicleRepository vehicles, PasswordEncoder passwordEncoder,
                      @Value("${app.seed.admin-email}") String adminEmail,
                      @Value("${app.seed.admin-password}") String adminPassword,
                      @Value("${app.seed.demo-email}") String demoEmail,
                      @Value("${app.seed.demo-password}") String demoPassword) {
        this.users = users;
        this.vehicles = vehicles;
        this.passwordEncoder = passwordEncoder;
        this.adminEmail = adminEmail.trim().toLowerCase(Locale.ROOT);
        this.adminPassword = adminPassword;
        this.demoEmail = demoEmail.trim().toLowerCase(Locale.ROOT);
        this.demoPassword = demoPassword;
    }

    @Override
    @Transactional
    public void run(String... args) {
        ensureAccount("Fleet Admin", adminEmail, adminPassword, Role.ADMIN);
        ensureAccount("Demo Customer", demoEmail, demoPassword, Role.CUSTOMER);

        if (vehicles.count() == 0) {
            vehicles.saveAll(demoFleet());
            log.info("Seeded demo fleet with {} vehicles", vehicles.count());
        }
    }

    /** Creates the account if missing; otherwise makes sure its password matches the configured one. */
    private void ensureAccount(String name, String email, String password, Role role) {
        users.findByEmailIgnoreCase(email).ifPresentOrElse(
                existing -> {
                    if (!passwordEncoder.matches(password, existing.getPasswordHash())) {
                        existing.changePasswordHash(passwordEncoder.encode(password));
                        log.info("Updated password of {} account {} to the configured value", role, email);
                    }
                },
                () -> {
                    users.save(new User(name, email, passwordEncoder.encode(password), role));
                    log.info("Created {} account {}", role, email);
                });
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
