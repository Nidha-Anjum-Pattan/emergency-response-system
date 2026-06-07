package com.example.emergency_response_system.entity;


import jakarta.persistence.*;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
public class EmergencyRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private Double latitude;
	private Double longitude;

    private String description;

    @Enumerated(EnumType.STRING)
    private EmergencyStatus status;

    @ManyToOne
    @JoinColumn(name = "victim_id")
    private User victim;

    @ManyToOne
    private User hospital;

    @ManyToOne
    //@JsonIgnore
    private User ambulance;


    private LocalDateTime createdAt;

    public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public Double getLatitude() {
		return latitude;
	}

	public void setLatitude(Double latitude) {
		this.latitude = latitude;
	}

	public Double getLongitude() {
		return longitude;
	}

	public void setLongitude(Double longitude) {
		this.longitude = longitude;
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public EmergencyStatus getStatus() {
		return status;
	}

	public void setStatus(EmergencyStatus status) {
		this.status = status;
	}

	public User getVictim() {
		return victim;
	}

	public void setVictim(User victim) {
		this.victim = victim;
	}

	public User getHospital() {
		return hospital;
	}

	public void setHospital(User hospital) {
		this.hospital = hospital;
	}

	public User getAmbulance() {
		return ambulance;
	}

	public void setAmbulance(User ambulance) {
		this.ambulance = ambulance;
	}

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(LocalDateTime createdAt) {
		this.createdAt = createdAt;
	}

}