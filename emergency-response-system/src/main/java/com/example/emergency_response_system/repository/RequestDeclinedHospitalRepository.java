package com.example.emergency_response_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.example.emergency_response_system.entity.EmergencyRequest;
import com.example.emergency_response_system.entity.Hospital;
import com.example.emergency_response_system.entity.RequestDeclinedHospital;

import java.util.List;

@Repository
public interface RequestDeclinedHospitalRepository extends JpaRepository<RequestDeclinedHospital, Long> {
    List<RequestDeclinedHospital> findByRequest(EmergencyRequest request);
    boolean existsByRequestAndHospital(EmergencyRequest request, Hospital hospital);
}
