package com.example.emergency_response_system.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.emergency_response_system.entity.User;
import com.example.emergency_response_system.repository.UserRepository;

import java.util.List;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;

    public User createUser(User user) {
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new RuntimeException("Email already exists");
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
    
    public User updateUser(Long id, User updatedUser) {

        User existingUser = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check if email is being changed
        if (!existingUser.getEmail().equals(updatedUser.getEmail())) {

            if (userRepository.existsByEmail(updatedUser.getEmail())) {
                throw new RuntimeException("Email already exists");
            }

            existingUser.setEmail(updatedUser.getEmail());
        }

        existingUser.setName(updatedUser.getName());
        existingUser.setRole(updatedUser.getRole());

        return userRepository.save(existingUser);
    }
    
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        userRepository.delete(user);
    }
}
