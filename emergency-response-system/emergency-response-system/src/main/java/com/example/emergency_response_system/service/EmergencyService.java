package com.example.emergency_response_system.service;

import org.springframework.stereotype.Service;
import com.example.emergency_response_system.repository.*;
import com.example.emergency_response_system.dto.AnalyticsResponse;
import com.example.emergency_response_system.entity.*;


import java.time.LocalDateTime;
import java.util.List;

@Service
public class EmergencyService {

    private final EmergencyRequestRepository emergencyRepo;
    private final UserRepository userRepo;

    public EmergencyService(EmergencyRequestRepository emergencyRepo,
            UserRepository userRepo) {
    		this.emergencyRepo = emergencyRepo;
    		this.userRepo = userRepo;
    }
    private User findNearestHospital(Double latitude,
            Double longitude) {

List<User> hospitals =
userRepo.findByRole(Role.ROLE_HOSPITAL);

User nearestHospital = null;

double minDistance = Double.MAX_VALUE;

for(User hospital : hospitals) {

if(Boolean.FALSE.equals(hospital.getAvailable()))
continue;


if(hospital.getAvailableBeds() == null ||
   hospital.getAvailableBeds() <= 0)
    continue;

double distance =
calculateDistance(
   latitude,
   longitude,
   hospital.getLatitude(),
   hospital.getLongitude()
);

if(distance < minDistance) {
minDistance = distance;
nearestHospital = hospital;
}
}

return nearestHospital;
}
    
    
    private User findNearestAmbulance(Double latitude,
            Double longitude) {

List<User> ambulances =
userRepo.findByRole(Role.ROLE_AMBULANCE);

User nearestAmbulance = null;

double minDistance = Double.MAX_VALUE;

for (User ambulance : ambulances) {

if (Boolean.FALSE.equals(ambulance.getAvailable()))
continue;

if (ambulance.getLatitude() == null
|| ambulance.getLongitude() == null)
continue;

double distance = calculateDistance(
latitude,
longitude,
ambulance.getLatitude(),
ambulance.getLongitude());

if (distance < minDistance) {
minDistance = distance;
nearestAmbulance = ambulance;
}
}

return nearestAmbulance;
}
    

    private double calculateDistance(
            double lat1,
            double lon1,
            double lat2,
            double lon2) {

        double dx = lat1 - lat2;
        double dy = lon1 - lon2;

        return Math.sqrt(dx * dx + dy * dy);
    }
    
    
    
    public EmergencyRequest acceptRequest(Long requestId) {

        EmergencyRequest request =
                emergencyRepo.findById(requestId)
                .orElseThrow(() ->
                    new RuntimeException("Request not found"));

        request.setStatus(EmergencyStatus.ACCEPTED);

        return emergencyRepo.save(request);
    }
    
    
    public EmergencyRequest rejectRequest(Long requestId) {

        EmergencyRequest request =
                emergencyRepo.findById(requestId)
                .orElseThrow(() ->
                    new RuntimeException("Request not found"));

        request.setStatus(EmergencyStatus.REJECTED);

        return emergencyRepo.save(request);
    }
    
    public EmergencyRequest markEnroute(Long requestId) {

        EmergencyRequest request =
                emergencyRepo.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        request.setStatus(EmergencyStatus.ENROUTE);

        return emergencyRepo.save(request);
    }
    
    public EmergencyRequest markArrived(Long requestId) {

        EmergencyRequest request =
                emergencyRepo.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        request.setStatus(EmergencyStatus.ARRIVED);

        return emergencyRepo.save(request);
    }
    
    public EmergencyRequest markCompleted(Long requestId) {

        EmergencyRequest request =
                emergencyRepo.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        request.setStatus(EmergencyStatus.COMPLETED);

        System.out.println("BEFORE SAVE");

        EmergencyRequest saved =
                emergencyRepo.save(request);

        System.out.println("AFTER SAVE");

        return saved;
    }
    
    public List<EmergencyRequest> getVictimRequests(Long victimId) {

        User victim = userRepo.findById(victimId)
                .orElseThrow(() ->
                    new RuntimeException("Victim not found"));

        return emergencyRepo.findByVictim(victim);
    }
    
    public AnalyticsResponse getAnalytics() {

        AnalyticsResponse response =
                new AnalyticsResponse();

        List<EmergencyRequest> requests =
                emergencyRepo.findAll();

        response.setTotalRequests(
                requests.size());

        response.setCompletedRequests(
                requests.stream()
                .filter(r ->
                    r.getStatus() ==
                    EmergencyStatus.COMPLETED)
                .count());

        response.setActiveRequests(
                requests.stream()
                .filter(r ->
                    r.getStatus() !=
                    EmergencyStatus.COMPLETED)
                .count());

        return response;
    }
    
    
public EmergencyRequest createSOS(Long victimId, Double latitude, Double longitude, String description) {

	User victim = userRepo.findById(victimId).orElseThrow(() -> new RuntimeException("Victim not found"));

	EmergencyRequest request = new EmergencyRequest();
	request.setVictim(victim);
	request.setLatitude(latitude);
	request.setLongitude(longitude);
	request.setDescription(description);
	request.setStatus(EmergencyStatus.CREATED);
	request.setCreatedAt(LocalDateTime.now());
	
	User hospital =
	        findNearestHospital(latitude, longitude);

	if (hospital != null) {
	    request.setHospital(hospital);
	    hospital.setAvailableBeds(
	            hospital.getAvailableBeds() - 1);

	    userRepo.save(hospital);
	}

	User ambulance =
	        findNearestAmbulance(latitude, longitude);

	if (ambulance != null) {
	    request.setAmbulance(ambulance);

	    ambulance.setAvailable(false);
	    userRepo.save(ambulance);
	}
	if (hospital != null && ambulance != null) {
	    request.setStatus(
	            EmergencyStatus.AMBULANCE_ASSIGNED);
	}
	else if (hospital != null) {
	    request.setStatus(
	            EmergencyStatus.HOSPITAL_NOTIFIED);
	}
	else {
	    request.setStatus(
	            EmergencyStatus.CREATED);
	}

	return emergencyRepo.save(request);
}


public List<EmergencyRequest> getAmbulanceRequests(Long ambulanceId) {

    User ambulance = userRepo.findById(ambulanceId)
            .orElseThrow(() -> new RuntimeException("Ambulance not found"));

    return emergencyRepo.findByAmbulance(ambulance);
}


public List<EmergencyRequest> getHospitalRequests(Long hospitalId) {
        User hospital = userRepo.findById(hospitalId).orElseThrow();
        return emergencyRepo.findByHospital(hospital);
    }

    public EmergencyRequest updateStatus(Long requestId, EmergencyStatus status) {
        EmergencyRequest request = emergencyRepo.findById(requestId).orElseThrow();
        request.setStatus(status);
        return emergencyRepo.save(request);
    }

    public List<EmergencyRequest> getAllRequests() {
        return emergencyRepo.findAll();
    }
}