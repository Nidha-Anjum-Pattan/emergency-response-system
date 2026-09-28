package com.example.emergency_response_system.dto;

import com.example.emergency_response_system.entity.EmergencyCategory;
import com.example.emergency_response_system.entity.EmergencyStatus;
import com.example.emergency_response_system.entity.PriorityLevel;

public class DriverDispatchDTO {
    private Long id;
    private String victimName;
    private String victimPhone;
    private Double latitude;
    private Double longitude;
    private String landmark;
    private EmergencyCategory category;
    private PriorityLevel priorityLevel;
    private Integer priorityScore;
    private EmergencyStatus status;
    private Double distanceKm;
    private Integer etaMinutes;
    private Integer rank; // 1 (1st Nearest), 2 (2nd Nearest), 3 (3rd Nearest)
    private Boolean buttonEnabled;
    private String reason;
    private Integer unlocksInSeconds;
    private Long assignedAmbulanceId;

    public DriverDispatchDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getVictimName() { return victimName; }
    public void setVictimName(String victimName) { this.victimName = victimName; }

    public String getVictimPhone() { return victimPhone; }
    public void setVictimPhone(String victimPhone) { this.victimPhone = victimPhone; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public String getLandmark() { return landmark; }
    public void setLandmark(String landmark) { this.landmark = landmark; }

    public EmergencyCategory getCategory() { return category; }
    public void setCategory(EmergencyCategory category) { this.category = category; }

    public PriorityLevel getPriorityLevel() { return priorityLevel; }
    public void setPriorityLevel(PriorityLevel priorityLevel) { this.priorityLevel = priorityLevel; }

    public Integer getPriorityScore() { return priorityScore; }
    public void setPriorityScore(Integer priorityScore) { this.priorityScore = priorityScore; }

    public EmergencyStatus getStatus() { return status; }
    public void setStatus(EmergencyStatus status) { this.status = status; }

    public Double getDistanceKm() { return distanceKm; }
    public void setDistanceKm(Double distanceKm) { this.distanceKm = distanceKm; }

    public Integer getEtaMinutes() { return etaMinutes; }
    public void setEtaMinutes(Integer etaMinutes) { this.etaMinutes = etaMinutes; }

    public Integer getRank() { return rank; }
    public void setRank(Integer rank) { this.rank = rank; }

    public Boolean getButtonEnabled() { return buttonEnabled; }
    public void setButtonEnabled(Boolean buttonEnabled) { this.buttonEnabled = buttonEnabled; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public Integer getUnlocksInSeconds() { return unlocksInSeconds; }
    public void setUnlocksInSeconds(Integer unlocksInSeconds) { this.unlocksInSeconds = unlocksInSeconds; }

    public Long getAssignedAmbulanceId() { return assignedAmbulanceId; }
    public void setAssignedAmbulanceId(Long assignedAmbulanceId) { this.assignedAmbulanceId = assignedAmbulanceId; }
}
