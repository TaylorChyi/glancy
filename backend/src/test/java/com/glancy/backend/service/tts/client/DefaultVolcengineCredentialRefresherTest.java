package com.glancy.backend.service.tts.client;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;

/**
 * Tests for {@link DefaultVolcengineCredentialRefresher}.
 */
class DefaultVolcengineCredentialRefresherTest {

    /**
     * refresh() should be safe to call and not throw even without STS integration.
     */
    @Test
    void refreshIsNoOp() {
        DefaultVolcengineCredentialRefresher refresher =
            new DefaultVolcengineCredentialRefresher(new VolcengineTtsProperties());
        assertDoesNotThrow(refresher::refresh);
    }

    /**
     * The refresher must be registered as a bean for injection into clients.
     */
    @Test
    void beanRegistration() {
        AnnotationConfigApplicationContext ctx = new AnnotationConfigApplicationContext();
        ctx.register(DefaultVolcengineCredentialRefresher.class, VolcengineTtsProperties.class);
        ctx.refresh();
        VolcengineCredentialRefresher bean = ctx.getBean(VolcengineCredentialRefresher.class);
        assertThat(bean).isInstanceOf(DefaultVolcengineCredentialRefresher.class);
        ctx.close();
    }
}
