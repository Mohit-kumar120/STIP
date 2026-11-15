// IndicatorRepository.java
package com.stip.repository;

import com.stip.model.*;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface IndicatorRepository extends MongoRepository<ThreatIndicator, String> {
    Optional<ThreatIndicator> findByTypeAndValue(IndicatorType type, String value);
    long countBySeverity(Severity severity);
}