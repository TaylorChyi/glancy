package com.glancy.backend.util;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.stream.Stream;
import lombok.extern.slf4j.Slf4j;

/**
 * Utility to load key-value pairs from a .env file without failing when keys
 * appear multiple times. Later entries override previous ones.
 */
@Slf4j
public final class EnvLoader {

    private EnvLoader() {}

    /**
     * Loads environment variables from the given path if it exists.
     * Duplicate keys are resolved by keeping the last value.
     *
     * @param file path to the .env file
     */
    public static void load(Path file) {
        if (!Files.exists(file)) {
            log.debug("No .env file found at {}", file.toAbsolutePath());
            return;
        }
        try (Stream<String> lines = Files.lines(file)) {
            lines
                .map(String::trim)
                .filter(line -> !line.isEmpty() && !line.startsWith("#"))
                .forEach(line -> {
                    int idx = line.indexOf('=');
                    if (idx > 0) {
                        String key = line.substring(0, idx).trim();
                        if (System.getProperty(key) == null && System.getenv(key) == null) {
                            String value = line.substring(idx + 1).trim();
                            if (
                                (value.startsWith("\"") && value.endsWith("\"")) ||
                                (value.startsWith("'") && value.endsWith("'"))
                            ) {
                                value = value.substring(1, value.length() - 1);
                            }
                            System.setProperty(key, value);
                        }
                    }
                });
        } catch (IOException ex) {
            log.warn("Failed to load {}", file, ex);
        }
    }
}
