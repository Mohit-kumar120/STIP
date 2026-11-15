package com.stip.controller;

import com.stip.dto.UserResponse;
import com.stip.model.Role;
import com.stip.model.User;
import com.stip.repository.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class UserController {
    public record RoleRequest(@NotNull Role role) {}

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/api/users/me")
    public UserResponse me(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .map(UserResponse::from)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    @GetMapping("/api/admin/users")
    public List<UserResponse> allUsers() {
        return userRepository.findAll().stream().map(UserResponse::from).toList();
    }

    @PatchMapping("/api/admin/users/{id}/role")
    public UserResponse setRole(@PathVariable String id, @Valid @RequestBody RoleRequest req,
                                Authentication auth) {
        User u = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (u.getEmail().equals(auth.getName())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You can't change your own role");
        }
        u.setRole(req.role());
        return UserResponse.from(userRepository.save(u));
    }
}