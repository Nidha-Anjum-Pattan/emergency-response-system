package com.example.emergency_response_system.controller;

import org.springframework.web.bind.annotation.*;
import com.example.emergency_response_system.service.EmergencyService;
import com.example.emergency_response_system.dto.*;
import com.example.emergency_response_system.entity.*;

import java.util.List;

@RestController
@RequestMapping("/api/emergency")
public class EmergencyController {

    private final EmergencyService service;

    public EmergencyController(EmergencyService service) {
        this.service = service;
    }

    // 1. Registered Victim SOS
    @PostMapping("/sos/{victimId}")
    public EmergencyRequest createSOS(
            @PathVariable Long victimId,
            @RequestParam Double latitude,
            @RequestParam Double longitude,
            @RequestParam(required = false) String landmark,
            @RequestParam(required = false) EmergencyCategory category,
            @RequestParam(required = false) String description) {

        return service.createSOS(victimId, latitude, longitude, landmark, category, description);
    }

    // 2. Express Guest SOS
    @PostMapping("/express-sos")
    public EmergencyRequest createExpressSOS(@RequestBody ExpressSosRequest request) {
        return service.createExpressSOS(request);
    }

    // Driver Accepts Task
    @PutMapping("/ambulance/accept/{requestId}/{ambulanceId}")
    public EmergencyRequest acceptByAmbulance(
            @PathVariable Long requestId,
            @PathVariable Long ambulanceId) {
        return service.acceptByAmbulance(requestId, ambulanceId);
    }

    // Driver Reaches Victim
    @PutMapping("/ambulance/arrived/{requestId}")
    public EmergencyRequest markArrivedAtVictim(@PathVariable Long requestId) {
        return service.markArrivedAtVictim(requestId);
    }

    // Driver Declines/Cancels Task
    @PutMapping("/ambulance/cancel/{requestId}/{ambulanceId}")
    public EmergencyRequest cancelByAmbulance(
            @PathVariable Long requestId,
            @PathVariable Long ambulanceId) {
        return service.cancelByAmbulance(requestId, ambulanceId);
    }

    // Fetch Top 3 Hospitals Matrix for Driver
    @GetMapping("/hospitals/top3/{requestId}")
    public List<HospitalDTO> getTop3Hospitals(@PathVariable Long requestId) {
        return service.getTop3HospitalsForDriver(requestId);
    }

    // Driver Selects Target Hospital
    @PutMapping("/ambulance/select-hospital/{requestId}/{hospitalId}")
    public EmergencyRequest selectHospitalByDriver(
            @PathVariable Long requestId,
            @PathVariable Long hospitalId) {
        return service.selectHospitalByDriver(requestId, hospitalId);
    }

    // Hospital Accepts Pre-Arrival Alert
    @PutMapping("/hospital/accept/{requestId}")
    public EmergencyRequest acceptByHospital(@PathVariable Long requestId) {
        return service.acceptByHospital(requestId);
    }

    // Hospital Rejects / Diverts Pre-Arrival Alert
    @PutMapping("/hospital/reject/{requestId}")
    public EmergencyRequest rejectByHospital(@PathVariable Long requestId) {
        return service.divertByHospital(requestId);
    }

    @PutMapping("/hospital/divert/{requestId}")
    public EmergencyRequest divertByHospital(@PathVariable Long requestId) {
        return service.divertByHospital(requestId);
    }

    // Handover Complete
    @PutMapping("/ambulance/completed/{requestId}")
    public EmergencyRequest completeHandover(@PathVariable Long requestId) {
        return service.completeHandover(requestId);
    }

    // Victim Cancels SOS
    @PutMapping("/victim/cancel/{requestId}")
    public EmergencyRequest cancelByVictim(@PathVariable Long requestId) {
        return service.cancelByVictim(requestId);
    }

    // Dashboard Data Endpoints
    @GetMapping("/victim/{victimId}")
    public List<EmergencyRequest> getVictimRequests(@PathVariable Long victimId) {
        return service.getVictimRequests(victimId);
    }

    @GetMapping("/ambulance/{ambulanceId}")
    public List<EmergencyRequest> getAmbulanceRequests(@PathVariable Long ambulanceId) {
        return service.getAmbulanceRequests(ambulanceId);
    }

    @GetMapping("/ambulance/broadcast/{driverUserId}")
    public List<DriverDispatchDTO> getBroadcastRequestsForDriver(@PathVariable Long driverUserId) {
        return service.getBroadcastRequestsForDriver(driverUserId);
    }

    @GetMapping("/hospital/{hospitalId}")
    public List<EmergencyRequest> getHospitalRequests(@PathVariable Long hospitalId) {
        return service.getHospitalRequests(hospitalId);
    }

    @GetMapping("/all")
    public List<EmergencyRequest> getAllRequests() {
        return service.getAllRequests();
    }

    @GetMapping("/hospitals/all")
    public List<Hospital> getAllHospitals() {
        return service.getAllHospitals();
    }

    @GetMapping("/ambulances/all")
    public List<Ambulance> getAllAmbulances() {
        return service.getAllAmbulances();
    }

    @PostMapping("/admin/provision-hospital")
    public Hospital provisionHospital(@RequestBody HospitalProvisionDTO dto) {
        return service.provisionHospital(dto);
    }

    @PostMapping("/admin/provision-ambulance")
    public Ambulance provisionAmbulance(@RequestBody AmbulanceProvisionDTO dto) {
        return service.provisionAmbulance(dto);
    }

    @PutMapping("/hospital/capacity/{hospitalId}")
    public Hospital updateHospitalCapacity(
            @PathVariable Long hospitalId,
            @RequestParam(required = false) Integer availableBeds,
            @RequestParam(required = false) Integer totalBeds,
            @RequestParam(required = false) Boolean hasIcu) {
        return service.updateHospitalCapacity(hospitalId, availableBeds, totalBeds, hasIcu);
    }

    @GetMapping("/stats")
    public AnalyticsResponse getAnalytics() {
        return service.getAnalytics();
    }
}