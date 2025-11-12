package com.glancy.backend.llm.completion;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class CompletionSentinelTest {

  @Test
  void GivenMarkerPresent_WhenInspect_ThenReturnSanitizedContent() {
    CompletionSentinel.CompletionCheck check = CompletionSentinel.inspect("hello <END>   ");
    assertTrue(check.satisfied());
    assertEquals("hello", check.sanitizedContent());
  }

  @Test
  void GivenMarkerMissing_WhenInspect_ThenReturnOriginalContent() {
    CompletionSentinel.CompletionCheck check = CompletionSentinel.inspect("hello world");
    assertFalse(check.satisfied());
    assertEquals("hello world", check.sanitizedContent());

    CompletionSentinel.CompletionCheck nullCheck = CompletionSentinel.inspect(null);
    assertFalse(nullCheck.satisfied());
    assertEquals(null, nullCheck.sanitizedContent());
  }
}
