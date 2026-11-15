package com.stip.service;

import com.stip.dto.IndicatorRequest;
import com.stip.dto.PageResponse;
import com.stip.model.*;
import com.stip.repository.AlertRepository;
import com.stip.repository.IndicatorRepository;
import com.stip.websocket.AlertSocketHandler;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;
import org.springframework.data.domain.*;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

@Service
public class IndicatorService {
    private final IndicatorRepository indicators;
    private final AlertRepository alerts;
    private final MongoTemplate mongo;
    private final AlertSocketHandler events;

    public IndicatorService(IndicatorRepository indicators, AlertRepository alerts,
                            MongoTemplate mongo, AlertSocketHandler events) {
        this.indicators = indicators;
        this.alerts = alerts;
        this.mongo = mongo;
        this.events = events;
    }

    public PageResponse<ThreatIndicator> search(List<IndicatorType> types, List<Severity> severities,
                                                IndicatorStatus status, String category, Integer days,
                                                String q, Boolean unenriched, int page, int size) {
        List<Criteria> conds = new ArrayList<>();
        if (types != null && !types.isEmpty()) conds.add(Criteria.where("type").in(types));
        if (severities != null && !severities.isEmpty()) conds.add(Criteria.where("severity").in(severities));
        if (status != null) conds.add(Criteria.where("status").is(status));
        if (category != null && !category.isBlank()) {
            conds.add(Criteria.where("category").regex("^" + Pattern.quote(category.trim()) + "$", "i"));
        }
        if (days != null && days > 0) {
            conds.add(Criteria.where("lastSeen").gte(Instant.now().minus(days, ChronoUnit.DAYS)));
        }
        if (q != null && !q.isBlank()) {
            String rx = Pattern.quote(q.trim());
            conds.add(new Criteria().orOperator(
                    Criteria.where("value").regex(rx, "i"),
                    Criteria.where("description").regex(rx, "i"),
                    Criteria.where("source").regex(rx, "i"),
                    Criteria.where("tags").regex(rx, "i")));
        }
        if (Boolean.TRUE.equals(unenriched)) {
            conds.add(new Criteria().orOperator(
                    Criteria.where("aiReasoning").is(null),
                    Criteria.where("aiReasoning").is("")));
        }

        Query query = new Query();
        if (!conds.isEmpty()) query.addCriteria(new Criteria().andOperator(conds.toArray(new Criteria[0])));

        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100),
                Sort.by(Sort.Direction.DESC, "lastSeen"));
        long total = mongo.count(Query.of(query).limit(-1).skip(-1), ThreatIndicator.class);
        List<ThreatIndicator> items = mongo.find(query.with(pageable), ThreatIndicator.class);
        return PageResponse.from(new PageImpl<>(items, pageable, total));
    }

    /** Create the indicator, or refresh it if the same type+value already exists. */
    public ThreatIndicator upsert(IndicatorRequest r) {
        String value = normalize(r.type(), r.value());
        Optional<ThreatIndicator> existing = indicators.findByTypeAndValue(r.type(), value);
        boolean isNew = existing.isEmpty();
        ThreatIndicator ind = existing.orElseGet(ThreatIndicator::new);

        if (isNew) {
            ind.setType(r.type());
            ind.setValue(value);
            ind.setFirstSeen(Instant.now());
        }
        ind.setSource(r.source());
        ind.setSeverity(r.severity());
        ind.setConfidenceScore(r.confidenceScore());
        ind.setCategory(r.category());
        if (r.tags() != null) ind.setTags(r.tags());
        ind.setDescription(r.description());
        if (r.aiReasoning() != null) ind.setAiReasoning(r.aiReasoning());   // keep AI notes across re-ingestion
        ind.setLastSeen(Instant.now());

        ThreatIndicator saved = indicators.save(ind);
        if (isNew && (saved.getSeverity() == Severity.HIGH || saved.getSeverity() == Severity.CRITICAL)) {
            createAlertFor(saved);
        }
        return saved;
    }

    private void createAlertFor(ThreatIndicator i) {
        Alert a = new Alert();
        a.setIndicatorId(i.getId());
        a.setTitle(i.getSeverity() + " " + i.getType() + " indicator: " + i.getValue());
        a.setDescription(i.getDescription());
        a.setSeverity(i.getSeverity());
        a.setAiScore(i.getConfidenceScore());
        events.broadcast("alert.created", alerts.save(a));   // push to live dashboards
    }

    private String normalize(IndicatorType type, String raw) {
        String v = raw.trim();
        return switch (type) {
            case CVE -> v.toUpperCase();
            case URL -> v;                    // paths are case-sensitive
            default -> v.toLowerCase();       // IP, DOMAIN, HASH, EMAIL
        };
    }
}