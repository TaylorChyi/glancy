package com.glancy.backend.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.glancy.backend.dto.NotificationRequest;
import com.glancy.backend.dto.NotificationResponse;
import com.glancy.backend.service.NotificationService;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(NotificationController.class)
@Import(
    {
        com.glancy.backend.config.security.SecurityConfig.class,
        com.glancy.backend.config.WebConfig.class,
        com.glancy.backend.config.auth.AuthenticatedUserArgumentResolver.class,
    }
)
class NotificationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private NotificationService notificationService;

    @MockBean
    private com.glancy.backend.service.UserService userService;

    @Autowired
    private ObjectMapper objectMapper;

    /**
     * 测试 createSystemNotification 接口
     */
    @Test
    void createSystemNotification() throws Exception {
        NotificationResponse resp = new NotificationResponse(1L, "msg", true, null);
        when(notificationService.createSystemNotification(any(NotificationRequest.class))).thenReturn(resp);

        NotificationRequest req = new NotificationRequest();
        req.setMessage("msg");

        mockMvc
            .perform(
                post("/api/notifications/system")
                    .with(httpBasic("admin", "password"))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(req))
            )
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.systemLevel").value(true));
    }

    /**
     * 测试 createUserNotification 接口
     */
    @Test
    void createUserNotification() throws Exception {
        NotificationResponse resp = new NotificationResponse(1L, "msg", false, 2L);
        when(notificationService.createUserNotification(eq(2L), any(NotificationRequest.class))).thenReturn(resp);

        NotificationRequest req = new NotificationRequest();
        req.setMessage("msg");

        when(userService.authenticateToken("tkn")).thenReturn(2L);

        mockMvc
            .perform(
                post("/api/notifications/user")
                    .header("X-USER-TOKEN", "tkn")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(req))
            )
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.userId").value(2L));
    }

    /**
     * 测试 getNotificationsForUser 接口
     */
    @Test
    void getNotificationsForUser() throws Exception {
        NotificationResponse uresp = new NotificationResponse(1L, "user", false, 2L);
        NotificationResponse sresp = new NotificationResponse(2L, "sys", true, null);
        when(notificationService.getNotificationsForUser(2L)).thenReturn(List.of(uresp, sresp));

        when(userService.authenticateToken("tkn")).thenReturn(2L);

        mockMvc
            .perform(get("/api/notifications/user").header("X-USER-TOKEN", "tkn"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].message").value("user"))
            .andExpect(jsonPath("$[1].message").value("sys"));
    }
}
