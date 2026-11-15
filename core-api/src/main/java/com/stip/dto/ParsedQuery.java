package com.stip.dto;

import com.stip.model.IndicatorStatus;
import com.stip.model.IndicatorType;
import com.stip.model.Severity;
import java.util.List;

public record ParsedQuery(
        List<IndicatorType> type,
        List<Severity> severity,
        IndicatorStatus status,
        String category,
        Integer days,
        String text,
        boolean fallback) {}