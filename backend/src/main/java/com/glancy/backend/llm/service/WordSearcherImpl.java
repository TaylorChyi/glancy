package com.glancy.backend.llm.service;

import com.glancy.backend.entity.Language;
import com.glancy.backend.llm.config.LLMConfig;
import com.glancy.backend.llm.llm.LLMClient;
import com.glancy.backend.llm.model.ChatMessage;
import com.glancy.backend.llm.prompt.PromptManager;
import com.glancy.backend.llm.search.SearchContentManager;
import java.util.ArrayList;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

@Slf4j
@Service
public class WordSearcherImpl implements WordSearcher {

  private final LLMClientResolver clientResolver;
  private final LLMConfig config;
  private final PromptManager promptManager;
  private final SearchContentManager searchContentManager;

  public WordSearcherImpl(
      LLMClientResolver clientResolver,
      LLMConfig config,
      PromptManager promptManager,
      SearchContentManager searchContentManager) {
    this.clientResolver = clientResolver;
    this.config = config;
    this.promptManager = promptManager;
    this.searchContentManager = searchContentManager;
  }

  /** 面向实时场景的搜索接口，直接返回模型的流式输出。 */
  @Override
  public Flux<String> streamSearch(String term, Language language, String clientName) {
    log.info("WordSearcher streaming for '{}' using client '{}'", term, clientName);
    String cleanInput = searchContentManager.normalize(term);
    log.info("Normalized input term='{}'", cleanInput);

    String prompt = promptManager.loadPrompt(config.getPromptPath());
    log.info(
        "Loaded prompt from path='{}', length='{}'",
        config.getPromptPath(),
        prompt != null ? prompt.length() : 0);

    LLMClientResolver.Selection selection = clientResolver.resolve(clientName);
    LLMClient client = selection.client();
    String name = selection.name();
    log.info("Using LLM client '{}'", name);

    List<ChatMessage> messages = new ArrayList<>();
    messages.add(new ChatMessage("system", prompt));
    messages.add(new ChatMessage("user", cleanInput));
    log.info(
        "Prepared '{}' request messages: roles='{}'",
        messages.size(),
        messages.stream().map(ChatMessage::getRole).toList());

    log.info("Sending streaming request to LLM client '{}' for term='{}'", name, term);
    return client.streamChat(messages, config.getTemperature());
  }
}
