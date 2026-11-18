package com.rental.backend.security;

import com.rental.backend.domain.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;

@Service
public class JwtService {

    public static final String ISSUER = "drivexpress";
    public static final String ROLE_CLAIM = "role";

    private final JwtEncoder encoder;
    private final Duration ttl;
    private final Clock clock;

    public JwtService(JwtEncoder encoder, @Value("${app.jwt.expiry-hours}") long expiryHours, Clock clock) {
        this.encoder = encoder;
        this.ttl = Duration.ofHours(expiryHours);
        this.clock = clock;
    }

    public record Token(String value, Instant expiresAt) {}

    public Token issue(User user) {
        Instant now = clock.instant();
        Instant exp = now.plus(ttl);
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(ISSUER)
                .subject(String.valueOf(user.getId()))
                .issuedAt(now)
                .expiresAt(exp)
                .claim("email", user.getEmail())
                .claim("name", user.getFullName())
                .claim(ROLE_CLAIM, user.getRole().name())
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        String value = encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
        return new Token(value, exp);
    }
}
