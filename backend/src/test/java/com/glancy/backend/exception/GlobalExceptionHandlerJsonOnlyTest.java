package com.glancy.backend.exception;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

class GlobalExceptionHandlerJsonOnlyTest {

  private MockMvc mvc;

  @BeforeEach
  void setUp() {
    GlobalExceptionHandler handler =
        new GlobalExceptionHandler(HttpStatusAwareErrorMessageResolver.defaultResolver());
    mvc =
        MockMvcBuilders.standaloneSetup(new DummyController())
            .setControllerAdvice(handler)
            .defaultRequest(get("/").accept(MediaType.APPLICATION_JSON))
            .build();
  }

  @RestController
  @RequestMapping("/dummy-json")
  static class DummyController {

    @GetMapping("/boom")
    String boom() {
      throw new ResourceNotFoundException("missing");
    }
  }

  /**
   * 测试目标：即便 Accept 为 text/event-stream 仍返回 JSON。 前置条件：请求触发 ResourceNotFoundException。 步骤：GET
   * /dummy-json/boom，Accept:text/event-stream。 断言：状态码 404，Content-Type 为 application/json。
   * 边界/异常：若返回 SSE，说明新逻辑未生效。
   */
  @Test
  void GivenEventStreamAccept_WhenHandleError_ThenRespondJson() throws Exception {
    mvc.perform(get("/dummy-json/boom").accept(MediaType.TEXT_EVENT_STREAM))
        .andExpect(status().isNotFound())
        .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON));
  }
}
