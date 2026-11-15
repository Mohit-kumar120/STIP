package com.stip.model;

import java.time.Instant;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "alerts")
@Getter @Setter
public class Alert {
    @Id private String id;
    @Indexed private String indicatorId;
    private String title;
    private String description;
    private Severity severity;
    private Integer aiScore;
    @Indexed private AlertStatus status = AlertStatus.OPEN;
    private String assignedTo;         // analyst email
    private Instant createdAt = Instant.now();
    private Instant updatedAt = Instant.now();
}