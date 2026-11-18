package com.rental.backend.web;

import org.springframework.security.oauth2.jwt.Jwt;

final class CurrentUser {
    private CurrentUser() {}

    /** The JWT subject is the user's database id. */
    static Long id(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }
}
