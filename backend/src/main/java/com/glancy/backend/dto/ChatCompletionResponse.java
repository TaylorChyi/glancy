package com.glancy.backend.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class ChatCompletionResponse {

  private List<Choice> choices;

  @Data
  @JsonIgnoreProperties(ignoreUnknown = true)
  public static class Choice {

    private Message message;
  }

  @Data
  @JsonIgnoreProperties(ignoreUnknown = true)
  public static class Message {

    private String role;
    private String content;
  }
}
