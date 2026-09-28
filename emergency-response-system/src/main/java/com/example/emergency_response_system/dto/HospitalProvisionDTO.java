package com.example.emergency_response_system.dto;

public class HospitalProvisionDTO {
    private String name;
    private String email;
    private String phone;
    private String password;
    private Integer totalBeds;
    private Integer availableBeds;
    private Double latitude;
    private Double longitude;
    private Boolean hasIcu;

    public HospitalProvisionDTO() {}

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public Integer getTotalBeds() { return totalBeds; }
    public void setTotalBeds(Integer totalBeds) { this.totalBeds = totalBeds; }

    public Integer getAvailableBeds() { return availableBeds; }
    public void setAvailableBeds(Integer availableBeds) { this.availableBeds = availableBeds; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public Boolean getHasIcu() { return hasIcu; }
    public void setHasIcu(Boolean hasIcu) { this.hasIcu = hasIcu; }
}
