"use client";

import { useRef, useEffect } from "react";
import { useChat } from "@/hooks/use-chat";
import { MessageBubble } from "./message-bubble";
import { TypingIndicator } from "./typing-indicator";
import { ChatInput } from "./chat-input";

type Message = { role: "user" | "assistant"; content: string };

type Props = {
  threadId: string | null;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  onFirstMessage?: () => void;
};

export function ChatArea({ threadId, messages, setMessages, onFirstMessage }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const { input, setInput, loading, streaming, handleSubmit } = useChat({
    threadId,
    messages,
    setMessages,
    onFirstMessage,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  if (!threadId) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Select a thread or start a new chat.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-2xl space-y-3">
          {messages.length === 0 && !loading && (
            <p className="pt-24 text-center text-sm text-muted-foreground">
              Send a message to get started.
            </p>
          )}
          {messages.map((msg, i) => (
            <MessageBubble key={i} role={msg.role} content={msg.content} />
          ))}
          {loading && !streaming && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>
      </main>
      <ChatInput
        input={input}
        setInput={setInput}
        loading={loading}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
