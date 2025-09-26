import { useCallback, useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import ThemeIcon from "@/components/ui/Icon";
import { useLanguage } from "@/context";
import { useApi } from "@/hooks/useApi.js";
import { useUserStore, useGomemoStore } from "@/store";
import { useSettingsStore } from "@/store/settings";
import {
  resolveDictionaryConfig,
  WORD_FLAVOR_BILINGUAL,
  WORD_LANGUAGE_AUTO,
} from "@/utils";
import styles from "./Gomemo.module.css";

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

const queueItemKey = (word) => `${word.language}:${word.term}`;

const buildDetailKey = (term, language, flavor) => {
  const normalizedLanguage = language
    ? String(language).toUpperCase()
    : WORD_LANGUAGE_AUTO;
  const normalizedFlavor = flavor
    ? String(flavor).toUpperCase()
    : WORD_FLAVOR_BILINGUAL;
  const safeTerm = term ?? "";
  return `${normalizedLanguage}:${normalizedFlavor}:${safeTerm}`;
};
const GOMEMO_ICON_NAME = "gomemo";

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
  const selectCurrentUser = useCallback((state) => state.user, []);
  const currentUser = useUserStore(selectCurrentUser);
  const dictionarySourceLanguage = useSettingsStore(
    (state) => state.dictionarySourceLanguage,
  );
  const dictionaryTargetLanguage = useSettingsStore(
    (state) => state.dictionaryTargetLanguage,
  );
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
  const [selectedChoice, setSelectedChoice] = useState("");
  const [visualChoice, setVisualChoice] = useState("");
  const [audioSrc, setAudioSrc] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [practiceMessage, setPracticeMessage] = useState("");

  const token = currentUser?.token ?? null;
  const userId = currentUser?.id ? String(currentUser.id) : undefined;

  const resolveLookupConfig = useCallback(
    (word) => {
      if (!word || !word.term) {
        return {
          language: WORD_LANGUAGE_AUTO,
          flavor: WORD_FLAVOR_BILINGUAL,
        };
      }
      const sourcePreference =
        word.language ?? dictionarySourceLanguage ?? WORD_LANGUAGE_AUTO;
      return resolveDictionaryConfig(word.term, {
        sourceLanguage: sourcePreference,
        targetLanguage: dictionaryTargetLanguage,
      });
    },
    [dictionarySourceLanguage, dictionaryTargetLanguage],
  );

  useEffect(() => {
    if (!plan && !loading) {
      loadPlan({ token });
    }
  }, [plan, loading, loadPlan, token]);

  const handleRefreshPlan = useCallback(() => {
    loadPlan({ token, force: true });
  }, [loadPlan, token]);

  const activeWord = plan?.words?.[activeWordIndex] ?? null;
  const activeLookupConfig = useMemo(
    () => resolveLookupConfig(activeWord),
    [activeWord, resolveLookupConfig],
  );
  const activeDetailKey = useMemo(() => {
    if (!activeWord || !activeLookupConfig) return null;
    return buildDetailKey(
      activeWord.term,
      activeLookupConfig.language,
      activeLookupConfig.flavor,
    );
  }, [activeWord, activeLookupConfig]);
  const persona = plan?.persona;

  useEffect(() => {
    setRevealCard(false);
    setChoiceFeedback("");
    setSelectedChoice("");
    setSpellInput("");
    setVisualChoice("");
    setPracticeMessage("");
  }, [activeWord, activeMode]);

  useEffect(() => {
    if (!activeWord || !userId || !activeLookupConfig || !activeDetailKey) {
      return;
    }
    if (wordDetails[activeDetailKey]) return;
    api.words
      .fetchWord({
        userId,
        term: activeWord.term,
        language: activeLookupConfig.language,
        flavor: activeLookupConfig.flavor,
        token,
      })
      .then((entry) => {
        setWordDetails((prev) => ({
          ...prev,
          [activeDetailKey]: normalizeDetails(entry),
        }));
      })
      .catch((err) => {
        console.error(err);
      });
  }, [
    api.words,
    activeWord,
    token,
    userId,
    wordDetails,
    activeLookupConfig,
    activeDetailKey,
  ]);

  const details = useMemo(
    () => (activeDetailKey ? (wordDetails[activeDetailKey] ?? null) : null),
    [activeDetailKey, wordDetails],
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

  const progress = plan?.progress;
  const completedWords = progress?.completedWords ?? 0;
  const totalWords = progress?.totalWords ?? plan?.words?.length ?? 0;
  const retentionAverage =
    typeof progress?.retentionAverage === "number"
      ? Math.round(progress.retentionAverage)
      : null;
  const queuePosition =
    typeof activeWordIndex === "number" && activeWordIndex >= 0
      ? activeWordIndex + 1
      : 0;

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
      setSelectedChoice(option);
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
    <div className={styles["gomemo-shell"]}>
      <header className={styles["shell-header"]}>
        <div className={styles.brand}>
          <span className={styles["brand-icon"]}>
            <ThemeIcon name={GOMEMO_ICON_NAME} width={22} height={22} />
          </span>
          <div className={styles["brand-copy"]}>
            <span className={styles["brand-title"]}>GOMEMO STUDIO</span>
            <span className={styles["brand-subtitle"]}>
              {persona?.descriptor ?? t.gomemoHeroSubtitle}
            </span>
          </div>
        </div>
        <div className={styles["header-meta"]}>
          <div className={styles["meta-item"]}>
            <span className={styles["meta-label"]}>今日进度</span>
            <span className={styles["meta-value"]}>
              {completedWords}/{totalWords || "-"}
            </span>
          </div>
          <div className={styles["meta-item"]}>
            <span className={styles["meta-label"]}>保持率</span>
            <span className={styles["meta-value"]}>
              {retentionAverage != null ? `${retentionAverage}%` : "-"}
            </span>
          </div>
          <div className={styles["meta-item"]}>
            <span className={styles["meta-label"]}>当前词位</span>
            <span className={styles["meta-value"]}>
              {queuePosition && totalWords
                ? `${queuePosition}/${totalWords}`
                : "-"}
            </span>
          </div>
        </div>
        <div className={styles["header-actions"]}>
          <Button
            className={styles["primary-action"]}
            disabled={loading}
            onClick={handleRefreshPlan}
          >
            {loading ? (t.loading ?? "加载中") : t.gomemoCtaAction}
          </Button>
        </div>
      </header>

      {error && <p className={styles.error}>{error}</p>}

      {!plan ? (
        <div className={styles["empty-state"]}>
          <div className={styles["empty-card"]}>
            <h1>{t.gomemoHeroTitle}</h1>
            <p>{t.gomemoHeroSubtitle}</p>
            <Button
              className={styles["primary-action"]}
              disabled={loading}
              onClick={handleRefreshPlan}
            >
              {loading ? (t.loading ?? "加载中") : t.gomemoCtaAction}
            </Button>
          </div>
        </div>
      ) : (
        <div className={styles["shell-body"]}>
          <aside className={styles["plan-panel"]}>
            <div>
              <h2 className={styles["panel-title"]}>{t.gomemoPriorityTitle}</h2>
              <p className={styles["panel-subtitle"]}>
                {t.gomemoPrioritySubtitle}
              </p>
            </div>
            <div className={styles["persona-card"]}>
              <div className={styles["persona-header"]}>
                <span className={styles["persona-tone"]}>
                  {persona?.tone ?? t.gomemoHeroBadgePersonal}
                </span>
                {persona?.dailyTarget && (
                  <span className={styles["persona-target"]}>
                    {persona.dailyTarget} 词/日
                  </span>
                )}
              </div>
              <div className={styles["persona-tags"]}>
                {persona?.goal && (
                  <span className={styles["persona-tag"]}>{persona.goal}</span>
                )}
                {persona?.futurePlan && (
                  <span className={styles["persona-tag"]}>
                    {persona.futurePlan}
                  </span>
                )}
                {visualPalette.map((label) => (
                  <span key={label} className={styles["persona-tag"]}>
                    {label}
                  </span>
                ))}
              </div>
            </div>
            <div className={styles["highlight-list"]}>
              {plan.planHighlights.map((highlight) => (
                <span key={highlight} className={styles["highlight-item"]}>
                  {highlight}
                </span>
              ))}
            </div>
            <div className={styles["insight-stack"]}>
              <article className={styles["insight-card"]}>
                <ThemeIcon name="chart-bar" width={22} height={22} />
                <div>
                  <h3>{t.gomemoInsightsTrackingTitle}</h3>
                  <p>
                    {completedWords}/{totalWords} · 平均保持率{" "}
                    {retentionAverage != null ? `${retentionAverage}%` : "-"}
                  </p>
                </div>
              </article>
              <article className={styles["insight-card"]}>
                <ThemeIcon name={GOMEMO_ICON_NAME} width={22} height={22} />
                <div>
                  <h3>{t.gomemoInsightsReviewTitle}</h3>
                  <p>{review?.review ?? t.gomemoInsightsReviewDescription}</p>
                </div>
              </article>
              <article className={styles["insight-card"]}>
                <ThemeIcon name="arrow-right" width={22} height={22} />
                <div>
                  <h3>{t.gomemoInsightsNextTitle}</h3>
                  <p>{review?.nextFocus ?? t.gomemoInsightsNextDescription}</p>
                </div>
              </article>
            </div>
            <Button
              className={styles["secondary-action"]}
              onClick={handleFinalize}
            >
              {t.gomemoInsightsReviewTitle}
            </Button>
          </aside>

          <main className={styles["practice-panel"]}>
            {activeWord ? (
              <div className={styles["practice-wrapper"]}>
                <div className={styles["focus-header"]}>
                  <div className={styles["term-stack"]}>
                    <span className={styles["term-label"]}>当前记忆</span>
                    <div className={styles["term-row"]}>
                      <span className={styles["term-value"]}>
                        {activeWord.term}
                      </span>
                      <span className={styles["term-language"]}>
                        {activeWord.language}
                      </span>
                    </div>
                    {details?.phonetic && (
                      <span className={styles.phonetic}>
                        /{details.phonetic}/
                      </span>
                    )}
                  </div>
                  <div className={styles["focus-controls"]}>
                    <Button
                      className={styles["surface-action"]}
                      onClick={() => setRevealCard((prev) => !prev)}
                    >
                      {revealCard ? "隐藏释义" : "显示释义"}
                    </Button>
                    <Button
                      className={styles["surface-action"]}
                      onClick={handlePlayAudio}
                      disabled={isPlaying}
                    >
                      {isPlaying ? "播放中" : "朗读单词"}
                    </Button>
                  </div>
                </div>

                <div className={styles["knowledge-panel"]}>
                  <div className={styles["knowledge-card"]}>
                    <h4>释义</h4>
                    <p>
                      {revealCard ? definition : "点击“显示释义”展开记忆要点"}
                    </p>
                  </div>
                  {details?.example && (
                    <div className={styles["knowledge-card"]}>
                      <h4>例句</h4>
                      <p>{details.example}</p>
                    </div>
                  )}
                  {details?.synonyms?.length ? (
                    <div className={styles["knowledge-card"]}>
                      <h4>同义提示</h4>
                      <p>{details.synonyms.join(" · ")}</p>
                    </div>
                  ) : null}
                </div>

                <div className={styles["mode-selector"]}>
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
                      <ThemeIcon
                        name={GOMEMO_ICON_NAME}
                        width={18}
                        height={18}
                      />
                      <div>
                        <strong>{mode.title}</strong>
                        <p>{mode.focus}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className={styles["mode-stage"]}>
                  {activeMode === "CARD" && (
                    <div className={styles["card-mode"]}>
                      <p className={styles["card-definition"]}>{definition}</p>
                      <div className={styles["card-actions"]}>
                        <Button
                          className={styles["primary-action"]}
                          onClick={() => handleFlashcard(true)}
                        >
                          已掌握
                        </Button>
                        <Button
                          className={styles["surface-action"]}
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
                            className={`${styles["choice-option"]} ${
                              selectedChoice === option
                                ? styles["choice-option-active"]
                                : ""
                            }`}
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
                      <Button
                        type="submit"
                        className={styles["primary-action"]}
                      >
                        提交
                      </Button>
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
                      <Button
                        onClick={handlePlayAudio}
                        disabled={isPlaying}
                        className={styles["primary-action"]}
                      >
                        {isPlaying ? "播放中" : "播放音频"}
                      </Button>
                      {audioSrc && (
                        <audio
                          src={audioSrc}
                          controls
                          className={styles.audio}
                        />
                      )}
                    </div>
                  )}
                </div>

                {practiceMessage && (
                  <div className={styles["practice-toast"]}>
                    {practiceMessage}
                  </div>
                )}
              </div>
            ) : (
              <div className={styles["empty-practice"]}>
                <ThemeIcon name={GOMEMO_ICON_NAME} width={32} height={32} />
                <h3>请选择一个词条开始训练</h3>
                <p>从右侧词单中挑选词条，或刷新计划获取新的练习。</p>
              </div>
            )}
          </main>

          <aside className={styles["queue-panel"]}>
            <div className={styles["queue-header"]}>
              <h2 className={styles["panel-title"]}>今日词单</h2>
              <span className={styles["queue-progress"]}>
                {queuePosition && totalWords
                  ? `${queuePosition}/${totalWords}`
                  : `${wordList.length} 词`}
              </span>
            </div>
            <div className={styles["queue-list"]}>
              {wordList.map((word, index) => {
                const isActive = index === activeWordIndex;
                return (
                  <button
                    key={queueItemKey(word)}
                    type="button"
                    className={`${styles["queue-item"]} ${
                      isActive ? styles["queue-item-active"] : ""
                    }`}
                    onClick={() => selectWord(index)}
                  >
                    <div className={styles["queue-term"]}>{word.term}</div>
                    <div className={styles["queue-meta"]}>
                      <span>优先级 {word.priority}</span>
                      {word.recommendedModes?.length ? (
                        <span>
                          {word.recommendedModes.slice(0, 2).join(" · ")}
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

export default Gomemo;
