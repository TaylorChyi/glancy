package com.glancy.backend.llm.prompt;

import java.net.URL;
import java.net.URLClassLoader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.jar.JarEntry;
import java.util.jar.JarOutputStream;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;
import org.springframework.util.StreamUtils;

class PromptManagerImplJarTest {

  @Test
  void loadPromptFromJar() throws Exception {
    ClassPathResource original = new ClassPathResource("prompts/english_to_chinese.txt");
    byte[] data = StreamUtils.copyToByteArray(original.getInputStream());

    Path jar = Files.createTempFile("prompt", ".jar");
    try (JarOutputStream jos = new JarOutputStream(Files.newOutputStream(jar))) {
      JarEntry entry = new JarEntry("prompts/english_to_chinese.txt");
      jos.putNextEntry(entry);
      jos.write(data);
      jos.closeEntry();
    }

    URLClassLoader loader = new URLClassLoader(new URL[] {jar.toUri().toURL()}, null);
    ClassLoader previous = Thread.currentThread().getContextClassLoader();
    Thread.currentThread().setContextClassLoader(loader);
    try {
      PromptManagerImpl manager = new PromptManagerImpl();
      String prompt = manager.loadPrompt("prompts/english_to_chinese.txt");
      Assertions.assertEquals(new String(data, StandardCharsets.UTF_8), prompt);
    } finally {
      Thread.currentThread().setContextClassLoader(previous);
      loader.close();
    }
  }
}
