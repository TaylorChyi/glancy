package com.glancy.backend.service.personalization;

import java.util.List;
import java.util.Locale;
import java.util.Optional;
import org.springframework.util.StringUtils;

final class PersonaClassifierRegistry {

  private PersonaClassifierRegistry() {}

  static List<PersonaClassifier> build(int sprintTarget, int progressiveTarget) {
    return List.of(
        new DailyTargetPersonaClassifier(sprintTarget, progressiveTarget),
        new JobPersonaClassifier(),
        new GoalPersonaClassifier());
  }

  private static final class DailyTargetPersonaClassifier implements PersonaClassifier {

    private final int sprintThreshold;
    private final int progressiveThreshold;

    DailyTargetPersonaClassifier(int sprintThreshold, int progressiveThreshold) {
      this.sprintThreshold = sprintThreshold;
      this.progressiveThreshold = progressiveThreshold;
    }

    @Override
    public Optional<PersonaProfile> classify(PersonaInput input) {
      Integer target = input.dailyWordTarget();
      if (target == null || target <= 0) {
        return Optional.empty();
      }
      if (target >= sprintThreshold) {
        return Optional.of(new PersonaProfile("高频冲刺的进阶学习者", "同样在冲刺高强度词汇目标的伙伴", "节奏明快", true));
      }
      if (target >= progressiveThreshold) {
        return Optional.of(new PersonaProfile("稳步进阶的自律学习者", "坚持每日积累的同伴", "条理清晰", true));
      }
      return Optional.of(new PersonaProfile("节奏分明的词汇积累者", "循序渐进的学习伙伴", "温和坚定", true));
    }
  }

  private static final class JobPersonaClassifier implements PersonaClassifier {

    private static final List<JobPersonaRule> JOB_RULES =
        List.of(
            new JobPersonaRule(
                List.of("学生", "student"), new PersonaProfile("专注进阶的校园学习者", "同班同学", "亲切易懂", true)),
            new JobPersonaRule(
                List.of("老师", "教师", "teacher"),
                new PersonaProfile("经验分享型的教育者", "课堂上的学员", "严谨清晰", true)),
            new JobPersonaRule(
                List.of("工程", "engineer", "开发"),
                new PersonaProfile("注重逻辑的工程实践者", "协作的技术同事", "结构化且高效", true)),
            new JobPersonaRule(
                List.of("设计", "design"), new PersonaProfile("敏锐的设计探索者", "创意共创的伙伴", "细腻而感性", true)));

    @Override
    public Optional<PersonaProfile> classify(PersonaInput input) {
      String job = input.job();
      if (!StringUtils.hasText(job)) {
        return Optional.empty();
      }
      String normalized = job.toLowerCase(Locale.ROOT);
      return JOB_RULES.stream()
          .filter(rule -> rule.matches(normalized))
          .findFirst()
          .map(JobPersonaRule::profile)
          .or(() -> Optional.of(buildDomainPersona(job)));
    }

    private PersonaProfile buildDomainPersona(String job) {
      String descriptor = job + "领域的持续学习者";
      String audience = "同行的" + job + "伙伴";
      return new PersonaProfile(descriptor, audience, "专业稳重", true);
    }

    private record JobPersonaRule(List<String> keywords, PersonaProfile profile) {
      boolean matches(String normalizedJob) {
        return keywords.stream().anyMatch(normalizedJob::contains);
      }
    }
  }

  private static final class GoalPersonaClassifier implements PersonaClassifier {

    @Override
    public Optional<PersonaProfile> classify(PersonaInput input) {
      String goal = StringUtils.hasText(input.goal()) ? input.goal() : input.futurePlan();
      if (!StringUtils.hasText(goal)) {
        return Optional.empty();
      }
      String trimmed = goal.trim();
      return Optional.of(
          new PersonaProfile("以" + trimmed + "为目标的进阶者", "同样专注" + trimmed + "的伙伴", "鼓舞人心", true));
    }
  }
}
