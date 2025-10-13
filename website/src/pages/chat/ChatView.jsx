import { useRef, useState } from "react";
import ChatInput from "@/components/ui/ChatInput";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";
import { completeChatMessage, streamChatMessage } from "@/api/chat.js";
import { DEFAULT_MODEL } from "@/config";
import { useLanguage } from "@/context";
import { createAssistantMessageFormatter } from "@/features/chat/createAssistantMessageFormatter.js";
import {
  CHAT_COMPLETION_MODE_STREAMING,
  useSettingsStore,
} from "@/store/settings";
import styles from "./ChatView.module.css";

export default function ChatView({
  streamFn = streamChatMessage,
  completeFn = completeChatMessage,
}) {
  const { t } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const formatterRef = useRef();
  const chatCompletionMode = useSettingsStore(
    (state) => state.chatCompletionMode,
  );
  const isStreaming = chatCompletionMode === CHAT_COMPLETION_MODE_STREAMING;

  if (!formatterRef.current) {
    formatterRef.current = createAssistantMessageFormatter();
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    let firstChunk = true;
    const formatter = formatterRef.current;
    formatter.reset();
    const history = [...messages, userMessage];
    if (isStreaming) {
      for await (const chunk of streamFn({
        model: DEFAULT_MODEL,
        messages: history,
      })) {
        const formatted = formatter.append(chunk);
        if (firstChunk) {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: formatted },
          ]);
          firstChunk = false;
        } else {
          setMessages((prev) => {
            const last = { ...prev.at(-1) };
            last.content = formatted;
            return [...prev.slice(0, -1), last];
          });
        }
      }
      return;
    }
    const result = await completeFn({
      model: DEFAULT_MODEL,
      messages: history,
    });
    const formatted = formatter.append(result ?? "");
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: formatted },
    ]);
  };

  const handleVoice = () => {
    /* Voice input integration hook */
  };

  return (
    <div className={styles.container}>
      <div className={styles.history}>
        {messages.map((m, i) => (
          <div
            key={i}
            className={`${styles.message} ${m.role === "user" ? styles.user : styles.assistant}`}
          >
            <MarkdownRenderer>{m.content}</MarkdownRenderer>
          </div>
        ))}
      </div>
      <ChatInput
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onSubmit={handleSubmit}
        onVoice={handleVoice}
        placeholder={t.chatPlaceholder}
        sendLabel={t.sendButton}
        maxRows={5}
        maxWidth="var(--layout-content-max, 960px)"
      />
    </div>
  );
}
