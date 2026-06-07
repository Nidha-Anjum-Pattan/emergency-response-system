package com.example.emergency_response_system.controller;

import org.springframework.web.bind.annotation.*;
import com.example.emergency_response_system.service.EmergencyService;
import com.example.emergency_response_system.dto.AnalyticsResponse;
import com.example.emergency_response_system.entity.*;

import java.util.List;

@RestController
@RequestMapping("/api/emergency")
public class EmergencyController {

    private final EmergencyService service;
    
    public EmergencyController(EmergencyService service) {
        this.service = service;
    }    

    // Victim sends SOS
    @PostMapping("/sos/{victimId}")
    public EmergencyRequest createSOS(
            @PathVariable Long victimId,
            @RequestParam Double latitude,
            @RequestParam Double longitude,
            @RequestParam String description) {

        return service.createSOS(victimId, latitude, longitude, description);
    }
    
    
    @PutMapping("/hospital/accept/{requestId}")
    public EmergencyRequest acceptRequest(
            @PathVariable Long requestId) {

        return service.acceptRequest(requestId);
    }
    
    @PutMapping("/hospital/reject/{requestId}")
    public EmergencyRequest rejectRequest(
            @PathVariable Long requestId) {

        return service.rejectRequest(requestId);
    }
    
    
    // Hospital sees requests
    @GetMapping("/hospital/{hospitalId}")
    public List<EmergencyRequest> hospitalRequests(
            @PathVariable Long hospitalId) {

        return service.getHospitalRequests(hospitalId);
    }
    
    @GetMapping("/ambulance/{ambulanceId}")
    public List<EmergencyRequest> ambulanceRequests(
            @PathVariable Long ambulanceId) {

        return service.getAmbulanceRequests(ambulanceId);
    }
    
    @PutMapping("/ambulance/enroute/{requestId}")
    public EmergencyRequest markEnroute(
            @PathVariable Long requestId) {

        return service.markEnroute(requestId);
    }
    
    @PutMapping("/ambulance/arrived/{requestId}")
    public EmergencyRequest markArrived(
            @PathVariable Long requestId) {

        return service.markArrived(requestId);
    }
    
    @PutMapping("/ambulance/completed/{requestId}")
    public EmergencyRequest markCompleted(
            @PathVariable Long requestId) {


        return service.markCompleted(requestId);
    }
    
    
    @GetMapping("/stats")
    public AnalyticsResponse getAnalytics() {
        return service.getAnalytics();
    }
    
    @GetMapping("/victim/{victimId}")
    public List<EmergencyRequest> victimRequests(
            @PathVariable Long victimId) {

        return service.getVictimRequests(victimId);
    }

    // Govt dashboard
    @GetMapping("/all")
    public List<EmergencyRequest> allRequests() {
        return service.getAllRequests();
    }
}