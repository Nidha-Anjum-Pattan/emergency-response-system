package com.example.emergency_response_system.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.example.emergency_response_system.repository.*;
import com.example.emergency_response_system.dto.*;
import com.example.emergency_response_system.entity.*;

import java.time.LocalDateTime;
import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class EmergencyService {

    private final EmergencyRequestRepository emergencyRepo;
    private final UserRepository userRepo;
    private final HospitalRepository hospitalRepo;
    private final AmbulanceRepository ambulanceRepo;
    private final RequestDeclinedAmbulanceRepository declinedRepo;
    private final RequestDeclinedHospitalRepository declinedHospitalRepo;
    private final PasswordEncoder passwordEncoder;

    public EmergencyService(EmergencyRequestRepository emergencyRepo,
                            UserRepository userRepo,
                            HospitalRepository hospitalRepo,
                            AmbulanceRepository ambulanceRepo,
                            RequestDeclinedAmbulanceRepository declinedRepo,
                            RequestDeclinedHospitalRepository declinedHospitalRepo,
                            PasswordEncoder passwordEncoder) {
        this.emergencyRepo = emergencyRepo;
        this.userRepo = userRepo;
        this.hospitalRepo = hospitalRepo;
        this.ambulanceRepo = ambulanceRepo;
        this.declinedRepo = declinedRepo;
        this.declinedHospitalRepo = declinedHospitalRepo;
        this.passwordEncoder = passwordEncoder;
    }

    // Haversine formula for exact Earth curvature driving distance in kilometers
    public double calculateHaversineDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Earth radius in km
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round(R * c * 10.0) / 10.0;
    }

    // 1. Triage Priority Mapper: Sets priority level & score (1=Critical, 2=Urgent, 3=Non-Urgent)
    private PriorityLevel getPriorityForCategory(EmergencyCategory category) {
        if (category == null) return PriorityLevel.CRITICAL;
        switch (category) {
            case CARDIAC:
            case ACCIDENT:
                return PriorityLevel.CRITICAL;
            case FRACTURE:
            case FEVER:
                return PriorityLevel.URGENT;
            case MINOR:
                return PriorityLevel.NON_URGENT;
            default:
                return PriorityLevel.URGENT;
        }
    }

    private int getPriorityScoreForCategory(EmergencyCategory category) {
        PriorityLevel level = getPriorityForCategory(category);
        if (level == PriorityLevel.CRITICAL) return 1;
        if (level == PriorityLevel.URGENT) return 2;
        return 3;
    }

    // Registered Victim SOS Creation (Leaves ambulance = null until a driver accepts!)
    @Transactional
    public EmergencyRequest createSOS(Long victimId, Double latitude, Double longitude, String landmark, EmergencyCategory category, String description) {
        User victim = userRepo.findById(victimId)
                .orElseThrow(() -> new RuntimeException("Victim user entity not found"));

        EmergencyCategory cat = category != null ? category : EmergencyCategory.OTHER;
        PriorityLevel priorityLevel = getPriorityForCategory(cat);
        int priorityScore = getPriorityScoreForCategory(cat);

        EmergencyRequest request = new EmergencyRequest();
        request.setVictim(victim);
        request.setLatitude(latitude);
        request.setLongitude(longitude);
        request.setLandmark(landmark);
        request.setCategory(cat);
        request.setPriorityLevel(priorityLevel);
        request.setPriorityScore(priorityScore);
        request.setDescription(description);
        request.setStatus(EmergencyStatus.CREATED);
        request.setAmbulance(null);

        EmergencyRequest savedRequest = emergencyRepo.save(request);
        assignNearestAmbulanceIfAvailable(savedRequest);

        return savedRequest;
    }

    // Express Guest SOS (No Login Needed, Leaves ambulance = null until a driver accepts!)
    @Transactional
    public EmergencyRequest createExpressSOS(ExpressSosRequest dto) {
        User guestUser = userRepo.findByEmailOrPhone(dto.getPhone())
                .orElseGet(() -> {
                    User newUser = new User();
                    newUser.setName(dto.getName() != null && !dto.getName().isEmpty() ? dto.getName() : "Express Guest Victim");
                    newUser.setPhone(dto.getPhone());
                    newUser.setRole(Role.ROLE_USER);
                    return userRepo.save(newUser);
                });

        EmergencyCategory cat = dto.getCategory() != null ? dto.getCategory() : EmergencyCategory.OTHER;
        PriorityLevel priorityLevel = getPriorityForCategory(cat);
        int priorityScore = getPriorityScoreForCategory(cat);

        EmergencyRequest request = new EmergencyRequest();
        request.setVictim(guestUser);
        request.setLatitude(dto.getLatitude());
        request.setLongitude(dto.getLongitude());
        request.setLandmark(dto.getLandmark());
        request.setCategory(cat);
        request.setPriorityLevel(priorityLevel);
        request.setPriorityScore(priorityScore);
        request.setDescription(dto.getDescription());
        request.setStatus(EmergencyStatus.CREATED);
        request.setAmbulance(null);

        EmergencyRequest savedRequest = emergencyRepo.save(request);
        assignNearestAmbulanceIfAvailable(savedRequest);

        return savedRequest;
    }

    // Check driver availability for broadcast (Leaves ambulance = NULL until driver taps ACCEPT!)
    @Transactional
    public void assignNearestAmbulanceIfAvailable(EmergencyRequest request) {
        List<Ambulance> availableAmbulances = ambulanceRepo.findByIsAvailableTrue();

        if (availableAmbulances.isEmpty()) {
            request.setStatus(EmergencyStatus.NO_AMBULANCE_AVAILABLE);
            request.setAmbulance(null);
        } else {
            List<Long> declinedAmbulanceIds = declinedRepo.findByRequest(request)
                    .stream()
                    .map(r -> r.getAmbulance().getId())
                    .collect(Collectors.toList());

            boolean hasEligibleDriver = availableAmbulances.stream()
                    .anyMatch(a -> !declinedAmbulanceIds.contains(a.getId()));

            if (hasEligibleDriver) {
                request.setStatus(EmergencyStatus.CREATED);
                request.setAmbulance(null); // Keep ambulance NULL until a driver taps ACCEPT!
            } else {
                request.setStatus(EmergencyStatus.NO_AMBULANCE_AVAILABLE);
                request.setAmbulance(null);
            }
        }

        emergencyRepo.save(request);
    }

    // Get Broadcast Requests for Ambulance Driver (Strict Rank 1 Lock + 60s Timer Rule + Deterministic ID Tie-Breaker)
    public List<DriverDispatchDTO> getBroadcastRequestsForDriver(Long driverUserId) {
        Ambulance currentDriver = ambulanceRepo.findByUserId(driverUserId)
                .orElseGet(() -> ambulanceRepo.findById(driverUserId).orElse(null));

        List<EmergencyRequest> activeRequests = emergencyRepo.findActiveRequestsForDispatch();
        List<DriverDispatchDTO> dtos = new ArrayList<>();

        if (currentDriver == null || activeRequests.isEmpty()) return dtos;

        List<Ambulance> availableAmbulances = ambulanceRepo.findByIsAvailableTrue();

        for (EmergencyRequest req : activeRequests) {
            // Only broadcast unassigned requests (ambulance is null or status is CREATED)
            if (req.getAmbulance() != null && !req.getAmbulance().getId().equals(currentDriver.getId())) {
                continue; // Already claimed by another driver
            }

            // Check if current driver declined this request
            List<Long> declinedIds = declinedRepo.findByRequest(req).stream()
                    .map(r -> r.getAmbulance().getId())
                    .collect(Collectors.toList());
            if (declinedIds.contains(currentDriver.getId())) continue;

            double dist = calculateHaversineDistance(req.getLatitude(), req.getLongitude(), currentDriver.getLatitude(), currentDriver.getLongitude());
            int eta = (int) Math.max(2, Math.round(dist * 2.5));

            // Compute distances for all non-declined available ambulances to find rank
            List<AmbulanceDistance> distances = new ArrayList<>();
            for (Ambulance a : availableAmbulances) {
                if (declinedIds.contains(a.getId())) continue;
                double d = calculateHaversineDistance(req.getLatitude(), req.getLongitude(), a.getLatitude(), a.getLongitude());
                distances.add(new AmbulanceDistance(a, d, (int) Math.max(2, Math.round(d * 2.5))));
            }
            // Deterministic sorting with tie-breaker by ambulance ID
            distances.sort(Comparator.comparingDouble(AmbulanceDistance::getDistance)
                    .thenComparingLong(a -> a.getAmbulance().getId()));

            int rank = 1;
            for (int i = 0; i < distances.size(); i++) {
                if (distances.get(i).getAmbulance().getId().equals(currentDriver.getId())) {
                    rank = i + 1;
                    break;
                }
            }

            // 1-Minute (60-Second) Unlock Timer calculation
            long secondsElapsed = req.getCreatedAt() != null ? Duration.between(req.getCreatedAt(), LocalDateTime.now()).getSeconds() : 30;
            int unlocksInSeconds = (int) Math.max(0, 60 - secondsElapsed);

            boolean buttonEnabled = false;
            String reason = "";

            if (rank == 1) {
                buttonEnabled = true;
                reason = "🥇 Primary Unit (1st Priority - Nearest)";
            } else if (secondsElapsed >= 60) {
                buttonEnabled = true;
                reason = "🟢 Unlocked (60s priority timer expired)";
            } else {
                buttonEnabled = false;
                reason = "🔴 Locked: 1st priority unit has 60s window (Unlocks in " + unlocksInSeconds + "s)";
            }

            DriverDispatchDTO dto = new DriverDispatchDTO();
            dto.setId(req.getId());
            dto.setVictimName(req.getVictim() != null ? req.getVictim().getName() : "Express Guest");
            dto.setVictimPhone(req.getVictim() != null ? req.getVictim().getPhone() : "");
            dto.setLatitude(req.getLatitude());
            dto.setLongitude(req.getLongitude());
            dto.setLandmark(req.getLandmark());
            dto.setCategory(req.getCategory());
            dto.setPriorityLevel(req.getPriorityLevel());
            dto.setPriorityScore(req.getPriorityScore());
            dto.setStatus(req.getStatus());
            dto.setDistanceKm(dist);
            dto.setEtaMinutes(eta);
            dto.setRank(rank);
            dto.setButtonEnabled(buttonEnabled);
            dto.setReason(reason);
            dto.setUnlocksInSeconds(unlocksInSeconds);
            dto.setAssignedAmbulanceId(req.getAmbulance() != null ? req.getAmbulance().getId() : null);

            dtos.add(dto);
        }

        // Sort by Priority Score ASC (1=Critical first), then Distance ASC
        dtos.sort((a, b) -> {
            int pComp = Integer.compare(a.getPriorityScore(), b.getPriorityScore());
            if (pComp != 0) return pComp;
            return Double.compare(a.getDistanceKm(), b.getDistanceKm());
        });

        return dtos;
    }

    private static class AmbulanceDistance {
        private final Ambulance ambulance;
        private final double distance;
        private final int eta;

        public AmbulanceDistance(Ambulance ambulance, double distance, int eta) {
            this.ambulance = ambulance;
            this.distance = distance;
            this.eta = eta;
        }

        public Ambulance getAmbulance() { return ambulance; }
        public double getDistance() { return distance; }
        public int getEta() { return eta; }
    }

    // Driver Accepts Emergency Task with Atomic Race Condition & 60s Rank Protection (First-Accept Wins)
    @Transactional
    public EmergencyRequest acceptByAmbulance(Long requestId, Long driverUserId) {
        Ambulance amb = ambulanceRepo.findByUserId(driverUserId)
                .orElseGet(() -> ambulanceRepo.findById(driverUserId)
                        .orElseThrow(() -> new RuntimeException("Ambulance unit not found for ID: " + driverUserId)));

        EmergencyRequest request = emergencyRepo.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Emergency request not found"));

        // 60-Second Strict Priority Guard
        List<Ambulance> availableAmbulances = ambulanceRepo.findByIsAvailableTrue();
        List<Long> declinedIds = declinedRepo.findByRequest(request).stream()
                .map(r -> r.getAmbulance().getId())
                .collect(Collectors.toList());

        List<AmbulanceDistance> distances = new ArrayList<>();
        for (Ambulance a : availableAmbulances) {
            if (declinedIds.contains(a.getId())) continue;
            double d = calculateHaversineDistance(request.getLatitude(), request.getLongitude(), a.getLatitude(), a.getLongitude());
            distances.add(new AmbulanceDistance(a, d, (int) Math.max(2, Math.round(d * 2.5))));
        }
        distances.sort(Comparator.comparingDouble(AmbulanceDistance::getDistance)
                .thenComparingLong(a -> a.getAmbulance().getId()));

        int rank = 1;
        for (int i = 0; i < distances.size(); i++) {
            if (distances.get(i).getAmbulance().getId().equals(amb.getId())) {
                rank = i + 1;
                break;
            }
        }

        long secondsElapsed = request.getCreatedAt() != null ? Duration.between(request.getCreatedAt(), LocalDateTime.now()).getSeconds() : 30;
        int unlocksInSeconds = (int) Math.max(0, 60 - secondsElapsed);

        if (rank > 1 && secondsElapsed < 60) {
            throw new RuntimeException("Cannot accept yet! 1st Priority Ambulance has exclusive window for " + unlocksInSeconds + " more seconds.");
        }

        // Loophole Race Condition Protection: Atomic DB Claim
        int rowsUpdated = emergencyRepo.claimRequestAtomic(requestId, amb);
        if (rowsUpdated == 0) {
            throw new RuntimeException("SOS Already Claimed by another Ambulance unit!");
        }

        // FIX: MUST set ambulance entity on in-memory request instance before saving!
        request.setAmbulance(amb);
        request.setStatus(EmergencyStatus.ENROUTE_TO_VICTIM);
        amb.setIsAvailable(false);
        ambulanceRepo.save(amb);

        return emergencyRepo.save(request);
    }

    // Driver Declines / Cancels Task (Loophole Exclusion Logic)
    @Transactional
    public EmergencyRequest cancelByAmbulance(Long requestId, Long driverUserId) {
        EmergencyRequest request = emergencyRepo.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Emergency request not found"));
        Ambulance amb = ambulanceRepo.findByUserId(driverUserId)
                .orElseGet(() -> ambulanceRepo.findById(driverUserId)
                        .orElseThrow(() -> new RuntimeException("Ambulance unit not found for ID: " + driverUserId)));

        // Record decline in REQUEST_DECLINED_AMBULANCES table
        RequestDeclinedAmbulance decline = new RequestDeclinedAmbulance(request, amb);
        declinedRepo.save(decline);

        amb.setIsAvailable(true);
        ambulanceRepo.save(amb);

        request.setAmbulance(null);
        request.setStatus(EmergencyStatus.CREATED);
        emergencyRepo.save(request);

        // Auto-reassign to next nearest driver excluding declined units
        assignNearestAmbulanceIfAvailable(request);

        return request;
    }

    // Driver Arrives at Victim Site
    @Transactional
    public EmergencyRequest markArrivedAtVictim(Long requestId) {
        EmergencyRequest request = emergencyRepo.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Emergency request not found"));

        request.setStatus(EmergencyStatus.ARRIVED_AT_VICTIM);
        return emergencyRepo.save(request);
    }

    // Loophole 1 & 5: Calculate Top 3 Hospitals Matrix for Driver (Strict Bed > 0 Filtering + 3-Min Delta Rule)
    public List<HospitalDTO> getTop3HospitalsForDriver(Long requestId) {
        EmergencyRequest request = emergencyRepo.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Emergency request not found"));

        // Exclude hospitals that have already declined/diverted this specific emergency request
        List<Long> declinedHospitalIds = declinedHospitalRepo.findByRequest(request).stream()
                .map(rdh -> rdh.getHospital().getId())
                .collect(Collectors.toList());

        // Loophole 1 Strict Filtering: Only show hospitals where availableBeds > 0 and isAvailable = true and NOT in declined list
        List<Hospital> hospitals = hospitalRepo.findByIsAvailableTrue().stream()
                .filter(h -> h.getAvailableBeds() != null && h.getAvailableBeds() > 0)
                .filter(h -> !declinedHospitalIds.contains(h.getId()))
                .collect(Collectors.toList());

        if (hospitals.isEmpty()) return Collections.emptyList();

        List<HospitalDTO> dtos = new ArrayList<>();

        for (Hospital h : hospitals) {
            double dist = calculateHaversineDistance(request.getLatitude(), request.getLongitude(), h.getLatitude(), h.getLongitude());
            int eta = (int) Math.max(2, Math.round(dist * 2.5));

            HospitalDTO dto = new HospitalDTO();
            dto.setId(h.getId());
            dto.setHospitalName(h.getHospitalName());
            dto.setLatitude(h.getLatitude());
            dto.setLongitude(h.getLongitude());
            dto.setDistanceKm(dist);
            dto.setEtaMinutes(eta);
            dto.setAvailableBeds(h.getAvailableBeds());
            dto.setTotalBeds(h.getTotalBeds());
            dto.setButtonEnabled(true);
            dto.setReason("");
            dtos.add(dto);
        }

        // Sort by Haversine distance with ID tie-breaker
        dtos.sort(Comparator.comparingDouble(HospitalDTO::getDistanceKm)
                .thenComparingLong(HospitalDTO::getId));

        List<HospitalDTO> top3 = dtos.stream().limit(3).collect(Collectors.toList());
        if (top3.isEmpty()) return top3;

        int minEta = top3.get(0).getEtaMinutes();

        for (int i = 0; i < top3.size(); i++) {
            HospitalDTO item = top3.get(i);
            item.setRank(i + 1);

            int delta = item.getEtaMinutes() - minEta;
            if (delta <= 3) {
                item.setButtonEnabled(true);
                item.setReason("🟢 Enabled (Within 3 mins of nearest ER)");
            } else {
                item.setButtonEnabled(false);
                item.setReason("🔴 Disabled (>3 mins farther than nearest ER)");
            }
        }

        return top3;
    }

    // Driver Selects Target Hospital
    @Transactional
    public EmergencyRequest selectHospitalByDriver(Long requestId, Long hospitalId) {
        EmergencyRequest request = emergencyRepo.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Emergency request not found"));
        Hospital hospital = hospitalRepo.findById(hospitalId)
                .orElseThrow(() -> new RuntimeException("Hospital unit not found"));

        // Atomically reserve ER bed for incoming ambulance patient drop-off
        hospitalRepo.reserveBedAtomic(hospital.getId());

        request.setHospital(hospital);
        request.setStatus(EmergencyStatus.HOSPITAL_SELECTED);

        return emergencyRepo.save(request);
    }

    // Hospital Triggers Emergency Divert (Re-routing)
    @Transactional
    public EmergencyRequest divertByHospital(Long requestId) {
        EmergencyRequest request = emergencyRepo.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Emergency request not found"));

        Hospital hospital = request.getHospital();
        if (hospital != null) {
            hospital.setAvailableBeds(hospital.getAvailableBeds() + 1);
            hospitalRepo.save(hospital);

            // Log hospital decline so it is strictly excluded from Top 3 options for this request
            if (!declinedHospitalRepo.existsByRequestAndHospital(request, hospital)) {
                declinedHospitalRepo.save(new RequestDeclinedHospital(request, hospital));
            }
        }

        request.setHospital(null);
        request.setStatus(EmergencyStatus.ARRIVED_AT_VICTIM);

        return emergencyRepo.save(request);
    }

    // Compatibility stubs
    public EmergencyRequest acceptByHospital(Long requestId) {
        return emergencyRepo.findById(requestId).orElse(null);
    }

    public EmergencyRequest rejectByHospital(Long requestId) {
        return divertByHospital(requestId);
    }

    // Driver Completes Handover at Hospital ER Bay
    @Transactional
    public EmergencyRequest completeHandover(Long requestId) {
        EmergencyRequest request = emergencyRepo.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Emergency request not found"));

        if (request.getHospital() == null) {
            throw new RuntimeException("Cannot complete handover! A target hospital must be selected before completing handover.");
        }

        request.setStatus(EmergencyStatus.COMPLETED);
        Ambulance amb = request.getAmbulance();
        if (amb != null) {
            amb.setIsAvailable(true);
            ambulanceRepo.save(amb);
        }

        return emergencyRepo.save(request);
    }

    // Loophole 4: Victim Cancels SOS Request -> Frees Assigned Ambulance Immediately
    @Transactional
    public EmergencyRequest cancelByVictim(Long requestId) {
        EmergencyRequest request = emergencyRepo.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Emergency request not found"));

        request.setStatus(EmergencyStatus.CANCELLED);
        Ambulance amb = request.getAmbulance();
        if (amb != null) {
            amb.setIsAvailable(true);
            ambulanceRepo.save(amb);
        }

        return emergencyRepo.save(request);
    }

    // Hospital Manually Updates Bed Capacity & ICU Status
    @Transactional
    public Hospital updateHospitalCapacity(Long hospitalId, Integer availableBeds, Integer totalBeds, Boolean hasIcu) {
        Hospital hospital = hospitalRepo.findById(hospitalId)
                .orElseThrow(() -> new RuntimeException("Hospital facility not found"));

        if (totalBeds != null && totalBeds >= 0) {
            hospital.setTotalBeds(totalBeds);
        }
        if (availableBeds != null && availableBeds >= 0) {
            hospital.setAvailableBeds(availableBeds);
        }
        if (hasIcu != null) {
            hospital.setHasIcu(hasIcu);
        }

        return hospitalRepo.save(hospital);
    }

    // Admin Provisions Custom Hospital ER Unit
    @Transactional
    public Hospital provisionHospital(HospitalProvisionDTO dto) {
        if (userRepo.existsByEmail(dto.getEmail())) {
            throw new RuntimeException("Email already registered: " + dto.getEmail());
        }

        User user = new User();
        user.setName(dto.getName());
        user.setEmail(dto.getEmail());
        user.setPhone(dto.getPhone());
        user.setPassword(passwordEncoder.encode(dto.getPassword() != null ? dto.getPassword() : "hospital123"));
        user.setRole(Role.ROLE_HOSPITAL);
        User savedUser = userRepo.save(user);

        Hospital hospital = new Hospital();
        hospital.setUser(savedUser);
        hospital.setHospitalName(dto.getName());
        hospital.setLatitude(dto.getLatitude() != null ? dto.getLatitude() : 16.3100);
        hospital.setLongitude(dto.getLongitude() != null ? dto.getLongitude() : 80.4400);
        hospital.setTotalBeds(dto.getTotalBeds() != null ? dto.getTotalBeds() : 30);
        hospital.setAvailableBeds(dto.getAvailableBeds() != null ? dto.getAvailableBeds() : 15);
        hospital.setHasIcu(dto.getHasIcu() != null ? dto.getHasIcu() : true);
        hospital.setIsAvailable(true);

        return hospitalRepo.save(hospital);
    }

    // Admin Provisions Custom Ambulance Driver Unit
    @Transactional
    public Ambulance provisionAmbulance(AmbulanceProvisionDTO dto) {
        if (userRepo.existsByEmail(dto.getEmail())) {
            throw new RuntimeException("Email already registered: " + dto.getEmail());
        }

        User user = new User();
        user.setName(dto.getDriverName());
        user.setEmail(dto.getEmail());
        user.setPhone(dto.getPhone());
        user.setPassword(passwordEncoder.encode(dto.getPassword() != null ? dto.getPassword() : "driver123"));
        user.setRole(Role.ROLE_AMBULANCE);
        User savedUser = userRepo.save(user);

        Ambulance ambulance = new Ambulance();
        ambulance.setUser(savedUser);
        ambulance.setDriverName(dto.getDriverName());
        ambulance.setVehicleNumber(dto.getVehicleNumber() != null ? dto.getVehicleNumber() : "AP 39 X 1234");
        ambulance.setPhone(dto.getPhone());
        ambulance.setLatitude(dto.getLatitude() != null ? dto.getLatitude() : 16.3080);
        ambulance.setLongitude(dto.getLongitude() != null ? dto.getLongitude() : 80.4380);
        ambulance.setIsAvailable(true);

        return ambulanceRepo.save(ambulance);
    }

    public List<EmergencyRequest> getVictimRequests(Long victimId) {
        return emergencyRepo.findByVictimIdOrderByCreatedAtDesc(victimId);
    }

    public List<EmergencyRequest> getAmbulanceRequests(Long id) {
        Ambulance ambulance = ambulanceRepo.findByUserId(id)
                .orElseGet(() -> ambulanceRepo.findById(id)
                        .orElseThrow(() -> new RuntimeException("Ambulance unit not found for ID: " + id)));
        return emergencyRepo.findByAmbulance(ambulance);
    }

    public List<EmergencyRequest> getHospitalRequests(Long id) {
        Hospital hospital = hospitalRepo.findByUserId(id)
                .orElseGet(() -> hospitalRepo.findById(id)
                        .orElseThrow(() -> new RuntimeException("Hospital entity not found for ID: " + id)));
        return emergencyRepo.findByHospital(hospital);
    }

    public List<EmergencyRequest> getAllRequests() {
        return emergencyRepo.findAll();
    }

    public List<Hospital> getAllHospitals() {
        return hospitalRepo.findAll();
    }

    public List<Ambulance> getAllAmbulances() {
        return ambulanceRepo.findAll();
    }

    public AnalyticsResponse getAnalytics() {
        AnalyticsResponse response = new AnalyticsResponse();
        List<EmergencyRequest> requests = emergencyRepo.findAll();

        response.setTotalRequests(requests.size());
        response.setCompletedRequests(requests.stream().filter(r -> r.getStatus() == EmergencyStatus.COMPLETED).count());
        response.setActiveRequests(requests.stream().filter(r -> r.getStatus() != EmergencyStatus.COMPLETED && r.getStatus() != EmergencyStatus.CANCELLED).count());

        return response;
    }
}