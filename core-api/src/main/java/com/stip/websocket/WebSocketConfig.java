package com.stip.websocket;

import java.util.Arrays;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {
    private final AlertSocketHandler handler;
    private final String[] origins;

    public WebSocketConfig(AlertSocketHandler handler, @Value("${app.allowed-origins}") String origins) {
        this.handler = handler;
        this.origins = Arrays.stream(origins.split(",")).map(String::trim).toArray(String[]::new);
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(handler, "/ws/alerts").setAllowedOrigins(origins);
    }
}