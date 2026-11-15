package com.stip.controller;

import com.stip.dto.AlertRequest;
import com.stip.dto.AlertStatusRequest;
import com.stip.dto.PageResponse;
import com.stip.model.*;
import com.stip.repository.AlertRepository;
import com.stip.websocket.AlertSocketHandler;
import jakarta.validation.Valid;
import java.time.Instant;
import java.util.List;
import org.springframework.data.domain.*;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/alerts")
public class AlertController {
    private final AlertRepository repo;
    private final MongoTemplate mongo;
    private final AlertSocketHandler events;

    public AlertController(AlertRepository repo, MongoTemplate mongo, AlertSocketHandler events) {
        this.repo = repo;
        this.mongo = mongo;
        this.events = events;
    }

    @GetMapping
    public PageResponse<Alert> list(
            @RequestParam(required = false) AlertStatus status,
            @RequestParam(required = false) Severity severity,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Query query = new Query();
        if (status != null) query.addCriteria(Criteria.where("status").is(status));
        if (severity != null) query.addCriteria(Criteria.where("severity").is(severity));
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100),
                Sort.by(Sort.Direction.DESC, "createdAt"));
        long total = mongo.count(Query.of(query).limit(-1).skip(-1), Alert.class);
        List<Alert> items = mongo.find(query.with(pageable), Alert.class);
        return PageResponse.from(new PageImpl<>(items, pageable, total));
    }

    @GetMapping("/{id}")
    public Alert get(@PathVariable String id) {
        return repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Alert not found"));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','ANALYST')")
    @ResponseStatus(HttpStatus.CREATED)
    public Alert create(@Valid @RequestBody AlertRequest req) {
        Alert a = new Alert();
        a.setTitle(req.title());
        a.setDescription(req.description());
        a.setSeverity(req.severity());
        a.setIndicatorId(req.indicatorId());
        a.setAiScore(req.aiScore());
        Alert saved = repo.save(a);
        events.broadcast("alert.created", saved);
        return saved;
    }

    /** Analyst takes ownership of an alert. */
    @PostMapping("/{id}/claim")
    @PreAuthorize("hasAnyRole('ADMIN','ANALYST')")
    public Alert claim(@PathVariable String id, Authentication auth) {
        Alert a = get(id);
        a.setAssignedTo(auth.getName());
        if (a.getStatus() == AlertStatus.OPEN) a.setStatus(AlertStatus.INVESTIGATING);
        a.setUpdatedAt(Instant.now());
        Alert saved = repo.save(a);
        events.broadcast("alert.updated", saved);
        return saved;
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN','ANALYST')")
    public Alert setStatus(@PathVariable String id, @Valid @RequestBody AlertStatusRequest req) {
        Alert a = get(id);
        a.setStatus(req.status());
        a.setUpdatedAt(Instant.now());
        Alert saved = repo.save(a);
        events.broadcast("alert.updated", saved);
        return saved;
    }
}