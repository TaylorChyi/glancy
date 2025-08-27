import { useState, useEffect } from "react";
import "@/pages/App/App.css";
import styles from "./Preferences.module.css";
import { useLanguage } from "@/context";
import { useTheme } from "@/context";
import { API_PATHS } from "@/config/api.js";
import { useUser } from "@/context/UserContext.jsx";
import MessagePopup from "@/components/ui/MessagePopup";
import SelectField from "@/components/form/SelectField.jsx";
import FormRow from "@/components/form/FormRow.jsx";
import { useApi } from "@/hooks";
import { useModelStore } from "@/store";
import { VoiceSelector } from "@/components";

function Preferences() {
  const { t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { user } = useUser();
  const api = useApi();
  const { model, setModel } = useModelStore();
  const [models, setModels] = useState([]);
  const [sourceLang, setSourceLang] = useState(
    localStorage.getItem("sourceLang") || "auto",
  );
  const [targetLang, setTargetLang] = useState(
    localStorage.getItem("targetLang") || "ENGLISH",
  );
  const [defaultModel, setDefaultModel] = useState(model);
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupMsg, setPopupMsg] = useState("");

  useEffect(() => {
    api.llm
      .fetchModels()
      .then((list) => setModels(list))
      .catch((err) => console.error(err));
  }, [api]);

  useEffect(() => {
    if (!user) return;
    api
      .request(`${API_PATHS.preferences}/user/${user.id}`)
      .then((data) => {
        const sl = data.systemLanguage || "auto";
        const tl = data.searchLanguage || "ENGLISH";
        const dm = data.dictionaryModel || model;
        setSourceLang(sl);
        setTargetLang(tl);
        setDefaultModel(dm);
        setModel(dm);
        localStorage.setItem("sourceLang", sl);
        localStorage.setItem("targetLang", tl);
        setTheme(data.theme || "system");
      })
      .catch((err) => {
        console.error(err);
        setPopupMsg(t.fail);
        setPopupOpen(true);
      });
  }, [setTheme, t, user, api, model, setModel]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return;
    await api.jsonRequest(`${API_PATHS.preferences}/user/${user.id}`, {
      method: "POST",
      body: {
        systemLanguage: sourceLang,
        searchLanguage: targetLang,
        dictionaryModel: defaultModel,
        theme,
      },
    });
    localStorage.setItem("sourceLang", sourceLang);
    localStorage.setItem("targetLang", targetLang);
    setModel(defaultModel);
    setPopupMsg(t.saveSuccess);
    setPopupOpen(true);
  };

  return (
    <div className="app">
      <h2>{t.prefTitle}</h2>
      <form className={styles["preferences-form"]} onSubmit={handleSave}>
        <FormRow label={t.prefLanguage} id="source-lang">
          <SelectField
            value={sourceLang}
            onChange={setSourceLang}
            options={[
              { value: "auto", label: t.autoDetect },
              { value: "CHINESE", label: "CHINESE" },
              { value: "ENGLISH", label: "ENGLISH" },
            ]}
          />
        </FormRow>
        <FormRow label={t.prefSearchLanguage} id="target-lang">
          <SelectField
            value={targetLang}
            onChange={setTargetLang}
            options={[
              { value: "CHINESE", label: "CHINESE" },
              { value: "ENGLISH", label: "ENGLISH" },
            ]}
          />
        </FormRow>
        <FormRow label={t.prefDictionaryModel} id="dictionary-model">
          <SelectField
            value={defaultModel}
            onChange={setDefaultModel}
            options={models.map((m) => ({ value: m, label: t[m] || m }))}
          />
        </FormRow>
        <FormRow label={t.prefVoiceEn} id="voice-en">
          <VoiceSelector lang="en" />
        </FormRow>
        <FormRow label={t.prefVoiceZh} id="voice-zh">
          <VoiceSelector lang="zh" />
        </FormRow>
        <FormRow label={t.prefTheme} id="theme-select">
          <SelectField
            value={theme}
            onChange={setTheme}
            options={[
              { value: "light", label: "light" },
              { value: "dark", label: "dark" },
              { value: "system", label: "system" },
            ]}
          />
        </FormRow>
        <button type="submit">{t.saveButton}</button>
      </form>
      <MessagePopup
        open={popupOpen}
        message={popupMsg}
        onClose={() => setPopupOpen(false)}
      />
    </div>
  );
}

export default Preferences;
