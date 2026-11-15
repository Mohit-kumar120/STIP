// AlertRepository.java
package com.stip.repository;

import com.stip.model.Alert;
import com.stip.model.AlertStatus;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface AlertRepository extends MongoRepository<Alert, String> {
    long countByStatus(AlertStatus status);
}