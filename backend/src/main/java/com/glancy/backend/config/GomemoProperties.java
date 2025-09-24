package com.glancy.backend.config;

import com.glancy.backend.gomemo.model.GomemoStudyModeType;
import java.util.EnumMap;
import java.util.Map;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuration envelope for Gomemo orchestration. Values are supplied via
 * {@code application.yml} allowing operators to fine tune prioritisation and
 * review behaviour without code changes.
 */
@ConfigurationProperties(prefix = "gomemo")
public class GomemoProperties {

    private int defaultDailyTarget = 12;
    private int searchHistoryWindow = 60;
    private int planOversamplingFactor = 3;
    private int completionRetentionThreshold = 70;
    private Scoring scoring = new Scoring();
    private Review review = new Review();
    private Map<GomemoStudyModeType, Mode> modeCatalog = new EnumMap<>(GomemoStudyModeType.class);

    public int getDefaultDailyTarget() {
        return defaultDailyTarget;
    }

    public void setDefaultDailyTarget(int defaultDailyTarget) {
        this.defaultDailyTarget = defaultDailyTarget;
    }

    public int getSearchHistoryWindow() {
        return searchHistoryWindow;
    }

    public void setSearchHistoryWindow(int searchHistoryWindow) {
        this.searchHistoryWindow = searchHistoryWindow;
    }

    public int getPlanOversamplingFactor() {
        return planOversamplingFactor;
    }

    public void setPlanOversamplingFactor(int planOversamplingFactor) {
        this.planOversamplingFactor = planOversamplingFactor;
    }

    public Scoring getScoring() {
        return scoring;
    }

    public void setScoring(Scoring scoring) {
        this.scoring = scoring;
    }

    public Review getReview() {
        return review;
    }

    public void setReview(Review review) {
        this.review = review;
    }

    public Map<GomemoStudyModeType, Mode> getModeCatalog() {
        return modeCatalog;
    }

    public void setModeCatalog(Map<GomemoStudyModeType, Mode> modeCatalog) {
        this.modeCatalog = new EnumMap<>(modeCatalog);
    }

    public int getCompletionRetentionThreshold() {
        return completionRetentionThreshold;
    }

    public void setCompletionRetentionThreshold(int completionRetentionThreshold) {
        this.completionRetentionThreshold = completionRetentionThreshold;
    }

    /** Resolve configuration for a study mode, returning {@code null} when absent. */
    public Mode resolveMode(GomemoStudyModeType type) {
        return modeCatalog.get(type);
    }

    /** Weight parameters applied when scoring candidate words. */
    public static class Scoring {

        private int baseScore = 1;
        private int recencyWeight = 6;
        private int favoriteBonus = 10;
        private int interestWeight = 5;
        private int goalWeight = 4;
        private int futurePlanWeight = 4;
        private int frequencyWeight = 3;
        private int ageLengthPenalty = 2;

        public int getBaseScore() {
            return baseScore;
        }

        public void setBaseScore(int baseScore) {
            this.baseScore = baseScore;
        }

        public int getRecencyWeight() {
            return recencyWeight;
        }

        public void setRecencyWeight(int recencyWeight) {
            this.recencyWeight = recencyWeight;
        }

        public int getFavoriteBonus() {
            return favoriteBonus;
        }

        public void setFavoriteBonus(int favoriteBonus) {
            this.favoriteBonus = favoriteBonus;
        }

        public int getInterestWeight() {
            return interestWeight;
        }

        public void setInterestWeight(int interestWeight) {
            this.interestWeight = interestWeight;
        }

        public int getGoalWeight() {
            return goalWeight;
        }

        public void setGoalWeight(int goalWeight) {
            this.goalWeight = goalWeight;
        }

        public int getFuturePlanWeight() {
            return futurePlanWeight;
        }

        public void setFuturePlanWeight(int futurePlanWeight) {
            this.futurePlanWeight = futurePlanWeight;
        }

        public int getFrequencyWeight() {
            return frequencyWeight;
        }

        public void setFrequencyWeight(int frequencyWeight) {
            this.frequencyWeight = frequencyWeight;
        }

        public int getAgeLengthPenalty() {
            return ageLengthPenalty;
        }

        public void setAgeLengthPenalty(int ageLengthPenalty) {
            this.ageLengthPenalty = ageLengthPenalty;
        }
    }

    /** LLM review configuration. */
    public static class Review {

        private String promptPath = "prompts/gomemo_review.txt";
        private double temperature = 0.6;
        private String client = "doubao";

        public String getPromptPath() {
            return promptPath;
        }

        public void setPromptPath(String promptPath) {
            this.promptPath = promptPath;
        }

        public double getTemperature() {
            return temperature;
        }

        public void setTemperature(double temperature) {
            this.temperature = temperature;
        }

        public String getClient() {
            return client;
        }

        public void setClient(String client) {
            this.client = client;
        }
    }

    /** Descriptor for a study mode exposed to the client. */
    public static class Mode {

        private String title;
        private String description;
        private String focus;

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public String getFocus() {
            return focus;
        }

        public void setFocus(String focus) {
            this.focus = focus;
        }
    }
}
