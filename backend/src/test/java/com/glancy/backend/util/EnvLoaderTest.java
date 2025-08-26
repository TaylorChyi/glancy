package com.glancy.backend.util;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;

class EnvLoaderTest {

  @Test
  void loadRemovesSurroundingQuotes() throws Exception {
    Path file = Files.createTempFile("env", ".tmp");
    Files.writeString(file, "TEST_KEY=\"secret\"");
    assertNull(System.getProperty("TEST_KEY"));
    EnvLoader.load(file);
    assertEquals("secret", System.getProperty("TEST_KEY"));
    Files.deleteIfExists(file);
  }
}
