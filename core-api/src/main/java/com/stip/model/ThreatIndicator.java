package com.stip.model;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "indicators")
@CompoundIndex(name = "type_value_unique", def = "{'type': 1, 'value': 1}", unique = true)
@Getter @Setter
public class ThreatIndicator {
    @Id private String id;
    private IndicatorType type;
    private String value;
    private String source;
    @Indexed private Severity severity;
    private Integer confidenceScore;   // 0-100
    private String category;           // phishing, malware, c2, scanning...
    private List<String> tags = new ArrayList<>();
    private String description;
    private String aiReasoning;        // filled by the Ollama step later
    private IndicatorStatus status = IndicatorStatus.ACTIVE;
    private Instant firstSeen = Instant.now();
    @Indexed private Instant lastSeen = Instant.now();
}