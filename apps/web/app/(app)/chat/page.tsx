"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { ChatArea } from "@/components/chat/chat-area";
import { fetchSessions, fetchSessionMessages } from "@/lib/api";
import type { ChatMessage } from "@/lib/types";

export default function ChatPage() {
  const { userId } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("s");
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (sessionId) {
      setMessages([]);
      fetchSessionMessages(sessionId).then(setMessages);
      return;
    }
    // No session in URL — redirect to most recent or create new
    fetchSessions().then((list) => {
      const id = list.length > 0 ? list[0].id : crypto.randomUUID();
      router.replace(`/chat?s=${id}`);
    });
  }, [sessionId, router]);

  if (!userId || !sessionId) return null;

  return (
    <ChatArea
      key={sessionId}
      sessionKey={sessionId}
      userId={userId}
      messages={messages}
      setMessages={setMessages}
    />
  );
}
