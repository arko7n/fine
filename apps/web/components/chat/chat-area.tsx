"use client";

import { useRef, useEffect, useState } from "react";
import { useChat } from "@/hooks/use-chat";
import type { ChatMessage } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageItem } from "./message-item";
import { ChatInput } from "./chat-input";

type Props = {
  sessionKey: string | null;
  userId: string;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  onFirstMessage?: () => void;
};

export function ChatArea({ sessionKey, userId, messages, setMessages, onFirstMessage }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  const { input, setInput, loading, streaming, handleSubmit } = useChat({
    sessionKey,
    userId,
    messages,
    setMessages,
    onFirstMessage,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  if (!sessionKey) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Select a session or start a new chat.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ScrollArea className="flex-1">
        <div className="px-4 py-6">
          <div className="mx-auto max-w-2xl space-y-4">
            {messages.length === 0 && !loading && (
              <p className="pt-24 text-center text-sm text-muted-foreground">
                Send a message to get started.
              </p>
            )}
            {messages.map((msg, i) => (
              <MessageItem
                key={i}
                message={msg}
                streaming={streaming && i === messages.length - 1 && msg.role === "assistant"}
              />
            ))}
            {loading && !streaming && (
              <div className="flex items-center gap-1 py-2">
                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>
      </ScrollArea>
      <ChatInput
        input={input}
        setInput={setInput}
        loading={loading}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
