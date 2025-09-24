import { useMemo } from "react";
import Layout from "@/components/Layout";
import Button from "@/components/ui/Button";
import ThemeIcon from "@/components/ui/Icon";
import { useLanguage } from "@/context";
import styles from "./Gomemo.module.css";

const EmptyToolbar = () => null;

function Gomemo() {
  const { t } = useLanguage();

  const heroBadges = useMemo(
    () =>
      [
        t.gomemoHeroBadgePersonal,
        t.gomemoHeroBadgeRhythm,
        t.gomemoHeroBadgeFuture,
      ].filter(Boolean),
    [t],
  );

  const priorityFacets = useMemo(
    () =>
      [
        {
          title: t.gomemoPriorityAgeTitle,
          description: t.gomemoPriorityAgeDescription,
          icon: "cake",
        },
        {
          title: t.gomemoPriorityInterestTitle,
          description: t.gomemoPriorityInterestDescription,
          icon: "adjustments-horizontal",
        },
        {
          title: t.gomemoPriorityGoalTitle,
          description: t.gomemoPriorityGoalDescription,
          icon: "target",
        },
        {
          title: t.gomemoPriorityHistoryTitle,
          description: t.gomemoPriorityHistoryDescription,
          icon: "refresh",
        },
        {
          title: t.gomemoPriorityDailyTitle,
          description: t.gomemoPriorityDailyDescription,
          icon: "shield-check",
        },
        {
          title: t.gomemoPriorityPlanTitle,
          description: t.gomemoPriorityPlanDescription,
          icon: "arrow-right-on-rectangle",
        },
      ].filter((facet) => facet.title && facet.description),
    [t],
  );

  const practiceModes = useMemo(
    () =>
      [
        {
          title: t.gomemoModesCardTitle,
          description: t.gomemoModesCardDescription,
          icon: "glancy",
        },
        {
          title: t.gomemoModesQuizTitle,
          description: t.gomemoModesQuizDescription,
          icon: "question-mark-circle",
        },
        {
          title: t.gomemoModesSpellingTitle,
          description: t.gomemoModesSpellingDescription,
          icon: "command-line",
        },
        {
          title: t.gomemoModesVisualTitle,
          description: t.gomemoModesVisualDescription,
          icon: "eye",
        },
        {
          title: t.gomemoModesAudioTitle,
          description: t.gomemoModesAudioDescription,
          icon: "voice-button",
        },
      ].filter((mode) => mode.title && mode.description),
    [t],
  );

  const insightHighlights = useMemo(
    () =>
      [
        {
          title: t.gomemoInsightsTrackingTitle,
          description: t.gomemoInsightsTrackingDescription,
          icon: "cog-6-tooth",
        },
        {
          title: t.gomemoInsightsReviewTitle,
          description: t.gomemoInsightsReviewDescription,
          icon: "star-solid",
        },
        {
          title: t.gomemoInsightsNextTitle,
          description: t.gomemoInsightsNextDescription,
          icon: "arrow-right",
        },
      ].filter((item) => item.title && item.description),
    [t],
  );

  return (
    <Layout topBarProps={{ toolbarComponent: EmptyToolbar }}>
      <div className={styles["gomemo-page"]}>
        <section className={styles.hero}>
          <div className={styles["hero-inner"]}>
            <span className={styles["hero-kicker"]}>{t.gomemo}</span>
            <h1>{t.gomemoHeroTitle}</h1>
            <p>{t.gomemoHeroSubtitle}</p>
            {heroBadges.length > 0 && (
              <div className={styles["hero-badges"]}>
                {heroBadges.map((badge) => (
                  <span key={badge} className={styles["hero-badge"]}>
                    {badge}
                  </span>
                ))}
              </div>
            )}
            <Button className={styles["hero-cta"]}>{t.gomemoCtaAction}</Button>
          </div>
        </section>

        <section className={`${styles.priority} ${styles.section}`}>
          <header className={styles["section-header"]}>
            <h2 className={styles["section-title"]}>{t.gomemoPriorityTitle}</h2>
            <p className={styles["section-subtitle"]}>
              {t.gomemoPrioritySubtitle}
            </p>
          </header>
          <div className={styles["priority-grid"]}>
            {priorityFacets.map((facet) => (
              <article key={facet.title} className={styles["priority-card"]}>
                <ThemeIcon
                  name={facet.icon}
                  alt=""
                  aria-hidden="true"
                  width={28}
                  height={28}
                  className={styles["card-icon"]}
                />
                <h3>{facet.title}</h3>
                <p>{facet.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={`${styles.modes} ${styles.section}`}>
          <header className={styles["section-header"]}>
            <h2 className={styles["section-title"]}>{t.gomemoModesTitle}</h2>
            <p className={styles["section-subtitle"]}>
              {t.gomemoModesSubtitle}
            </p>
          </header>
          <div className={styles["modes-grid"]}>
            {practiceModes.map((mode) => (
              <article key={mode.title} className={styles["mode-card"]}>
                <ThemeIcon
                  name={mode.icon}
                  alt=""
                  aria-hidden="true"
                  width={26}
                  height={26}
                  className={styles["card-icon"]}
                />
                <h3>{mode.title}</h3>
                <p>{mode.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={`${styles.insights} ${styles.section}`}>
          <header className={styles["section-header"]}>
            <h2 className={styles["section-title"]}>{t.gomemoInsightsTitle}</h2>
            <p className={styles["section-subtitle"]}>
              {t.gomemoInsightsSubtitle}
            </p>
          </header>
          <div className={styles["insight-grid"]}>
            {insightHighlights.map((item) => (
              <article key={item.title} className={styles["insight-card"]}>
                <ThemeIcon
                  name={item.icon}
                  alt=""
                  aria-hidden="true"
                  width={26}
                  height={26}
                  className={styles["card-icon"]}
                />
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles["cta-panel"]}>
          <h2 className={styles["cta-title"]}>{t.gomemoCtaTitle}</h2>
          <p className={styles["cta-subtitle"]}>{t.gomemoCtaSubtitle}</p>
          <Button className={styles["hero-cta"]}>{t.gomemoCtaAction}</Button>
        </section>
      </div>
    </Layout>
  );
}

export default Gomemo;
