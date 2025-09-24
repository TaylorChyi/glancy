package com.glancy.backend.service.gomemo;

import com.glancy.backend.config.GomemoProperties;
import com.glancy.backend.dto.GomemoProgressDetailView;
import com.glancy.backend.dto.GomemoProgressSnapshotView;
import com.glancy.backend.entity.GomemoProgress;
import java.util.Comparator;
import java.util.DoubleSummaryStatistics;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

/**
 * Aggregates Gomemo progress entries into a client friendly snapshot.
 */
@Component
public class GomemoProgressCalculator {

    private final GomemoProperties properties;

    public GomemoProgressCalculator(GomemoProperties properties) {
        this.properties = properties;
    }

    public GomemoProgressSnapshotView summarize(List<GomemoProgress> entries, int totalWords) {
        if (entries == null || entries.isEmpty()) {
            return new GomemoProgressSnapshotView(0, totalWords, 0, List.of());
        }
        Map<String, List<GomemoProgress>> byTerm = entries.stream().collect(Collectors.groupingBy(this::termKey));
        List<GomemoProgressDetailView> details = byTerm
            .entrySet()
            .stream()
            .map(entry -> buildDetail(entry.getKey(), entry.getValue()))
            .sorted(Comparator.comparingDouble(GomemoProgressDetailView::retentionScore).reversed())
            .toList();
        double retentionAverage = details
            .stream()
            .mapToDouble(GomemoProgressDetailView::retentionScore)
            .average()
            .orElse(0);
        long completed = details
            .stream()
            .filter(detail -> detail.retentionScore() >= properties.getCompletionRetentionThreshold())
            .count();
        return new GomemoProgressSnapshotView((int) completed, totalWords, retentionAverage, details);
    }

    private String termKey(GomemoProgress progress) {
        return progress.getLanguage().name() + ":" + progress.getTerm().toLowerCase(Locale.ROOT);
    }

    private GomemoProgressDetailView buildDetail(String key, List<GomemoProgress> progresses) {
        DoubleSummaryStatistics retentionStats = progresses
            .stream()
            .mapToDouble(GomemoProgress::getRetentionScore)
            .summaryStatistics();
        int attempts = progresses.stream().mapToInt(GomemoProgress::getAttempts).sum();
        double retention = retentionStats.getCount() == 0 ? 0 : retentionStats.getAverage();
        GomemoProgress sample = progresses.get(progresses.size() - 1);
        return new GomemoProgressDetailView(sample.getTerm(), sample.getMode(), attempts, retention);
    }
}
