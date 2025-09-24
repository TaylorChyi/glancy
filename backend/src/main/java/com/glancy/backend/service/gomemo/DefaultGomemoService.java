package com.glancy.backend.service.gomemo;

import com.glancy.backend.config.GomemoProperties;
import com.glancy.backend.dto.GomemoPlanResponse;
import com.glancy.backend.dto.GomemoPersonaView;
import com.glancy.backend.dto.GomemoPriorityWordView;
import com.glancy.backend.dto.GomemoProgressRequest;
import com.glancy.backend.dto.GomemoProgressSnapshotView;
import com.glancy.backend.dto.GomemoReviewResponse;
import com.glancy.backend.dto.GomemoStudyModeView;
import com.glancy.backend.entity.GomemoProgress;
import com.glancy.backend.entity.GomemoSession;
import com.glancy.backend.entity.GomemoSessionWord;
import com.glancy.backend.entity.User;
import com.glancy.backend.exception.ResourceNotFoundException;
import com.glancy.backend.gomemo.model.GomemoPersona;
import com.glancy.backend.gomemo.model.GomemoPlanWord;
import com.glancy.backend.gomemo.model.GomemoStudyModeType;
import com.glancy.backend.repository.GomemoProgressRepository;
import com.glancy.backend.repository.GomemoSessionRepository;
import com.glancy.backend.repository.GomemoSessionWordRepository;
import com.glancy.backend.repository.UserRepository;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * Default implementation combining persona resolution, prioritisation and review pipelines.
 */
@Service
public class DefaultGomemoService implements GomemoService {

    private final GomemoSessionRepository sessionRepository;
    private final GomemoSessionWordRepository sessionWordRepository;
    private final GomemoProgressRepository progressRepository;
    private final UserRepository userRepository;
    private final GomemoPersonaResolver personaResolver;
    private final GomemoWordPrioritizer wordPrioritizer;
    private final GomemoProgressCalculator progressCalculator;
    private final GomemoReviewComposer reviewComposer;
    private final GomemoProperties properties;
    private final Clock clock;

    public DefaultGomemoService(
        GomemoSessionRepository sessionRepository,
        GomemoSessionWordRepository sessionWordRepository,
        GomemoProgressRepository progressRepository,
        UserRepository userRepository,
        GomemoPersonaResolver personaResolver,
        GomemoWordPrioritizer wordPrioritizer,
        GomemoProgressCalculator progressCalculator,
        GomemoReviewComposer reviewComposer,
        GomemoProperties properties,
        Clock clock
    ) {
        this.sessionRepository = sessionRepository;
        this.sessionWordRepository = sessionWordRepository;
        this.progressRepository = progressRepository;
        this.userRepository = userRepository;
        this.personaResolver = personaResolver;
        this.wordPrioritizer = wordPrioritizer;
        this.progressCalculator = progressCalculator;
        this.reviewComposer = reviewComposer;
        this.properties = properties;
        this.clock = clock;
    }

    @Override
    @Transactional
    public GomemoPlanResponse preparePlan(Long userId) {
        LocalDate today = LocalDate.now(clock);
        GomemoSession session = sessionRepository
            .findTopByUserIdAndSessionDateAndDeletedFalse(userId, today)
            .orElseGet(() -> createSession(userId, today));
        GomemoPersona persona = personaResolver.resolve(userId);
        List<GomemoPlanWord> planWords = loadOrBuildPlan(session, persona, userId);
        int totalWords = Math.min(session.getDailyTarget(), planWords.size());
        List<GomemoPlanWord> finalPlan = planWords.stream().limit(totalWords).toList();
        GomemoProgressSnapshotView snapshot = progressCalculator.summarize(
            progressRepository.findBySessionIdAndDeletedFalse(session.getId()),
            totalWords
        );
        return new GomemoPlanResponse(
            session.getId(),
            session.getSessionDate().toString(),
            toPersonaView(session, persona),
            buildHighlights(persona, finalPlan),
            finalPlan.stream().map(this::toWordView).toList(),
            resolveModes(),
            snapshot
        );
    }

    @Override
    @Transactional
    public GomemoProgressSnapshotView recordProgress(Long userId, Long sessionId, GomemoProgressRequest request) {
        GomemoSession session = validateSessionOwnership(userId, sessionId);
        GomemoProgress progress = new GomemoProgress();
        progress.setSession(session);
        progress.setTerm(request.term());
        progress.setLanguage(request.language());
        progress.setMode(request.mode());
        progress.setAttempts(request.attempts());
        progress.setSuccesses(request.successes());
        progress.setRetentionScore((double) request.retentionScore());
        progress.setNote(request.note());
        progressRepository.save(progress);
        List<GomemoProgress> entries = progressRepository.findBySessionIdAndDeletedFalse(sessionId);
        List<GomemoSessionWord> words = sessionWordRepository.findBySessionIdAndDeletedFalseOrderByPriorityScoreDesc(sessionId);
        return progressCalculator.summarize(entries, Math.min(words.size(), session.getDailyTarget()));
    }

    @Override
    @Transactional
    public GomemoReviewResponse finalizeSession(Long userId, Long sessionId) {
        GomemoSession session = validateSessionOwnership(userId, sessionId);
        List<GomemoProgress> entries = progressRepository.findBySessionIdAndDeletedFalse(sessionId);
        List<GomemoPlanWord> plan = wordPrioritizer.reloadFromSession(sessionId);
        GomemoProgressSnapshotView snapshot = progressCalculator.summarize(entries, Math.min(plan.size(), session.getDailyTarget()));
        GomemoPersona persona = personaResolver.resolve(userId);
        GomemoReviewComposer.ReviewResult result = reviewComposer.compose(persona, plan, snapshot, entries);
        session.setCompleted(Boolean.TRUE);
        session.setCompletedAt(LocalDateTime.now(clock));
        session.setReviewSummary(result.review());
        session.setNextFocus(result.nextFocus());
        sessionRepository.save(session);
        return new GomemoReviewResponse(result.review(), result.nextFocus(), snapshot);
    }

    private GomemoSession createSession(Long userId, LocalDate date) {
        User user = userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("用户不存在"));
        GomemoPersona persona = personaResolver.resolve(userId);
        GomemoSession session = new GomemoSession();
        session.setUser(user);
        session.setSessionDate(date);
        session.setDailyTarget(Optional.ofNullable(persona.dailyTarget()).orElse(properties.getDefaultDailyTarget()));
        session.setPersonaDescriptor(persona.descriptor());
        session.setPersonaAudience(persona.audience());
        session.setPersonaTone(persona.tone());
        session.setPersonaInterests(String.join(",", persona.interests()));
        session.setGoal(persona.goal());
        session.setFuturePlan(persona.futurePlan());
        return sessionRepository.save(session);
    }

    private GomemoSession validateSessionOwnership(Long userId, Long sessionId) {
        GomemoSession session = sessionRepository
            .findById(sessionId)
            .orElseThrow(() -> new ResourceNotFoundException("学习会话不存在"));
        if (!session.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("学习会话不存在");
        }
        return session;
    }

    private List<GomemoPlanWord> loadOrBuildPlan(GomemoSession session, GomemoPersona persona, Long userId) {
        List<GomemoPlanWord> existing = wordPrioritizer.reloadFromSession(session.getId());
        if (!existing.isEmpty()) {
            return existing;
        }
        List<GomemoPlanWord> generated = wordPrioritizer.prioritize(userId, persona, session.getDailyTarget());
        wordPrioritizer.persistWords(session, generated);
        return generated;
    }

    private GomemoPersonaView toPersonaView(GomemoSession session, GomemoPersona persona) {
        List<String> interests = persona.interests();
        if (interests.isEmpty() && StringUtils.hasText(session.getPersonaInterests())) {
            interests = List.of(session.getPersonaInterests().split(","));
        }
        return new GomemoPersonaView(
            session.getPersonaDescriptor(),
            session.getPersonaAudience(),
            session.getPersonaTone(),
            session.getDailyTarget(),
            session.getGoal(),
            session.getFuturePlan(),
            interests.stream().map(String::trim).filter(StringUtils::hasText).toList()
        );
    }

    private GomemoPriorityWordView toWordView(GomemoPlanWord planWord) {
        return new GomemoPriorityWordView(
            planWord.term(),
            planWord.language(),
            planWord.priorityScore(),
            planWord.rationales(),
            planWord.recommendedModes()
        );
    }

    private List<GomemoStudyModeView> resolveModes() {
        List<GomemoStudyModeView> modes = new ArrayList<>();
        for (GomemoStudyModeType type : GomemoStudyModeType.values()) {
            GomemoProperties.Mode cfg = properties.resolveMode(type);
            String title = cfg != null && StringUtils.hasText(cfg.getTitle()) ? cfg.getTitle() : defaultModeTitle(type);
            String description = cfg != null && StringUtils.hasText(cfg.getDescription())
                ? cfg.getDescription()
                : defaultModeDescription(type);
            String focus = cfg != null && StringUtils.hasText(cfg.getFocus()) ? cfg.getFocus() : defaultModeFocus(type);
            modes.add(new GomemoStudyModeView(type, title, description, focus));
        }
        return modes;
    }

    private List<String> buildHighlights(GomemoPersona persona, List<GomemoPlanWord> plan) {
        Set<String> highlights = new LinkedHashSet<>();
        highlights.add("今日节奏：" + persona.dailyTarget() + " 词");
        if (StringUtils.hasText(persona.goal())) {
            highlights.add("围绕目标推进：" + persona.goal());
        }
        if (StringUtils.hasText(persona.futurePlan())) {
            highlights.add("为未来预热：" + persona.futurePlan());
        }
        if (!persona.interests().isEmpty()) {
            highlights.add("兴趣线索：" + String.join("、", persona.interests()));
        }
        plan
            .stream()
            .flatMap(word -> word.rationales().stream())
            .limit(3)
            .forEach(highlights::add);
        return new ArrayList<>(highlights);
    }

    private String defaultModeTitle(GomemoStudyModeType type) {
        return switch (type) {
            case CARD -> "沉浸式卡片";
            case MULTIPLE_CHOICE -> "智适应选择题";
            case SPELLING -> "精准拼写";
            case VISUAL_ASSOCIATION -> "图像联想";
            case LISTENING -> "沉浸听力";
        };
    }

    private String defaultModeDescription(GomemoStudyModeType type) {
        return switch (type) {
            case CARD -> "高质感释义与例句同屏呈现，快速建立联想。";
            case MULTIPLE_CHOICE -> "根据掌握程度智能调整干扰项，强化辨析。";
            case SPELLING -> "逐步拆解音素与词形，矫正易错拼写。";
            case VISUAL_ASSOCIATION -> "结合兴趣场景挑选视觉锚点，深化记忆链路。";
            case LISTENING -> "调用录音室级发音并支持跟读校准口音。";
        };
    }

    private String defaultModeFocus(GomemoStudyModeType type) {
        return switch (type) {
            case CARD -> "先读释义再自测是否掌握";
            case MULTIPLE_CHOICE -> "关注易混词差异";
            case SPELLING -> "按音节拆分输入";
            case VISUAL_ASSOCIATION -> "挑选最贴近目标场景的图像";
            case LISTENING -> "反复跟读至语流顺滑";
        };
    }
}
