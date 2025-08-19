import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { streamChatMessage } from "@/api/chat.js";
import styles from "./ChatView.module.css";

export default function ChatView({ streamFn = streamChatMessage }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    let acc = "";
    for await (const chunk of streamFn({
      model: "default",
      messages: [...messages, userMessage],
    })) {
      acc += chunk;
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last?.role === "assistant") {
          next[next.length - 1] = { ...last, content: acc };
        } else {
          next.push({ role: "assistant", content: acc });
        }
        return next;
      });
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.history}>
        {messages.map((m, i) => (
          <div
            key={i}
            className={`${styles.message} ${m.role === "user" ? styles.user : styles.assistant}`}
          >
            <ReactMarkdown>{m.content}</ReactMarkdown>
          </div>
        ))}
      </div>
      <form className={styles.form} onSubmit={handleSubmit}>
        <input
          className={styles.input}
          placeholder="输入消息"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          className={styles.button}
          type="submit"
          disabled={!input.trim()}
        >
          发送
        </button>
      </form>
    </div>
  );
}
