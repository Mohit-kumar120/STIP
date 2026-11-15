// AlertRequest.java
package com.stip.dto;

import com.stip.model.Severity;
import jakarta.validation.constraints.*;

public record AlertRequest(
        @NotBlank @Size(max = 200) String title,
        @Size(max = 2000) String description,
        @NotNull Severity severity,
        String indicatorId,
        @Min(0) @Max(100) Integer aiScore) {}