package com.glancy.backend.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.glancy.backend.service.UserService;
import com.glancy.backend.util.ClientIpResolver;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

abstract class BaseUserControllerWebMvcTest {

  @Autowired protected MockMvc mockMvc;

  @MockitoBean protected UserService userService;

  @MockitoBean protected ClientIpResolver clientIpResolver;

  @Autowired protected ObjectMapper objectMapper;

  @BeforeEach
  void baseSetUpClientIp() {
    when(clientIpResolver.resolve(any(HttpServletRequest.class))).thenReturn("127.0.0.1");
  }
}
