package com.glancy.backend.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;

import com.glancy.backend.dto.EmailChangeInitiationRequest;
import com.glancy.backend.dto.EmailChangeRequest;
import com.glancy.backend.dto.ThirdPartyAccountRequest;
import com.glancy.backend.dto.ThirdPartyAccountResponse;
import com.glancy.backend.dto.UserContactRequest;
import com.glancy.backend.dto.UserContactResponse;
import com.glancy.backend.dto.UserDetailResponse;
import com.glancy.backend.dto.UserEmailResponse;
import com.glancy.backend.dto.UserRegistrationRequest;
import com.glancy.backend.dto.UserResponse;
import com.glancy.backend.entity.MembershipType;
import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
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
class UserControllerRegistrationTest extends BaseUserControllerWebMvcTest {

    @Test
    void register() throws Exception {
        UserResponse resp = new UserResponse(
            1L,
            "testuser",
            "test@example.com",
            null,
            "555",
            false,
            MembershipType.NONE,
            null
        );
        when(userService.register(any(UserRegistrationRequest.class))).thenReturn(resp);

        UserRegistrationRequest req = new UserRegistrationRequest();
        req.setUsername("testuser");
        req.setPassword("pass123");
        req.setEmail("test@example.com");
        req.setPhone("555");

        mockMvc
            .perform(
                MockMvcRequestBuilders.post("/api/users/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(req))
            )
            .andExpect(MockMvcResultMatchers.status().isCreated())
            .andExpect(MockMvcResultMatchers.jsonPath("$.id").value(1L));
    }

    @Test
    void getUser() throws Exception {
        UserDetailResponse detailResponse = UserDetailResponse.of(
            1L,
            "u",
            "e",
            "avatar-url",
            "p1",
            false,
            MembershipType.NONE,
            null,
            false,
            LocalDateTime.of(2024, 1, 1, 8, 0),
            LocalDateTime.of(2024, 1, 2, 9, 0),
            null
        );
        when(userService.getUserDetail(1L)).thenReturn(detailResponse);

        mockMvc
            .perform(MockMvcRequestBuilders.get("/api/users/1"))
            .andExpect(MockMvcResultMatchers.status().isOk())
            .andExpect(MockMvcResultMatchers.jsonPath("$.id").value(1L))
            .andExpect(MockMvcResultMatchers.jsonPath("$.username").value("u"))
            .andExpect(MockMvcResultMatchers.jsonPath("$.email").value("e"))
            .andExpect(MockMvcResultMatchers.jsonPath("$.password").doesNotExist());
    }

    @Test
    void bindThirdParty() throws Exception {
        ThirdPartyAccountResponse resp = new ThirdPartyAccountResponse(1L, "p", "e", 1L);
        when(userService.bindThirdPartyAccount(eq(1L), any(ThirdPartyAccountRequest.class))).thenReturn(resp);

        ThirdPartyAccountRequest req = new ThirdPartyAccountRequest();
        req.setProvider("p");
        req.setExternalId("e");

        mockMvc
            .perform(
                MockMvcRequestBuilders.post("/api/users/1/third-party-accounts")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(req))
            )
            .andExpect(MockMvcResultMatchers.status().isCreated())
            .andExpect(MockMvcResultMatchers.jsonPath("$.id").value(1L));
    }

    @Test
    void updateContact() throws Exception {
        UserContactResponse resp = new UserContactResponse("changed@example.com", "7654321");
        when(userService.updateContact(eq(1L), eq("changed@example.com"), eq("7654321"))).thenReturn(resp);

        UserContactRequest req = new UserContactRequest("changed@example.com", "7654321");

        mockMvc
            .perform(
                MockMvcRequestBuilders.put("/api/users/1/contact")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(req))
            )
            .andExpect(MockMvcResultMatchers.status().isOk())
            .andExpect(MockMvcResultMatchers.jsonPath("$.email").value("changed@example.com"))
            .andExpect(MockMvcResultMatchers.jsonPath("$.phone").value("7654321"));
    }

    @Test
    void requestEmailChangeCode() throws Exception {
        doNothing().when(userService).requestEmailChangeCode(1L, "next@example.com", "127.0.0.1");
        EmailChangeInitiationRequest req = new EmailChangeInitiationRequest("next@example.com");

        mockMvc
            .perform(
                MockMvcRequestBuilders.post("/api/users/1/email/change-code")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(req))
            )
            .andExpect(MockMvcResultMatchers.status().isAccepted());
    }

    @Test
    void changeEmail() throws Exception {
        when(userService.changeEmail(1L, "next@example.com", "123456")).thenReturn(
            new UserEmailResponse("next@example.com")
        );

        EmailChangeRequest req = new EmailChangeRequest("next@example.com", "123456");

        mockMvc
            .perform(
                MockMvcRequestBuilders.put("/api/users/1/email")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(req))
            )
            .andExpect(MockMvcResultMatchers.status().isOk())
            .andExpect(MockMvcResultMatchers.jsonPath("$.email").value("next@example.com"));
    }

    @Test
    void unbindEmail() throws Exception {
        when(userService.unbindEmail(1L)).thenReturn(new UserEmailResponse(null));

        mockMvc
            .perform(MockMvcRequestBuilders.delete("/api/users/1/email"))
            .andExpect(MockMvcResultMatchers.status().isOk())
            .andExpect(MockMvcResultMatchers.jsonPath("$.email").value(org.hamcrest.Matchers.nullValue()));
    }
}
