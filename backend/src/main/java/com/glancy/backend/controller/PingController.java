package com.glancy.backend.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Simple endpoint used by monitoring tools to verify the service is running.
 */
@RestController
@RequestMapping("/api")
@Slf4j
public class PingController {

    /**
     * Respond with "pong" when the service is healthy.
     */
    @GetMapping("/ping")
    public ResponseEntity<String> ping() {
        return ResponseEntity.ok("pong");
    }
}
