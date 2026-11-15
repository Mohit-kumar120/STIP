package com.stip.controller;

import com.stip.dto.IndicatorRequest;
import com.stip.dto.IndicatorStatusRequest;
import com.stip.dto.PageResponse;
import com.stip.dto.ParsedQuery;
import com.stip.model.*;
import com.stip.repository.IndicatorRepository;
import com.stip.service.IndicatorService;
import com.stip.service.NlQueryService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/indicators")
public class IndicatorController {
    public record QueryRequest(@NotBlank @Size(max = 300) String query) {}
    public record AiNoteRequest(@NotBlank @Size(max = 2000) String aiReasoning) {}

    private final IndicatorService service;
    private final IndicatorRepository repo;
    private final NlQueryService nlQuery;

    public IndicatorController(IndicatorService service, IndicatorRepository repo, NlQueryService nlQuery) {
        this.service = service;
        this.repo = repo;
        this.nlQuery = nlQuery;
    }

    @GetMapping
    public PageResponse<ThreatIndicator> list(
            @RequestParam(required = false) List<IndicatorType> type,
            @RequestParam(required = false) List<Severity> severity,
            @RequestParam(required = false) IndicatorStatus status,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Integer days,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Boolean unenriched,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return service.search(type, severity, status, category, days, q, unenriched, page, size);
    }

    /** Turns a plain-English request into validated filters. Does not run the search itself. */
    @PostMapping("/parse-query")
    public ParsedQuery parseQuery(@Valid @RequestBody QueryRequest req) {
        return nlQuery.parse(req.query());
    }

    @GetMapping("/{id}")
    public ThreatIndicator get(@PathVariable String id) {
        return repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Indicator not found"));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','ANALYST')")
    public ThreatIndicator upsert(@Valid @RequestBody IndicatorRequest req) {
        return service.upsert(req);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN','ANALYST')")
    public ThreatIndicator setStatus(@PathVariable String id, @Valid @RequestBody IndicatorStatusRequest req) {
        ThreatIndicator i = get(id);
        i.setStatus(req.status());
        return repo.save(i);
    }

    @PatchMapping("/{id}/ai")
    @PreAuthorize("hasAnyRole('ADMIN','ANALYST')")
    public ThreatIndicator setAiNote(@PathVariable String id, @Valid @RequestBody AiNoteRequest req) {
        ThreatIndicator i = get(id);
        i.setAiReasoning(req.aiReasoning());
        return repo.save(i);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        if (!repo.existsById(id)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Indicator not found");
        repo.deleteById(id);
    }
}