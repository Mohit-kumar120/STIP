// AlertStatusRequest.java
package com.stip.dto;

import com.stip.model.AlertStatus;
import jakarta.validation.constraints.NotNull;

public record AlertStatusRequest(@NotNull AlertStatus status) {}