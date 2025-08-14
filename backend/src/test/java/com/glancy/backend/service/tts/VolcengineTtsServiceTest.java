package com.glancy.backend.service.tts;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.glancy.backend.dto.TtsRequest;
import com.glancy.backend.entity.User;
import com.glancy.backend.exception.InvalidRequestException;
import com.glancy.backend.service.UserService;
import com.glancy.backend.service.tts.client.VolcengineTtsClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

/**
 * Tests for {@link VolcengineTtsService}. Focuses on guarding against
 * missing voice configuration which would otherwise surface as downstream
 * errors.
 */
class VolcengineTtsServiceTest {

    @Mock
    private VolcengineTtsClient client;

    @Mock
    private TtsRequestValidator validator;

    @Mock
    private UserService userService;

    private VolcengineTtsService service;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        service = new VolcengineTtsService(client, validator, userService);
    }

    /**
     * synthesizeWord should fail fast with {@link InvalidRequestException}
     * when the validator cannot resolve a voice id, ensuring the client is
     * never invoked with incomplete parameters.
     */
    @Test
    void synthesizeWordRejectsMissingVoiceType() {
        User user = new User();
        when(userService.getUserRaw(1L)).thenReturn(user);
        TtsRequest req = new TtsRequest();
        req.setText("hi");
        req.setLang("en-US");
        when(validator.resolveVoice(user, req)).thenReturn(null);

        assertThrows(InvalidRequestException.class, () -> service.synthesizeWord(1L, "127.0.0.1", req));
        verify(client, never()).synthesize(any());
    }
}

