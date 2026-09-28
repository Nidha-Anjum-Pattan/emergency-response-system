package com.example.emergency_response_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.emergency_response_system.entity.RequestDeclinedAmbulance;
import com.example.emergency_response_system.entity.EmergencyRequest;
import com.example.emergency_response_system.entity.Ambulance;
import java.util.List;

public interface RequestDeclinedAmbulanceRepository extends JpaRepository<RequestDeclinedAmbulance, Long> {
    boolean existsByRequestAndAmbulance(EmergencyRequest request, Ambulance ambulance);
    List<RequestDeclinedAmbulance> findByRequest(EmergencyRequest request);
}
