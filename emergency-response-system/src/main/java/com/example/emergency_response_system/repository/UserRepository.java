package com.example.emergency_response_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.example.emergency_response_system.entity.User;
import com.example.emergency_response_system.entity.Role;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    boolean existsByEmail(String email);
    boolean existsByPhone(String phone);
    Optional<User> findByEmail(String email);
    Optional<User> findByPhone(String phone);

    @Query("SELECT u FROM User u WHERE u.email = :identifier OR u.phone = :identifier")
    Optional<User> findByEmailOrPhone(@Param("identifier") String identifier);

    List<User> findByRole(Role role);
}