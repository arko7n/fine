"use client";

import { ChatArea } from "@/components/chat/chat-area";
import { useThreads } from "@/hooks/use-threads";

export default function ChatPage() {
  const { activeThreadId, messages, setMessages, loadThreads } = useThreads();

  return (
    <ChatArea
      key={activeThreadId}
      threadId={activeThreadId}
      messages={messages}
      setMessages={setMessages}
      onFirstMessage={loadThreads}
    />
  );
}
