"use client";

import { useState, useRef, useCallback, type FormEvent } from "react";
import { sendMessage } from "@/lib/api";
import type { ChatMessage, ContentPart } from "@/lib/types";

type UseChatOptions = {
  sessionKey: string | null;
  userId: string;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  onFirstMessage?: () => void;
};

export function useChat({
  sessionKey,
  userId,
  messages,
  setMessages,
  onFirstMessage,
}: UseChatOptions) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const streamingRef = useRef(false);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      const text = input.trim();
      if (!text || loading || !sessionKey) return;

      setInput("");
      setMessages((prev) => [...prev, { role: "user", content: text }]);
      setLoading(true);
      setStreaming(false);
      streamingRef.current = false;

      try {
        const res = await sendMessage(sessionKey, text, userId);

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
        let parts: ContentPart[] = [];
        let buffer = "";
        let currentEvent = "";

        const updateMessage = () => {
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: "assistant",
              content: assistantText,
              parts: [...parts],
            };
            return updated;
          });
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (line.startsWith("event: ")) {
              currentEvent = line.slice(7).trim();
              continue;
            }

            if (!line.startsWith("data: ")) continue;
            const dataStr = line.slice(6);
            if (dataStr === "[DONE]") continue;

            let data: Record<string, unknown>;
            try {
              data = JSON.parse(dataStr);
            } catch {
              continue;
            }

            // Initialize assistant message only when actual content arrives
            const ensureAssistantMessage = () => {
              if (!streamingRef.current) {
                streamingRef.current = true;
                setStreaming(true);
                setMessages((prev) => [
                  ...prev,
                  { role: "assistant", content: "", parts: [] },
                ]);
              }
            };

            // Use embedded type from JSON, fall back to SSE event name
            const evtType = (data.type as string) ?? currentEvent;

            if (evtType === "response.output_text.delta" || evtType === "response.text.delta") {
              ensureAssistantMessage();
              const delta = (data.delta as string) ?? "";
              assistantText += delta;
              const lastPart = parts[parts.length - 1];
              if (lastPart && lastPart.type === "text") {
                lastPart.text += delta;
              } else {
                parts.push({ type: "text", text: delta });
              }
              updateMessage();
            } else if (evtType === "response.thinking.delta") {
              ensureAssistantMessage();
              const delta = (data.delta as string) ?? "";
              const lastPart = parts[parts.length - 1];
              if (lastPart && lastPart.type === "thinking") {
                lastPart.text += delta;
              } else {
                parts.push({ type: "thinking", text: delta });
              }
              updateMessage();
            } else if (evtType === "response.output_item.added") {
              const item = (data.item as Record<string, unknown>) ?? {};
              if (item.type === "function_call") {
                ensureAssistantMessage();
                parts.push({
                  type: "tool_use",
                  id: (item.call_id as string) ?? "",
                  name: (item.name as string) ?? "",
                  status: "calling",
                });
                updateMessage();
              }
            } else if (evtType === "response.output_item.done") {
              const item = (data.item as Record<string, unknown>) ?? {};
              if (item.type === "function_call") {
                const callId = (item.call_id as string) ?? "";
                const tool = parts.find(
                  (p) => p.type === "tool_use" && p.id === callId
                );
                if (tool && tool.type === "tool_use") {
                  tool.status = "done";
                }
                updateMessage();
              }
            } else if (evtType === "response.completed" || evtType === "response.done") {
              // Stream done
            }

            currentEvent = "";
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
    [input, loading, sessionKey, userId, setMessages, onFirstMessage]
  );

  return { input, setInput, loading, streaming, handleSubmit };
}
