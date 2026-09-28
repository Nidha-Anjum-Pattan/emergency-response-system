package com.example.emergency_response_system.jwt;

import com.example.emergency_response_system.entity.User;
import com.example.emergency_response_system.security.CustomUserDetails;
import com.example.emergency_response_system.security.CustomUserDetailsService;
import com.example.emergency_response_system.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.*;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request) {
        String identifier = request.getIdentifier();

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        identifier,
                        request.getPassword()
                )
        );

        CustomUserDetails userDetails = (CustomUserDetails) userDetailsService.loadUserByUsername(identifier);
        User user = userDetails.getUser();

        String token = jwtUtil.generateToken(
                userDetails.getUsername(),
                user.getRole().name()
        );

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("user", user);
        response.put("role", user.getRole().name());

        return ResponseEntity.ok(response);
    }
}