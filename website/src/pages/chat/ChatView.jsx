import { useRef, useState } from "react";
import ChatInput from "@/components/ui/ChatInput";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";
import { streamChatMessage } from "@/api/chat.js";
import { DEFAULT_MODEL } from "@/config";
import { useLanguage } from "@/context";
import { createAssistantMessageFormatter } from "@/features/chat/createAssistantMessageFormatter.js";
import styles from "./ChatView.module.css";

export default function ChatView({ streamFn = streamChatMessage }) {
  const { t } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const formatterRef = useRef();

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
    for await (const chunk of streamFn({
      model: DEFAULT_MODEL,
      messages: [...messages, userMessage],
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
      />
    </div>
  );
}
