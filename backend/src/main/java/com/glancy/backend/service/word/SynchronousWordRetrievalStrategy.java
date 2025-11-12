package com.glancy.backend.service.word;

import com.glancy.backend.dto.SearchRecordResponse;
import com.glancy.backend.dto.WordResponse;
import com.glancy.backend.llm.service.WordSearcher;
import com.glancy.backend.service.support.ResponseMarkdownOrSerializedWordStrategy;
import com.glancy.backend.service.support.WordPersistenceCoordinator;
import com.glancy.backend.service.support.WordPersistenceCoordinator.PersistenceOutcome;
import com.glancy.backend.service.support.WordVersionContentStrategy;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class SynchronousWordRetrievalStrategy implements WordRetrievalStrategy<WordResponse> {

    private final WordSearcher wordSearcher;
    private final WordCacheManager cacheManager;
    private final SearchRecordCoordinator searchRecordCoordinator;
    private final WordPersistenceContextFactory contextFactory;
    private final WordPersistenceCoordinator coordinator;
    private final WordPersonalizationApplier personalizationApplier;

    private final WordVersionContentStrategy defaultContentStrategy = new ResponseMarkdownOrSerializedWordStrategy();

    @Override
    public WordResponse execute(WordQueryContext context) {
        SearchRecordResponse record = searchRecordCoordinator.createRecord(context);
        Optional<WordResponse> cached = tryLoadFromCache(context, record);
        if (cached.isPresent()) {
            return cached.get();
        }
        return fetchAndPersist(context, record);
    }

    private Optional<WordResponse> tryLoadFromCache(WordQueryContext context, SearchRecordResponse record) {
        if (context.forceNew()) {
            return Optional.empty();
        }
        return cacheManager
            .findCachedWord(context.normalizedTerm(), context.language(), context.flavor())
            .map(word -> {
                log.info("Found word '{}' in local repository", word.getTerm());
                WordResponse response = cacheManager.toResponse(word);
                response.setFlavor(context.flavor());
                searchRecordCoordinator.synchronizeRecordTermQuietly(context.userId(), idOf(record), word.getTerm());
                return personalizationApplier.apply(context.userId(), response, context.personalizationContext());
            });
    }

    private WordResponse fetchAndPersist(WordQueryContext context, SearchRecordResponse record) {
        log.info(
            "Word '{}' (normalized '{}') not found locally or forceNew requested, searching via LLM model {}",
            context.rawTerm(),
            context.normalizedTerm(),
            context.model()
        );
        WordResponse response = requestWordFromModel(context);
        PersistenceOutcome outcome = persistResponse(context, record, response);
        return outcome.response();
    }

    private WordResponse requestWordFromModel(WordQueryContext context) {
        WordResponse response = wordSearcher.search(
            context.rawTerm(),
            context.language(),
            context.flavor(),
            context.model(),
            context.personalizationContext()
        );
        response.setFlavor(context.flavor());
        return response;
    }

    private PersistenceOutcome persistResponse(
        WordQueryContext context,
        SearchRecordResponse record,
        WordResponse response
    ) {
        return contextFactory.persist(
            coordinator,
            new WordPersistenceContextFactory.WordPersistenceRequest(
                context.userId(),
                context.rawTerm(),
                context.language(),
                context.flavor(),
                context.model(),
                idOf(record),
                context.captureHistory(),
                response,
                context.personalizationContext(),
                null
            ),
            defaultContentStrategy
        );
    }

    private Long idOf(SearchRecordResponse record) {
        return record != null ? record.id() : null;
    }
}
