package com.glancy.backend.service.tts.client;

import java.util.concurrent.locks.ReentrantLock;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * Default implementation that defers actual STS integration.
 *
 * <p>The refresher is thread-safe and ensures only one refresh operation
 * executes at a time. When invoked it currently performs a no-op and logs the
 * event, preserving extension points for future credential exchange.
 */
@Slf4j
@Component
public class DefaultVolcengineCredentialRefresher implements VolcengineCredentialRefresher {

    private final VolcengineTtsProperties props;
    private final ReentrantLock lock = new ReentrantLock();

    public DefaultVolcengineCredentialRefresher(VolcengineTtsProperties props) {
        this.props = props;
    }

    @Override
    public void refresh() {
        if (!lock.tryLock()) {
            log.debug("Credential refresh already in progress; skipping");
            return;
        }
        try {
            log.info("Volcengine credential refresh invoked. No STS integration configured yet.");
            if (StringUtils.hasText(props.getAccessKeyId())) {
                log.debug("Current accessKeyId remains {}", props.getAccessKeyId());
            }
        } finally {
            lock.unlock();
        }
    }
}
