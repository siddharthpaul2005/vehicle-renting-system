package com.rental.backend.service;

import com.rental.backend.domain.Enums.Role;
import com.rental.backend.domain.User;
import com.rental.backend.dto.Dtos.AuthResponse;
import com.rental.backend.dto.Dtos.LoginRequest;
import com.rental.backend.dto.Dtos.RegisterRequest;
import com.rental.backend.dto.Dtos.UserResponse;
import com.rental.backend.exception.ApiException;
import com.rental.backend.repository.UserRepository;
import com.rental.backend.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class AuthService {

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository users, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    /** Public sign-up always creates a CUSTOMER. Admins are created by the seeder / DB only. */
    @Transactional
    public AuthResponse register(RegisterRequest req) {
        String email = normalize(req.email());
        if (users.existsByEmailIgnoreCase(email)) {
            throw ApiException.conflict("An account with this email already exists.");
        }
        User user = users.save(new User(req.fullName().trim(), email,
                passwordEncoder.encode(req.password()), Role.CUSTOMER));
        return issue(user);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest req) {
        User user = users.findByEmailIgnoreCase(normalize(req.email()))
                .filter(u -> passwordEncoder.matches(req.password(), u.getPasswordHash()))
                .orElseThrow(() -> ApiException.unauthorized("Invalid email or password."));
        return issue(user);
    }

    @Transactional(readOnly = true)
    public UserResponse me(Long userId) {
        return users.findById(userId).map(UserResponse::from)
                .orElseThrow(() -> ApiException.unauthorized("Account no longer exists."));
    }

    private AuthResponse issue(User user) {
        JwtService.Token token = jwtService.issue(user);
        return new AuthResponse(token.value(), token.expiresAt(), UserResponse.from(user));
    }

    private static String normalize(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
