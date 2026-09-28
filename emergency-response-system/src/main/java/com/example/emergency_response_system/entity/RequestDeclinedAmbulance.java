package com.example.emergency_response_system.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "request_declined_ambulances")
public class RequestDeclinedAmbulance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "request_id", nullable = false)
    private EmergencyRequest request;

    @ManyToOne
    @JoinColumn(name = "ambulance_id", nullable = false)
    private Ambulance ambulance;

    private LocalDateTime declinedAt;

    public RequestDeclinedAmbulance() {
        this.declinedAt = LocalDateTime.now();
    }

    public RequestDeclinedAmbulance(EmergencyRequest request, Ambulance ambulance) {
        this.request = request;
        this.ambulance = ambulance;
        this.declinedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public EmergencyRequest getRequest() {
        return request;
    }

    public void setRequest(EmergencyRequest request) {
        this.request = request;
    }

    public Ambulance getAmbulance() {
        return ambulance;
    }

    public void setAmbulance(Ambulance ambulance) {
        this.ambulance = ambulance;
    }

    public LocalDateTime getDeclinedAt() {
        return declinedAt;
    }

    public void setDeclinedAt(LocalDateTime declinedAt) {
        this.declinedAt = declinedAt;
    }
}
