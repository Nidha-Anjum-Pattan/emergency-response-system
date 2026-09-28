package com.example.emergency_response_system.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "request_declined_hospitals")
public class RequestDeclinedHospital {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "request_id", nullable = false)
    private EmergencyRequest request;

    @ManyToOne
    @JoinColumn(name = "hospital_id", nullable = false)
    private Hospital hospital;

    private LocalDateTime declinedAt;

    public RequestDeclinedHospital() {
        this.declinedAt = LocalDateTime.now();
    }

    public RequestDeclinedHospital(EmergencyRequest request, Hospital hospital) {
        this.request = request;
        this.hospital = hospital;
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

    public Hospital getHospital() {
        return hospital;
    }

    public void setHospital(Hospital hospital) {
        this.hospital = hospital;
    }

    public LocalDateTime getDeclinedAt() {
        return declinedAt;
    }

    public void setDeclinedAt(LocalDateTime declinedAt) {
        this.declinedAt = declinedAt;
    }
}
