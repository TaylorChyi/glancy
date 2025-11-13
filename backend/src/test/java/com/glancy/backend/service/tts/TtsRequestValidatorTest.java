package com.glancy.backend.service.tts;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import com.glancy.backend.dto.TtsRequest;
import com.glancy.backend.entity.MembershipType;
import com.glancy.backend.entity.User;
import com.glancy.backend.exception.ForbiddenException;
import com.glancy.backend.exception.InvalidRequestException;
import com.glancy.backend.service.tts.config.TtsConfig;
import com.glancy.backend.service.tts.config.TtsConfigManager;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

/**
 * Tests for {@link TtsRequestValidator}. These verify that request parameters are checked against
 * configuration and user permissions.
 */
class TtsRequestValidatorTest {

    @Mock
    private TtsConfigManager configManager;

    private TtsRequestValidator validator;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        validator = new TtsRequestValidator(configManager);

        TtsConfig cfg = new TtsConfig();
        TtsConfig.VoiceGroup group = new TtsConfig.VoiceGroup();
        group.setDefaultVoice("basic");
        TtsConfig.VoiceOption basic = new TtsConfig.VoiceOption();
        basic.setId("basic");
        basic.setPlan("all");
        TtsConfig.VoiceOption pro = new TtsConfig.VoiceOption();
        pro.setId("pro");
        pro.setPlan("pro");
        group.setOptions(List.of(basic, pro));
        cfg.setVoices(Map.of("en-US", group));
        when(configManager.current()).thenReturn(cfg);
    }

    /** resolveVoice should throw when language is not configured. */
    @Test
    void rejectUnknownLanguage() {
        User user = new User();
        TtsRequest req = new TtsRequest();
        req.setText("hi");
        req.setLang("fr-FR");
        assertThrows(InvalidRequestException.class, () -> validator.resolveVoice(user, req));
    }

    /** resolveVoice should throw when specified voice is missing. */
    @Test
    void rejectUnknownVoice() {
        User user = new User();
        TtsRequest req = new TtsRequest();
        req.setText("hi");
        req.setLang("en-US");
        req.setVoice("x");
        assertThrows(InvalidRequestException.class, () -> validator.resolveVoice(user, req));
    }

    /** resolveVoice should enforce plan restrictions. */
    @Test
    void rejectProVoiceForFreeUser() {
        User user = new User();
        TtsRequest req = new TtsRequest();
        req.setText("hi");
        req.setLang("en-US");
        req.setVoice("pro");
        assertThrows(ForbiddenException.class, () -> validator.resolveVoice(user, req));
    }

    /** resolveVoice should allow pro voices for users with active pro membership. */
    @Test
    void allowProVoiceForEligibleMember() {
        User user = new User();
        LocalDateTime now = LocalDateTime.now();
        user.updateMembership(MembershipType.PRO, now.plusDays(1), now);
        TtsRequest req = new TtsRequest();
        req.setText("hi");
        req.setLang("en-US");
        req.setVoice("pro");
        String voice = validator.resolveVoice(user, req);
        assertEquals("pro", voice);
    }

    /** resolveVoice should return default voice when none provided and user has access. */
    @Test
    void resolveDefaultVoice() {
        User user = new User();
        TtsRequest req = new TtsRequest();
        req.setText("hi");
        req.setLang("en-US");
        String voice = validator.resolveVoice(user, req);
        assertEquals("basic", voice);
    }

    /**
     * resolveVoice should fall back to the first group matching the language prefix when an exact
     * locale match is absent.
     */
    @Test
    void resolveDefaultVoiceWithLanguagePrefix() {
        User user = new User();
        TtsRequest req = new TtsRequest();
        req.setText("hi");
        req.setLang("en");
        String voice = validator.resolveVoice(user, req);
        assertEquals("basic", voice);
    }

    /**
     * Using the classpath configuration, an English request without a voice specified should return
     * the group's configured default voice.
     */
    @Test
    void resolveEnglishDefaultVoiceFromConfig() {
        try (TtsConfigManager mgr = new TtsConfigManager("")) {
            TtsRequestValidator realValidator = new TtsRequestValidator(mgr);
            User user = new User();
            TtsRequest req = new TtsRequest();
            req.setText("hi");
            req.setLang("en-US");
            String voice = realValidator.resolveVoice(user, req);
            assertEquals("en_male_corey_emo_v2_mars_bigtts", voice);
        }
    }
}
