package com.stip.dto;

import com.stip.model.Role;
import com.stip.model.User;
import java.time.Instant;

public record UserResponse(String id, String username, String email, Role role, Instant createdAt) {
    public static UserResponse from(User u) {
        return new UserResponse(u.getId(), u.getUsername(), u.getEmail(), u.getRole(), u.getCreatedAt());
    }
}