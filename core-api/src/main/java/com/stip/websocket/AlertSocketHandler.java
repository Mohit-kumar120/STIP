package com.stip.websocket;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stip.repository.UserRepository;
import com.stip.security.JwtService;
import jakarta.annotation.PreDestroy;
import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.ConcurrentWebSocketSessionDecorator;
import org.springframework.web.socket.handler.TextWebSocketHandler;

@Component
public class AlertSocketHandler extends TextWebSocketHandler {
    private static final Logger log = LoggerFactory.getLogger(AlertSocketHandler.class);

    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final ObjectMapper mapper;
    private final Map<String, WebSocketSession> live = new ConcurrentHashMap<>();
    private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();

    public AlertSocketHandler(JwtService jwtService, UserRepository userRepository, ObjectMapper mapper) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.mapper = mapper;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        session.setTextMessageSizeLimit(4096);
        // must authenticate within 5 seconds
        scheduler.schedule(() -> {
            if (!live.containsKey(session.getId())) closeQuietly(session, CloseStatus.POLICY_VIOLATION);
        }, 5, TimeUnit.SECONDS);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws IOException {
        if (live.containsKey(session.getId())) return;   // already authenticated; ignore further input
        try {
            JsonNode n = mapper.readTree(message.getPayload());
            String token = n.path("token").asText("");
            boolean ok = "auth".equals(n.path("type").asText())
                    && jwtService.isValid(token)
                    && userRepository.findByEmail(jwtService.extractEmail(token)).isPresent();
            if (!ok) {
                closeQuietly(session, CloseStatus.POLICY_VIOLATION);
                return;
            }
            WebSocketSession safe = new ConcurrentWebSocketSessionDecorator(session, 5000, 64 * 1024);
            live.put(session.getId(), safe);
            safe.sendMessage(new TextMessage("{\"type\":\"auth.ok\"}"));
        } catch (JsonProcessingException e) {
            closeQuietly(session, CloseStatus.POLICY_VIOLATION);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        live.remove(session.getId());
    }

    /** Sends an event to every authenticated browser. Called after the database save. */
    public void broadcast(String type, Object alert) {
        String json;
        try {
            json = mapper.writeValueAsString(Map.of("type", type, "alert", alert));
        } catch (JsonProcessingException e) {
            log.warn("Could not serialize {} event: {}", type, e.getMessage());
            return;
        }
        TextMessage msg = new TextMessage(json);
        live.values().forEach(s -> {
            try {
                s.sendMessage(msg);
            } catch (Exception e) {
                live.remove(s.getId());
                closeQuietly(s, CloseStatus.SERVER_ERROR);
            }
        });
    }

    private void closeQuietly(WebSocketSession s, CloseStatus status) {
        try {
            s.close(status);
        } catch (IOException ignored) {
            // already closed
        }
    }

    @PreDestroy
    void shutdown() {
        scheduler.shutdownNow();
    }
}