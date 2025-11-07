package com.glancy.backend.service.word;


public interface WordRetrievalStrategy<R> {
    R execute(WordQueryContext context);
}
