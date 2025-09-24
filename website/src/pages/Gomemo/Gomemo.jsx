import { useCallback, useEffect, useMemo, useState } from "react";
import Layout from "@/components/Layout";
import Button from "@/components/ui/Button";
import ThemeIcon from "@/components/ui/Icon";
import { useLanguage } from "@/context";
import { useApi } from "@/context/ApiContext.jsx";
import { useUserStore, useGomemoStore } from "@/store";
import styles from "./Gomemo.module.css";

const EmptyToolbar = () => null;

const GENERIC_DISTRACTORS = [
  "暂时与阶段目标不相关",
  "用于背景输入，无需重点",
  "本周已稳定掌握",
  "与当前项目关联度较低",
];

const LANGUAGE_TO_TTS = {
  ENGLISH: "en-US",
  CHINESE: "zh-CN",
};

const termKey = (word) => `${word.language}:${word.term}`;

function normalizeDetails(entry) {
  if (!entry) return null;
  const latest = entry.entry ?? entry;
  return {
    definitions: latest.definitions ?? [],
    example: latest.example ?? "",
    phonetic: latest.phonetic ?? "",
    synonyms: latest.synonyms ?? [],
    markdown: latest.markdown ?? "",
  };
}

function buildChoiceOptions(correct, distractors) {
  const pool = [...distractors];
  while (pool.length < 3) {
    pool.push(GENERIC_DISTRACTORS[pool.length % GENERIC_DISTRACTORS.length]);
  }
  const candidates = pool.slice(0, 3);
  const options = [correct, ...candidates];
  for (let i = options.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  return options;
}

function Gomemo() {
  const { t } = useLanguage();
  const api = useApi();
  const { currentUser } = useUserStore();
  const {
    plan,
    review,
    activeWordIndex,
    activeMode,
    loading,
    error,
    loadPlan,
    selectWord,
    selectMode,
    recordProgress,
    finalizeSession,
  } = useGomemoStore();

  const [wordDetails, setWordDetails] = useState({});
  const [revealCard, setRevealCard] = useState(false);
  const [spellInput, setSpellInput] = useState("");
  const [choiceFeedback, setChoiceFeedback] = useState("");
  const [visualChoice, setVisualChoice] = useState("");
  const [audioSrc, setAudioSrc] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [practiceMessage, setPracticeMessage] = useState("");

  const token = currentUser?.token ?? null;
  const userId = currentUser?.id ? String(currentUser.id) : undefined;

  useEffect(() => {
    if (!plan && !loading) {
      loadPlan({ token });
    }
  }, [plan, loading, loadPlan, token]);

  const activeWord = plan?.words?.[activeWordIndex] ?? null;
  const persona = plan?.persona;

  useEffect(() => {
    setRevealCard(false);
    setChoiceFeedback("");
    setSpellInput("");
    setVisualChoice("");
    setPracticeMessage("");
  }, [activeWord, activeMode]);

  useEffect(() => {
    if (!activeWord || !userId) return;
    const key = termKey(activeWord);
    if (wordDetails[key]) return;
    api.words
      .fetchWord({
        userId,
        term: activeWord.term,
        language: activeWord.language,
        token,
      })
      .then((entry) => {
        setWordDetails((prev) => ({
          ...prev,
          [key]: normalizeDetails(entry),
        }));
      })
      .catch((err) => {
        console.error(err);
      });
  }, [api.words, activeWord, token, userId, wordDetails]);

  const details = useMemo(
    () => (activeWord ? (wordDetails[termKey(activeWord)] ?? null) : null),
    [activeWord, wordDetails],
  );

  const definition = useMemo(() => {
    if (details?.definitions?.length) {
      return details.definitions[0];
    }
    const rationale = activeWord?.rationales?.[0];
    return rationale ?? plan?.planHighlights?.[0] ?? "";
  }, [details, activeWord, plan]);

  const { options: choiceOptions, correct: correctChoice } = useMemo(() => {
    if (!activeWord) {
      return { options: [], correct: "" };
    }
    const correct = definition || `${activeWord.term} is key for your goal`;
    const others = plan?.words
      ?.filter((word) => word.term !== activeWord.term)
      ?.map((word) => word.rationales?.[0])
      ?.filter(Boolean);
    return { options: buildChoiceOptions(correct, others ?? []), correct };
  }, [definition, activeWord, plan]);

  const visualPalette = useMemo(() => {
    const base = new Set();
    persona?.interests?.forEach((interest) => base.add(interest));
    if (persona?.goal) base.add(persona.goal);
    if (persona?.futurePlan) base.add(persona.futurePlan);
    return Array.from(base);
  }, [persona]);

  const handleRecord = useCallback(
    async ({ score, note }) => {
      if (!activeWord) return;
      await recordProgress(
        {
          term: activeWord.term,
          language: activeWord.language,
          mode: activeMode ?? activeWord.recommendedModes?.[0] ?? "CARD",
          attempts: 1,
          successes: score >= 70 ? 1 : 0,
          retentionScore: score,
          note,
        },
        { token },
      );
      setPracticeMessage("已记录到 Gomemo 日志");
    },
    [activeWord, activeMode, recordProgress, token],
  );

  const handleFlashcard = useCallback(
    (mastered) => {
      handleRecord({
        score: mastered ? 95 : 55,
        note: mastered ? "卡片掌握" : "卡片需复习",
      });
    },
    [handleRecord],
  );

  const handleChoiceSelect = useCallback(
    (option) => {
      if (!choiceOptions.length) return;
      const correct = option === correctChoice;
      setChoiceFeedback(
        correct ? "太棒了，理由命中！" : "可以再回顾下优先级理由。",
      );
      handleRecord({ score: correct ? 90 : 50, note: `选择题：${option}` });
    },
    [choiceOptions, correctChoice, handleRecord],
  );

  const handleSpellingSubmit = useCallback(
    (event) => {
      event.preventDefault();
      if (!activeWord) return;
      const normalized = (spellInput || "").trim().toLowerCase();
      const correct = normalized === activeWord.term.toLowerCase();
      handleRecord({
        score: correct ? 92 : 40,
        note: `拼写结果：${spellInput}`,
      });
      setSpellInput("");
    },
    [activeWord, handleRecord, spellInput],
  );

  const handleVisualSelect = useCallback(
    (value) => {
      setVisualChoice(value);
      handleRecord({ score: 85, note: `视觉锚点：${value}` });
    },
    [handleRecord],
  );

  const handlePlayAudio = useCallback(async () => {
    if (!activeWord) return;
    try {
      const lang = LANGUAGE_TO_TTS[activeWord.language] ?? "en-US";
      const response = await api.tts.speakWord({
        text: activeWord.term,
        lang,
        format: "mp3",
        speed: 1,
        shortcut: false,
        operation: "QUERY",
        token,
      });
      if (response?.data) {
        const source = `data:audio/${response.format ?? "mp3"};base64,${response.data}`;
        setAudioSrc(source);
        const audio = new Audio(source);
        setIsPlaying(true);
        audio.play().finally(() => {
          setIsPlaying(false);
        });
        handleRecord({ score: 88, note: "跟读练习完成" });
      }
    } catch (err) {
      console.error(err);
      setPracticeMessage("音频请求暂时不可用");
    }
  }, [activeWord, api.tts, handleRecord, token]);

  const handleFinalize = useCallback(async () => {
    const summary = await finalizeSession({ token });
    if (summary) {
      setPracticeMessage("已生成豆包复盘");
    }
  }, [finalizeSession, token]);

  const wordList = plan?.words ?? [];

  return (
    <Layout topBarProps={{ toolbarComponent: EmptyToolbar }}>
      <div className={styles["gomemo-page"]}>
        <section className={styles.hero}>
          <div className={styles["hero-inner"]}>
            <span className={styles["hero-kicker"]}>{t.gomemo}</span>
            <h1>{t.gomemoHeroTitle}</h1>
            <p>{persona?.descriptor ?? t.gomemoHeroSubtitle}</p>
            <div className={styles["persona-chip-row"]}>
              <span className={styles.chip}>
                {persona?.tone ?? t.gomemoHeroBadgePersonal}
              </span>
              <span className={styles.chip}>
                {persona?.dailyTarget
                  ? `${t.gomemoHeroBadgeRhythm} · ${persona.dailyTarget} 词`
                  : t.gomemoHeroBadgeRhythm}
              </span>
              {persona?.futurePlan && (
                <span className={styles.chip}>{persona.futurePlan}</span>
              )}
            </div>
            <Button
              className={styles["hero-cta"]}
              disabled={loading}
              onClick={() => loadPlan({ token })}
            >
              {loading ? (t.loading ?? "加载中") : t.gomemoCtaAction}
            </Button>
            {error && <p className={styles.error}>{error}</p>}
          </div>
        </section>

        {plan && (
          <section className={styles.plan}>
            <header className={styles["section-header"]}>
              <h2 className={styles["section-title"]}>
                {t.gomemoPriorityTitle}
              </h2>
              <p className={styles["section-subtitle"]}>
                {t.gomemoPrioritySubtitle}
              </p>
            </header>
            <div className={styles["highlight-grid"]}>
              {plan.planHighlights.map((highlight) => (
                <span key={highlight} className={styles.highlight}>
                  {highlight}
                </span>
              ))}
            </div>
            <div className={styles["word-grid"]}>
              {wordList.map((word, index) => (
                <article
                  key={termKey(word)}
                  className={`${styles["word-card"]} ${
                    index === activeWordIndex ? styles["word-card-active"] : ""
                  }`}
                  onClick={() => selectWord(index)}
                >
                  <div className={styles["word-head"]}>
                    <span className={styles["word-term"]}>{word.term}</span>
                    <span className={styles["word-score"]}>
                      {word.priority}
                    </span>
                  </div>
                  <p className={styles["word-rationale"]}>
                    {word.rationales?.[0]}
                  </p>
                  <div className={styles["word-mode-tags"]}>
                    {word.recommendedModes?.map((mode) => (
                      <span key={mode} className={styles["mode-tag"]}>
                        {mode}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {plan && activeWord && (
          <section className={styles.practice}>
            <header className={styles["section-header"]}>
              <h2 className={styles["section-title"]}>{t.gomemoModesTitle}</h2>
              <p className={styles["section-subtitle"]}>
                {t.gomemoModesSubtitle}
              </p>
            </header>
            <div className={styles["practice-layout"]}>
              <div className={styles["practice-sidebar"]}>
                <div className={styles["practice-word"]}>
                  <h3>{activeWord.term}</h3>
                  {details?.phonetic && (
                    <span className={styles.phonetic}>
                      /{details.phonetic}/
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    className={styles["reveal-button"]}
                    onClick={() => setRevealCard((prev) => !prev)}
                  >
                    {revealCard ? "隐藏释义" : "显示释义"}
                  </Button>
                  {revealCard && (
                    <p className={styles.definition}>{definition}</p>
                  )}
                  {details?.example && (
                    <p className={styles.example}>
                      <strong>Example:</strong> {details.example}
                    </p>
                  )}
                </div>
                <div className={styles["mode-list"]}>
                  {plan.modes.map((mode) => (
                    <button
                      key={mode.type}
                      type="button"
                      className={`${styles["mode-button"]} ${
                        mode.type === activeMode
                          ? styles["mode-button-active"]
                          : ""
                      }`}
                      onClick={() => selectMode(mode.type)}
                    >
                      <ThemeIcon name="sparkle" width={18} height={18} />
                      <div>
                        <strong>{mode.title}</strong>
                        <p className={styles["mode-description"]}>
                          {mode.focus}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div className={styles["practice-panel"]}>
                {activeMode === "CARD" && (
                  <div className={styles["card-mode"]}>
                    <p>{definition}</p>
                    <div className={styles["card-actions"]}>
                      <Button onClick={() => handleFlashcard(true)}>
                        已掌握
                      </Button>
                      <Button
                        className={styles["ghost-button"]}
                        onClick={() => handleFlashcard(false)}
                      >
                        需要复习
                      </Button>
                    </div>
                  </div>
                )}
                {activeMode === "MULTIPLE_CHOICE" && (
                  <div className={styles["choice-mode"]}>
                    <h4>选出最贴切的优先级理由</h4>
                    <div className={styles["choice-grid"]}>
                      {choiceOptions.map((option) => (
                        <button
                          key={option}
                          type="button"
                          className={styles["choice-option"]}
                          onClick={() => handleChoiceSelect(option)}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                    {choiceFeedback && (
                      <p className={styles.feedback}>{choiceFeedback}</p>
                    )}
                  </div>
                )}
                {activeMode === "SPELLING" && (
                  <form
                    className={styles["spelling-mode"]}
                    onSubmit={handleSpellingSubmit}
                  >
                    <label htmlFor="spellInput">键入拼写巩固肌肉记忆</label>
                    <input
                      id="spellInput"
                      value={spellInput}
                      onChange={(event) => setSpellInput(event.target.value)}
                      placeholder="输入拼写"
                      className={styles["spelling-input"]}
                    />
                    <Button type="submit">提交</Button>
                  </form>
                )}
                {activeMode === "VISUAL_ASSOCIATION" && (
                  <div className={styles["visual-mode"]}>
                    <h4>挑选与你最有感的语境锚点</h4>
                    <div className={styles["visual-grid"]}>
                      {visualPalette.map((label) => (
                        <button
                          key={label}
                          type="button"
                          className={`${styles["visual-option"]} ${
                            visualChoice === label
                              ? styles["visual-option-active"]
                              : ""
                          }`}
                          onClick={() => handleVisualSelect(label)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {activeMode === "LISTENING" && (
                  <div className={styles["listening-mode"]}>
                    <p>跟随音频模仿语流与重音。</p>
                    <Button onClick={handlePlayAudio} disabled={isPlaying}>
                      {isPlaying ? "播放中" : "播放音频"}
                    </Button>
                    {audioSrc && (
                      <audio src={audioSrc} controls className={styles.audio} />
                    )}
                  </div>
                )}
                {practiceMessage && (
                  <p className={styles.success}>{practiceMessage}</p>
                )}
              </div>
            </div>
          </section>
        )}

        {plan && (
          <section className={styles.insights}>
            <header className={styles["section-header"]}>
              <h2 className={styles["section-title"]}>
                {t.gomemoInsightsTitle}
              </h2>
              <p className={styles["section-subtitle"]}>
                {t.gomemoInsightsSubtitle}
              </p>
            </header>
            <div className={styles["insight-grid"]}>
              <article className={styles["insight-card"]}>
                <ThemeIcon name="chart-bar" width={24} height={24} />
                <h3>{t.gomemoInsightsTrackingTitle}</h3>
                <p>
                  {plan.progress.completedWords}/{plan.progress.totalWords} ·
                  平均保留率 {Math.round(plan.progress.retentionAverage)}%
                </p>
              </article>
              <article className={styles["insight-card"]}>
                <ThemeIcon name="sparkle" width={24} height={24} />
                <h3>{t.gomemoInsightsReviewTitle}</h3>
                <p>{review?.review ?? t.gomemoInsightsReviewDescription}</p>
              </article>
              <article className={styles["insight-card"]}>
                <ThemeIcon name="arrow-right" width={24} height={24} />
                <h3>{t.gomemoInsightsNextTitle}</h3>
                <p>{review?.nextFocus ?? t.gomemoInsightsNextDescription}</p>
              </article>
            </div>
            <div className={styles["review-actions"]}>
              <Button onClick={handleFinalize}>
                {t.gomemoInsightsReviewTitle}
              </Button>
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
}

export default Gomemo;
