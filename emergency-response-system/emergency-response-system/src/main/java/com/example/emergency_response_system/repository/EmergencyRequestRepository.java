package com.example.emergency_response_system.repository;


import org.springframework.data.jpa.repository.JpaRepository;
import com.example.emergency_response_system.entity.EmergencyRequest;
import com.example.emergency_response_system.entity.EmergencyStatus;
import com.example.emergency_response_system.entity.User;

import java.util.List;

public interface EmergencyRequestRepository 
        extends JpaRepository<EmergencyRequest, Long> {

    List<EmergencyRequest> findByHospital(User hospital);

    List<EmergencyRequest> findByAmbulance(User ambulance);

    List<EmergencyRequest> findByVictim(User victim);

    List<EmergencyRequest> findByStatus(EmergencyStatus status);
}