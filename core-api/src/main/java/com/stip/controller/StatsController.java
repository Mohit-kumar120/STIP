package com.stip.controller;

import com.stip.model.AlertStatus;
import com.stip.model.Severity;
import com.stip.repository.AlertRepository;
import com.stip.repository.IndicatorRepository;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class StatsController {
    private final IndicatorRepository indicators;
    private final AlertRepository alerts;

    public StatsController(IndicatorRepository indicators, AlertRepository alerts) {
        this.indicators = indicators;
        this.alerts = alerts;
    }

    @GetMapping("/api/stats")
    public Map<String, Object> stats() {
        Map<String, Long> bySeverity = new LinkedHashMap<>();
        for (Severity s : Severity.values()) bySeverity.put(s.name(), indicators.countBySeverity(s));

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("totalIndicators", indicators.count());
        out.put("indicatorsBySeverity", bySeverity);
        out.put("openAlerts", alerts.countByStatus(AlertStatus.OPEN));
        out.put("investigatingAlerts", alerts.countByStatus(AlertStatus.INVESTIGATING));
        return out;
    }
}