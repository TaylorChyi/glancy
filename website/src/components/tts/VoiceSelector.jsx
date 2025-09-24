import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi.js";
import { useLanguage } from "@/context";
import { useUserStore, useVoiceStore } from "@/store";
import fieldStyles from "../form/Form.module.css";
import styles from "./VoiceSelector.module.css";

/**
 * Dropdown for selecting available voices for a given language.
 * Voices requiring Pro plan are disabled for non-pro users.
 */
export default function VoiceSelector({ lang }) {
  const api = useApi();
  const { t } = useLanguage();
  const user = useUserStore((s) => s.user);
  const [voices, setVoices] = useState([]);
  const selected = useVoiceStore((s) => s.getVoice(lang));
  const setVoice = useVoiceStore((s) => s.setVoice);
  const sessionToken = user?.token;
  const subscriptionSignature = `${user?.id ?? ""}|${user?.plan ?? ""}|${
    user?.member ? "1" : "0"
  }|${user?.isPro ? "1" : "0"}`;

  useEffect(() => {
    let cancelled = false;
    const resetVoices = () => {
      if (!cancelled) setVoices([]);
    };
    if (!lang || !sessionToken) {
      resetVoices();
      return () => {
        cancelled = true;
      };
    }
    api.tts
      .fetchVoices({ lang })
      .then((list) => {
        if (!cancelled) {
          setVoices(Array.isArray(list) ? list : []);
        }
      })
      .catch((err) => {
        console.error(err);
        resetVoices();
      });
    return () => {
      cancelled = true;
    };
  }, [lang, api, sessionToken, subscriptionSignature]);

  const isPro = !!(
    user?.member ||
    user?.isPro ||
    (user?.plan && user.plan !== "free")
  );

  return (
    <select
      className={[fieldStyles.select, styles.select].join(" ")}
      value={selected || ""}
      onChange={(e) => setVoice(lang, e.target.value)}
    >
      {voices.map((v) => {
        const disabled = v.plan === "pro" && !isPro;
        const label = disabled ? `${v.label} (${t.upgradeAvailable})` : v.label;
        return (
          <option
            key={v.id}
            value={v.id}
            disabled={disabled}
            className={disabled ? styles.disabled : undefined}
          >
            {label}
          </option>
        );
      })}
    </select>
  );
}
