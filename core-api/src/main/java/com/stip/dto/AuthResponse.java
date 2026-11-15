package com.stip.dto;

import com.stip.model.Role;

public record AuthResponse(String token, String username, String email, Role role) {}