package com.glancy.backend.service.tts.config;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import java.io.Closeable;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.*;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicReference;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * Loads and watches the TTS configuration file. The latest valid snapshot is
 * kept in memory and swaps atomically on every successful reload. Any parsing or
 * validation errors result in retaining the previous snapshot to ensure
 * availability.
 */
@Slf4j
@Component
public class TtsConfigManager implements Closeable {

    private final String configPath;
    private final ObjectMapper mapper;
    private final AtomicReference<TtsConfig> snapshot = new AtomicReference<>(new TtsConfig());

    private WatchService watchService;
    private ExecutorService watchExecutor;

    public TtsConfigManager(@Value("${tts.config-path:}") String configPath) {
        this.configPath = configPath;
        this.mapper = new ObjectMapper(new YAMLFactory());
        this.mapper.findAndRegisterModules();
        this.mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        init();
    }

    /** Returns the currently active configuration snapshot. */
    public TtsConfig current() {
        return snapshot.get();
    }

    /** Reloads configuration from disk if a path is configured. */
    public synchronized void reload() {
        if (!StringUtils.hasText(configPath)) {
            return;
        }
        Path path = Path.of(configPath);
        loadFromFile(path);
    }

    private void init() {
        if (StringUtils.hasText(configPath)) {
            Path path = Path.of(configPath);
            loadFromFile(path);
            if (snapshot.get().getFeatures().isHotReload()) {
                startWatcher(path);
            }
        } else {
            loadFromClasspath();
        }
    }

    private void loadFromClasspath() {
        try (InputStream in = getClass().getClassLoader().getResourceAsStream("tts-config.yml")) {
            if (in == null) {
                log.warn("Default TTS config resource not found");
                return;
            }
            TtsConfig cfg = mapper.readValue(in, TtsConfig.class);
            validate(cfg);
            snapshot.set(cfg);
            log.info("Loaded TTS config from classpath");
        } catch (Exception ex) {
            log.error("Failed to load classpath TTS config", ex);
        }
    }

    private void loadFromFile(Path path) {
        try (InputStream in = Files.newInputStream(path)) {
            TtsConfig cfg = mapper.readValue(in, TtsConfig.class);
            validate(cfg);
            snapshot.set(cfg);
            log.info("Loaded TTS config from {}", path.toAbsolutePath());
        } catch (Exception ex) {
            log.warn("Failed to reload TTS config from {}", path.toAbsolutePath(), ex);
        }
    }

    private void validate(TtsConfig cfg) {
        cfg
            .getVoices()
            .forEach((lang, group) -> {
                boolean exists = group
                    .getOptions()
                    .stream()
                    .anyMatch(v -> v.getId().equals(group.getDefaultVoice()));
                if (!exists) {
                    throw new IllegalArgumentException("Default voice for " + lang + " not present in options");
                }
            });
    }

    private void startWatcher(Path path) {
        try {
            watchService = FileSystems.getDefault().newWatchService();
            Path dir = path.getParent();
            dir.register(watchService, StandardWatchEventKinds.ENTRY_MODIFY);
            watchExecutor = Executors.newSingleThreadExecutor(r -> {
                Thread t = new Thread(r, "tts-config-watcher");
                t.setDaemon(true);
                return t;
            });
            watchExecutor.submit(() -> watchLoop(dir, path));
            log.info("Watching {} for TTS config changes", path.toAbsolutePath());
        } catch (IOException | RuntimeException ex) {
            log.warn("Failed to watch TTS config file", ex);
        }
    }

    private void watchLoop(Path dir, Path path) {
        while (!Thread.currentThread().isInterrupted()) {
            try {
                WatchKey key = watchService.take();
                for (WatchEvent<?> event : key.pollEvents()) {
                    Path changed = dir.resolve((Path) event.context());
                    if (Files.isRegularFile(changed) && changed.getFileName().equals(path.getFileName())) {
                        log.info("Detected TTS config change");
                        reload();
                    }
                }
                key.reset();
            } catch (InterruptedException ex) {
                Thread.currentThread().interrupt();
                return;
            }
        }
    }

    @Override
    public void close() {
        if (watchExecutor != null) {
            watchExecutor.shutdownNow();
        }
        if (watchService != null) {
            try {
                watchService.close();
            } catch (IOException ignored) {}
        }
    }
}
