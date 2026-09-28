package com.example.emergency_response_system.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.emergency_response_system.entity.*;
import com.example.emergency_response_system.repository.*;

import jakarta.annotation.PostConstruct;
import java.util.List;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private HospitalRepository hospitalRepository;

    @Autowired
    private AmbulanceRepository ambulanceRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostConstruct
    public void initDemoAccounts() {
        try {
            // 1. Seed Admin
            if (!userRepository.existsByEmail("admin@emergency.com")) {
                User admin = new User();
                admin.setName("System Master Admin");
                admin.setEmail("admin@emergency.com");
                admin.setPhone("9999999999");
                admin.setPassword(passwordEncoder.encode("admin123"));
                admin.setRole(Role.ROLE_ADMIN);
                userRepository.save(admin);
            }

            // 2. Seed Hospital 1
            if (!userRepository.existsByEmail("hospital1@emergency.com")) {
                User hosp1User = new User();
                hosp1User.setName("City Emergency General Hospital");
                hosp1User.setEmail("hospital1@emergency.com");
                hosp1User.setPhone("040-23456789");
                hosp1User.setPassword(passwordEncoder.encode("hospital123"));
                hosp1User.setRole(Role.ROLE_HOSPITAL);
                User savedHosp1 = userRepository.save(hosp1User);

                Hospital h1 = new Hospital(savedHosp1, "City Emergency General Hospital", 16.3100, 80.4400, 12, 30);
                hospitalRepository.save(h1);
            }

            // 3. Seed Hospital 2
            if (!userRepository.existsByEmail("hospital2@emergency.com")) {
                User hosp2User = new User();
                hosp2User.setName("Apollo Trauma Center");
                hosp2User.setEmail("hospital2@emergency.com");
                hosp2User.setPhone("040-87654321");
                hosp2User.setPassword(passwordEncoder.encode("hospital123"));
                hosp2User.setRole(Role.ROLE_HOSPITAL);
                User savedHosp2 = userRepository.save(hosp2User);

                Hospital h2 = new Hospital(savedHosp2, "Apollo Trauma Center", 16.3150, 80.4450, 10, 45);
                hospitalRepository.save(h2);
            }

            // 4. Seed Ambulance Driver 1
            if (!userRepository.existsByEmail("driver1@emergency.com")) {
                User amb1User = new User();
                amb1User.setName("Ramesh Kumar (Driver)");
                amb1User.setEmail("driver1@emergency.com");
                amb1User.setPhone("9876543211");
                amb1User.setPassword(passwordEncoder.encode("driver123"));
                amb1User.setRole(Role.ROLE_AMBULANCE);
                User savedAmb1 = userRepository.save(amb1User);

                Ambulance a1 = new Ambulance(savedAmb1, "Ramesh Kumar", "AP 39 X 1234", "9876543211", 16.3080, 80.4380);
                ambulanceRepository.save(a1);
            }

            // 5. Seed Ambulance Driver 2
            if (!userRepository.existsByEmail("driver2@emergency.com")) {
                User amb2User = new User();
                amb2User.setName("Suresh Reddy (Driver)");
                amb2User.setEmail("driver2@emergency.com");
                amb2User.setPhone("9876543212");
                amb2User.setPassword(passwordEncoder.encode("driver123"));
                amb2User.setRole(Role.ROLE_AMBULANCE);
                User savedAmb2 = userRepository.save(amb2User);

                Ambulance a2 = new Ambulance(savedAmb2, "Suresh Reddy", "AP 39 X 5678", "9876543212", 16.3120, 80.4420);
                ambulanceRepository.save(a2);
            }

            // 6. Seed Victim 1
            if (!userRepository.existsByEmail("victim1@emergency.com")) {
                User victim = new User();
                victim.setName("John Doe");
                victim.setEmail("victim1@emergency.com");
                victim.setPhone("9876543210");
                victim.setPassword(passwordEncoder.encode("victim123"));
                victim.setRole(Role.ROLE_USER);
                victim.setBloodGroup("O+");
                victim.setEmergencyContact("9988776655");
                userRepository.save(victim);
            }

            System.out.println("✅ All Emergency Demo Accounts Seeded Successfully!");
        } catch (Exception e) {
            System.out.println("Demo seeding note: " + e.getMessage());
        }
    }

    @Transactional
    public User createUser(User user) {
        if (user.getEmail() != null && !user.getEmail().isEmpty() && userRepository.existsByEmail(user.getEmail())) {
            throw new RuntimeException("Email already exists");
        }
        if (user.getPhone() != null && !user.getPhone().isEmpty() && userRepository.existsByPhone(user.getPhone())) {
            throw new RuntimeException("Phone number already exists");
        }
        if (user.getPassword() != null) {
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        }

        User savedUser = userRepository.save(user);

        // Auto-create role specific operational entity if missing
        if (savedUser.getRole() == Role.ROLE_HOSPITAL) {
            if (hospitalRepository.findByUserId(savedUser.getId()).isEmpty()) {
                Hospital hospital = new Hospital(savedUser, savedUser.getName(), 16.3070, 80.4370, 10, 30);
                hospitalRepository.save(hospital);
            }
        } else if (savedUser.getRole() == Role.ROLE_AMBULANCE) {
            if (ambulanceRepository.findByUserId(savedUser.getId()).isEmpty()) {
                Ambulance ambulance = new Ambulance(savedUser, savedUser.getName(), "AP 39 X 1234", savedUser.getPhone(), 16.3080, 80.4380);
                ambulanceRepository.save(ambulance);
            }
        }

        return savedUser;
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User updateUser(Long id, User updatedUser) {
        User existingUser = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (updatedUser.getEmail() != null && !existingUser.getEmail().equals(updatedUser.getEmail())) {
            if (userRepository.existsByEmail(updatedUser.getEmail())) {
                throw new RuntimeException("Email already exists");
            }
            existingUser.setEmail(updatedUser.getEmail());
        }

        existingUser.setName(updatedUser.getName());
        existingUser.setPhone(updatedUser.getPhone());
        if (updatedUser.getBloodGroup() != null) existingUser.setBloodGroup(updatedUser.getBloodGroup());
        if (updatedUser.getEmergencyContact() != null) existingUser.setEmergencyContact(updatedUser.getEmergencyContact());

        return userRepository.save(existingUser);
    }

    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        userRepository.delete(user);
    }
}
