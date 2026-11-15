// IndicatorRequest.java
package com.stip.dto;

import com.stip.model.IndicatorType;
import com.stip.model.Severity;
import jakarta.validation.constraints.*;
import java.util.List;

public record IndicatorRequest(
        @NotNull IndicatorType type,
        @NotBlank @Size(max = 2048) String value,
        @Size(max = 100) String source,
        @NotNull Severity severity,
        @Min(0) @Max(100) Integer confidenceScore,
        @Size(max = 50) String category,
        List<@Size(max = 40) String> tags,
        @Size(max = 2000) String description,
        @Size(max = 2000) String aiReasoning) {}