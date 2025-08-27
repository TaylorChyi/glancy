package com.glancy.backend.config;

import static org.assertj.core.api.Assertions.assertThat;

import com.glancy.backend.service.EchoService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringBootConfiguration;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;

/** Tests for {@link ServiceLoggingAspect}. */
@ExtendWith(OutputCaptureExtension.class)
@SpringBootTest(classes = ServiceLoggingAspectTest.TestConfig.class)
class ServiceLoggingAspectTest {

  @Autowired private EchoService echoService;

  @Test
  void logsMethodNameParametersAndReturnValue(CapturedOutput output) {
    String result = echoService.echo("alice");
    assertThat(result).isEqualTo("echo: alice");
    assertThat(output.getOut())
        .contains("EchoService.echo")
        .contains("args=[alice]")
        .contains("returned echo: alice")
        .contains("ms");
  }

  @SpringBootConfiguration
  @EnableAutoConfiguration
  @Import(ServiceLoggingAspect.class)
  static class TestConfig {
    @Bean
    EchoService echoService() {
      return new EchoService();
    }
  }
}
