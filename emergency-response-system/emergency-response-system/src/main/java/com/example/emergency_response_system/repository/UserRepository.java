package com.example.emergency_response_system.repository;


import org.springframework.data.jpa.repository.JpaRepository;
import com.example.emergency_response_system.entity.User;
import com.example.emergency_response_system.entity.Role;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    boolean existsByEmail(String email);
    Optional<User> findByEmail(String email);
    List<User> findByRole(Role role);

}