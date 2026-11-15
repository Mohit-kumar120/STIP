package com.stip.config;

import com.stip.model.Role;
import com.stip.model.User;
import com.stip.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${stip.admin.username}") private String adminUsername;
    @Value("${stip.admin.email}") private String adminEmail;
    @Value("${stip.admin.password}") private String adminPassword;
    @Value("${stip.ingest.email}") private String ingestEmail;
    @Value("${stip.ingest.password}") private String ingestPassword;

    public DataSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        seed(adminUsername, adminEmail, adminPassword, Role.ADMIN);
        if (ingestPassword != null && !ingestPassword.isBlank()) {
            seed("ingestion", ingestEmail, ingestPassword, Role.ANALYST);
        }
    }

    private void seed(String username, String email, String password, Role role) {
        String e = email.toLowerCase();
        if (userRepository.existsByEmail(e)) return;
        User u = new User();
        u.setUsername(username);
        u.setEmail(e);
        u.setPasswordHash(passwordEncoder.encode(password));
        u.setRole(role);
        userRepository.save(u);
        System.out.println("Seeded " + role + " user: " + e);
    }
}