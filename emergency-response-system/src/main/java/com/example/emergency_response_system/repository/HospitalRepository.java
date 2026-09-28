package com.example.emergency_response_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.example.emergency_response_system.entity.Hospital;
import com.example.emergency_response_system.entity.User;
import java.util.List;
import java.util.Optional;

public interface HospitalRepository extends JpaRepository<Hospital, Long> {
    Optional<Hospital> findByUser(User user);
    Optional<Hospital> findByUserId(Long userId);
    List<Hospital> findByIsAvailableTrue();

    @Modifying
    @Query("UPDATE Hospital h SET h.availableBeds = h.availableBeds - 1 WHERE h.id = :id AND h.availableBeds > 0")
    int reserveBedAtomic(@Param("id") Long id);
}
