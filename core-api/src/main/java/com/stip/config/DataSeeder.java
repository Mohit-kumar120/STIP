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

    String normalizedEmail = email.toLowerCase().trim();

    var existingUser = userRepository.findByEmail(normalizedEmail);

    if (existingUser.isPresent()) {

        User user = existingUser.get();

        // Never overwrite an existing ADMIN account.
        if (role == Role.ADMIN) {
            System.out.println("Existing ADMIN preserved: " + normalizedEmail);
            return;
        }

        // Update the existing ANALYST credentials.
        if (role == Role.ANALYST) {

            if (password == null || password.isBlank()) {
                throw new IllegalStateException(
                    "INGEST password is missing"
                );
            }

            user.setPasswordHash(
                passwordEncoder.encode(password)
            );

            user.setRole(Role.ANALYST);

            userRepository.save(user);

            System.out.println(
                "Updated ANALYST credentials: " + normalizedEmail
            );
        }

        return;
    }

    // Create user only if it does not already exist.
    User user = new User();

    user.setUsername(username);
    user.setEmail(normalizedEmail);
    user.setPasswordHash(passwordEncoder.encode(password));
    user.setRole(role);

    userRepository.save(user);

    System.out.println("Seeded " + role + " user: " + normalizedEmail);
}

}
