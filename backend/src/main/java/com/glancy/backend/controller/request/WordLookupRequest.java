package com.glancy.backend.controller.request;

import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.Language;

/**
 * Captures query parameters for {@link com.glancy.backend.controller.WordController#getWord}.
 * Spring binds request parameters onto this bean, which keeps the controller signature small.
 */
public class WordLookupRequest {

    private String term;
    private Language language;
    private String flavor;
    private String model;
    private boolean forceNew;
    private boolean captureHistory = true;

    public String getTerm() {
        return term;
    }

    public void setTerm(String term) {
        this.term = term;
    }

    public Language getLanguage() {
        return language;
    }

    public void setLanguage(Language language) {
        this.language = language;
    }

    public String getFlavor() {
        return flavor;
    }

    public void setFlavor(String flavor) {
        this.flavor = flavor;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public boolean isForceNew() {
        return forceNew;
    }

    public void setForceNew(boolean forceNew) {
        this.forceNew = forceNew;
    }

    public boolean isCaptureHistory() {
        return captureHistory;
    }

    public void setCaptureHistory(boolean captureHistory) {
        this.captureHistory = captureHistory;
    }

    public DictionaryFlavor resolvedFlavor() {
        return DictionaryFlavor.fromNullable(flavor, DictionaryFlavor.BILINGUAL);
    }
}
