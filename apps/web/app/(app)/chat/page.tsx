"use client";

import { ChatArea } from "@/components/chat/chat-area";
import { useSessions } from "@/hooks/use-sessions";

export default function ChatPage() {
  const { activeSessionId, messages, setMessages, userId } = useSessions();

  if (!userId || !activeSessionId) return null;

  return (
    <ChatArea
      key={activeSessionId}
      sessionKey={activeSessionId}
      userId={userId}
      messages={messages}
      setMessages={setMessages}
    />
  );
}
