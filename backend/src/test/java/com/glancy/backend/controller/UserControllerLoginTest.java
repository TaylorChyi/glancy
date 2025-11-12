package com.glancy.backend.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.glancy.backend.dto.LoginRequest;
import com.glancy.backend.dto.LoginResponse;
import com.glancy.backend.entity.MembershipType;
import com.glancy.backend.entity.User;
import java.util.Collections;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;

@WebMvcTest(UserController.class)
@Import(
    {
        com.glancy.backend.config.security.SecurityConfig.class,
        com.glancy.backend.config.WebConfig.class,
        com.glancy.backend.config.auth.AuthenticatedUserArgumentResolver.class,
    }
)
class UserControllerLoginTest extends BaseUserControllerWebMvcTest {

    @Test
    void login() throws Exception {
        LoginResponse resp = new LoginResponse(1L, "u", "e", null, null, false, MembershipType.NONE, null, "tkn");
        when(userService.login(any(LoginRequest.class))).thenReturn(resp);

        LoginRequest req = new LoginRequest();
        req.setAccount("u");
        req.setPassword("pass");

        mockMvc
            .perform(
                MockMvcRequestBuilders.post("/api/users/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(req))
            )
            .andExpect(MockMvcResultMatchers.status().isOk())
            .andExpect(MockMvcResultMatchers.jsonPath("$.id").value(1L));
    }

    @Test
    void loginWithPhone() throws Exception {
        LoginResponse resp = new LoginResponse(1L, "u", "e", null, "555", false, MembershipType.NONE, null, "tkn");
        when(userService.login(any(LoginRequest.class))).thenReturn(resp);

        LoginRequest req = new LoginRequest();
        req.setAccount("555");
        req.setPassword("pass");

        mockMvc
            .perform(
                MockMvcRequestBuilders.post("/api/users/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(req))
            )
            .andExpect(MockMvcResultMatchers.status().isOk())
            .andExpect(MockMvcResultMatchers.jsonPath("$.id").value(1L));
    }

    @Test
    void logout() throws Exception {
        User authenticated = new User();
        authenticated.setId(1L);
        authenticated.setLoginToken("tkn");
        when(userService.getUserRaw(1L)).thenReturn(authenticated);
        doNothing().when(userService).logout(1L, "tkn");

        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken(1L, "tkn", Collections.emptyList())
        );

        try {
            mockMvc
                .perform(MockMvcRequestBuilders.post("/api/users/1/logout"))
                .andExpect(MockMvcResultMatchers.status().isNoContent());
        } finally {
            SecurityContextHolder.clearContext();
        }

        verify(userService).logout(1L, "tkn");
    }
}
