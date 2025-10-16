import { useCallback, useState } from "react";
import ChatInput from "@shared/components/ui/ChatInput";
import ChatTranscript from "@shared/components/ui/ChatTranscript";
import { completeChatMessage, streamChatMessage } from "@shared/api/chat.js";
import { useLanguage } from "@core/context";
import { useChatConversation } from "@features/chat/hooks/useChatConversation.js";
import styles from "./ChatView.module.css";

export default function ChatView({
  streamFn = streamChatMessage,
  completeFn = completeChatMessage,
}) {
  const { t } = useLanguage();
  const [input, setInput] = useState("");
  const { messages, sendUserMessage } = useChatConversation({
    streamFn,
    completeFn,
  });

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();
      const message = input;
      setInput("");
      sendUserMessage(message);
    },
    [input, sendUserMessage],
  );

  const handleVoice = () => {
    /* Voice input integration hook */
  };

  return (
    <div className={styles.container}>
      <ChatTranscript messages={messages} />
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
