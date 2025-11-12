import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useApi } from "@shared/hooks/useApi.js";
import { useLanguage } from "@core/context";
import { useUserStore, useVoiceStore } from "@core/store";
import fieldStyles from "../form/Form.module.css";
import styles from "./VoiceSelector.module.css";

/**
 * Dropdown for selecting available voices for a given language.
 * Voices requiring Pro plan are disabled for non-pro users.
 */
export default function VoiceSelector({
  lang,
  id,
  className = "",
  variant = "form",
  ...props
}) {
  const api = useApi();
  const { t } = useLanguage();
  const user = useUserStore((s) => s.user);
  const selected = useVoiceStore((s) => s.getVoice(lang));
  const setVoice = useVoiceStore((s) => s.setVoice);
  const sessionToken = user?.token;
  const subscriptionSignature = `${user?.id ?? ""}|${user?.plan ?? ""}|${
    user?.member ? "1" : "0"
  }|${user?.isPro ? "1" : "0"}`;
  const voices = useVoiceOptions({
    api,
    lang,
    sessionToken,
    subscriptionSignature,
  });

  const isPro = !!(
    user?.member ||
    user?.isPro ||
    (user?.plan && user.plan !== "free")
  );

  const normalizedVariant = variant === "pill" ? "pill" : "form";
  const composedClassName = buildSelectClassName(
    normalizedVariant,
    className,
  );
  const renderVoiceOption = useMemo(
    () => createVoiceOptionRenderer(isPro, t.upgradeAvailable),
    [isPro, t.upgradeAvailable],
  );

  return (
    <select
      id={id}
      className={composedClassName}
      value={selected || ""}
      onChange={(e) => setVoice(lang, e.target.value)}
      {...props}
    >
      {voices.map(renderVoiceOption)}
    </select>
  );
}

VoiceSelector.propTypes = {
  lang: PropTypes.string.isRequired,
  id: PropTypes.string,
  className: PropTypes.string,
  variant: PropTypes.oneOf(["form", "pill"]),
};

VoiceSelector.defaultProps = {
  id: undefined,
  className: "",
  variant: "form",
};

function useVoiceOptions({ api, lang, sessionToken, subscriptionSignature }) {
  const [voices, setVoices] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const cleanup = () => {
      cancelled = true;
    };

    if (!isVoiceRequestAllowed(lang, sessionToken)) {
      setVoices([]);
      return cleanup;
    }

    const applyVoices = createVoiceApplier(setVoices, () => cancelled);
    const processVoices = (list) => runVoicePipeline(list, applyVoices);

    api.tts
      .fetchVoices({ lang })
      .then(processVoices)
      .catch((err) => {
        console.error(err);
        applyVoices([]);
      });

    return cleanup;
  }, [api, lang, sessionToken, subscriptionSignature]);

  return voices;
}

function isVoiceRequestAllowed(lang, token) {
  return Boolean(lang && token);
}

function normalizeVoiceList(list) {
  return Array.isArray(list) ? list : [];
}

function runVoicePipeline(list, apply) {
  // validate -> normalize -> apply pipeline to keep cognitive load low
  const normalized = normalizeVoiceList(list);
  apply(normalized);
}

function createVoiceApplier(setter, isCancelled) {
  return (list) => {
    if (isCancelled()) return;
    setter(list);
  };
}

function createVoiceOptionRenderer(isPro, upgradeLabel) {
  return (voice) => {
    const disabled = voice.plan === "pro" && !isPro;
    const upgradeSuffix = upgradeLabel ? ` (${upgradeLabel})` : "";
    const label = disabled ? `${voice.label}${upgradeSuffix}` : voice.label;
    return (
      <option
        key={voice.id}
        value={voice.id}
        disabled={disabled}
        className={disabled ? styles.disabled : undefined}
      >
        {label}
      </option>
    );
  };
}

function buildSelectClassName(variant, extraClassName) {
  const base =
    variant === "pill"
      ? [styles.select, styles["select-pill"]]
      : [fieldStyles.select, styles.select];
  return [...base, extraClassName].filter(Boolean).join(" ");
}
