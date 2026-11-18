package com.rental.backend.web;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * In production the React build is served from /static. Client-side routes (e.g. /admin) must
 * return index.html so React Router can take over on a hard refresh.
 */
@Controller
public class SpaController {

    @GetMapping({"/login", "/register", "/bookings", "/credits", "/admin", "/admin/**", "/vehicles/**"})
    public String forwardToIndex() {
        return "forward:/index.html";
    }
}
