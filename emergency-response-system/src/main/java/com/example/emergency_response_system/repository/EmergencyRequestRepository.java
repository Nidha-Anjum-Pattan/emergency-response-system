package com.example.emergency_response_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.example.emergency_response_system.entity.EmergencyRequest;
import com.example.emergency_response_system.entity.User;
import com.example.emergency_response_system.entity.Ambulance;
import com.example.emergency_response_system.entity.Hospital;
import java.util.List;

public interface EmergencyRequestRepository extends JpaRepository<EmergencyRequest, Long> {
    List<EmergencyRequest> findByVictim(User victim);
    List<EmergencyRequest> findByAmbulance(Ambulance ambulance);
    List<EmergencyRequest> findByHospital(Hospital hospital);

    @Query("SELECT r FROM EmergencyRequest r WHERE r.victim.id = :victimId ORDER BY r.createdAt DESC")
    List<EmergencyRequest> findByVictimIdOrderByCreatedAtDesc(@Param("victimId") Long victimId);

    @Query("SELECT r FROM EmergencyRequest r WHERE r.status IN ('CREATED', 'SEARCHING_AMBULANCE', 'AMBULANCE_ASSIGNED', 'ENROUTE_TO_VICTIM', 'ARRIVED_AT_VICTIM', 'HOSPITAL_SELECTED') ORDER BY r.priorityScore ASC, r.createdAt ASC")
    List<EmergencyRequest> findActiveRequestsForDispatch();

    @Modifying
    @Query("UPDATE EmergencyRequest r SET r.status = com.example.emergency_response_system.entity.EmergencyStatus.AMBULANCE_ASSIGNED, r.ambulance = :ambulance WHERE r.id = :requestId AND (r.status = com.example.emergency_response_system.entity.EmergencyStatus.CREATED OR r.status = com.example.emergency_response_system.entity.EmergencyStatus.SEARCHING_AMBULANCE OR r.ambulance = :ambulance)")
    int claimRequestAtomic(@Param("requestId") Long requestId, @Param("ambulance") Ambulance ambulance);
}