"use client";

import { useState, useRef, useCallback, type FormEvent } from "react";
import { sendMessage } from "@/lib/api";

type Message = { role: "user" | "assistant"; content: string };

type UseChatOptions = {
  threadId: string | null;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  onFirstMessage?: () => void;
};

export function useChat({ threadId, messages, setMessages, onFirstMessage }: UseChatOptions) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const streamingRef = useRef(false);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      const text = input.trim();
      if (!text || loading || !threadId) return;

      setInput("");
      setMessages((prev) => [...prev, { role: "user", content: text }]);
      setLoading(true);
      setStreaming(false);
      streamingRef.current = false;

      try {
        const res = await sendMessage(threadId, text);

        if (!res.ok || !res.body) {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: "Something went wrong. Please try again." },
          ]);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let assistantText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split("\n")) {
            if (!line.startsWith("data: ") || line === "data: [DONE]") continue;
            try {
              const json = JSON.parse(line.slice(6));
              const delta = json.choices?.[0]?.delta?.content;
              if (delta) {
                if (!streamingRef.current) {
                  streamingRef.current = true;
                  setStreaming(true);
                  setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
                }
                assistantText += delta;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: "assistant",
                    content: assistantText,
                  };
                  return updated;
                });
              }
            } catch {
              // skip non-JSON lines
            }
          }
        }

        onFirstMessage?.();
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Connection error. Please try again." },
        ]);
      } finally {
        setLoading(false);
        setStreaming(false);
        streamingRef.current = false;
      }
    },
    [input, loading, threadId, setMessages, onFirstMessage]
  );

  return { input, setInput, loading, streaming, handleSubmit };
}
