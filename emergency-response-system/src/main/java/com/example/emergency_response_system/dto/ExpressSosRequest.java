package com.example.emergency_response_system.dto;

import com.example.emergency_response_system.entity.EmergencyCategory;

public class ExpressSosRequest {
    private String phone;
    private String otp;
    private String name;
    private EmergencyCategory category;
    private String landmark;
    private String description;
    private Double latitude;
    private Double longitude;

    public ExpressSosRequest() {}

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getOtp() {
        return otp;
    }

    public void setOtp(String otp) {
        this.otp = otp;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public EmergencyCategory getCategory() {
        return category;
    }

    public void setCategory(EmergencyCategory category) {
        this.category = category;
    }

    public String getLandmark() {
        return landmark;
    }

    public void setLandmark(String landmark) {
        this.landmark = landmark;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
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
}
