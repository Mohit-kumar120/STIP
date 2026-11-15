// IndicatorStatusRequest.java
package com.stip.dto;

import com.stip.model.IndicatorStatus;
import jakarta.validation.constraints.NotNull;

public record IndicatorStatusRequest(@NotNull IndicatorStatus status) {}