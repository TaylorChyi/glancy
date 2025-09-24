package com.glancy.backend.service.gomemo;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import com.glancy.backend.config.GomemoProperties;
import com.glancy.backend.dto.GomemoProgressSnapshotView;
import com.glancy.backend.entity.GomemoProgress;
import com.glancy.backend.entity.Language;
import com.glancy.backend.gomemo.model.GomemoStudyModeType;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class GomemoProgressCalculatorTest {

    private GomemoProgressCalculator calculator;

    @BeforeEach
    void setUp() {
        GomemoProperties properties = new GomemoProperties();
        properties.setCompletionRetentionThreshold(75);
        calculator = new GomemoProgressCalculator(properties);
    }

    /**
     * 验证汇总逻辑会按词汇聚合尝试次数并据平均得分判断完成数量。
     */
    @Test
    void shouldAggregateProgressEntries() {
        GomemoProgress first = new GomemoProgress();
        first.setTerm("visionary");
        first.setLanguage(Language.ENGLISH);
        first.setMode(GomemoStudyModeType.CARD);
        first.setAttempts(2);
        first.setSuccesses(2);
        first.setRetentionScore(80.0);
        GomemoProgress second = new GomemoProgress();
        second.setTerm("visionary");
        second.setLanguage(Language.ENGLISH);
        second.setMode(GomemoStudyModeType.CARD);
        second.setAttempts(1);
        second.setSuccesses(1);
        second.setRetentionScore(70.0);
        GomemoProgress third = new GomemoProgress();
        third.setTerm("execute");
        third.setLanguage(Language.ENGLISH);
        third.setMode(GomemoStudyModeType.SPELLING);
        third.setAttempts(3);
        third.setSuccesses(1);
        third.setRetentionScore(60.0);

        GomemoProgressSnapshotView snapshot = calculator.summarize(List.of(first, second, third), 2);

        assertEquals(2, snapshot.totalWords());
        assertEquals(1, snapshot.completedWords());
        assertNotNull(snapshot.details());
        assertEquals(3, snapshot.details().get(0).attempts());
    }
}
