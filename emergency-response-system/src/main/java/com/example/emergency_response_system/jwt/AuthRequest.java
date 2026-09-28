package com.example.emergency_response_system.jwt;

public class AuthRequest {

    private String identifier; // Email OR Phone number
    private String email;      // Backward compatibility
    private String password;

    public String getIdentifier() {
        return identifier != null && !identifier.isEmpty() ? identifier : email;
    }

    public void setIdentifier(String identifier) {
        this.identifier = identifier;
    }

    public String getEmail() {
        return email != null ? email : identifier;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}