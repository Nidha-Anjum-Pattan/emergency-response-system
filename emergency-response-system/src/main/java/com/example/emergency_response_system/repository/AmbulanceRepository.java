package com.example.emergency_response_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.emergency_response_system.entity.Ambulance;
import com.example.emergency_response_system.entity.User;
import java.util.List;
import java.util.Optional;

public interface AmbulanceRepository extends JpaRepository<Ambulance, Long> {
    Optional<Ambulance> findByUser(User user);
    Optional<Ambulance> findByUserId(Long userId);
    List<Ambulance> findByIsAvailableTrue();
}
