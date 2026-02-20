"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type { ChatMessage } from "@/lib/types";
import { getMe, fetchSessions, fetchSessionMessages, type Session } from "@/lib/api";
import React from "react";

export type { Session };

type SessionsContextType = {
  userId: string | null;
  sessions: Session[];
  activeSessionId: string | null;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  selectSession: (id: string) => void;
  newChat: () => void;
};

const SessionsContext = createContext<SessionsContextType | null>(null);

export function SessionsProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    getMe().then((u) => setUserId(u.id));
  }, []);

  useEffect(() => {
    if (!userId) return;
    fetchSessions().then((list) => {
      if (list.length > 0) {
        setSessions(list);
        setActiveSessionId(list[0].id);
        fetchSessionMessages(list[0].id).then(setMessages);
      } else {
        const now = new Date().toISOString();
        const s: Session = { id: crypto.randomUUID(), title: "New Chat", createdAt: now, updatedAt: now };
        setSessions([s]);
        setActiveSessionId(s.id);
      }
    });
  }, [userId]);

  const selectSession = useCallback((id: string) => {
    setActiveSessionId(id);
    setMessages([]);
    fetchSessionMessages(id).then((m) => {
      if (m.length) setMessages(m);
    });
  }, []);

  const newChat = useCallback(() => {
    const now = new Date().toISOString();
    const s: Session = { id: crypto.randomUUID(), title: "New Chat", createdAt: now, updatedAt: now };
    setSessions((prev) => [s, ...prev]);
    setActiveSessionId(s.id);
    setMessages([]);
  }, []);

  return React.createElement(
    SessionsContext.Provider,
    { value: { userId, sessions, activeSessionId, messages, setMessages, selectSession, newChat } },
    children
  );
}

export function useSessions() {
  const ctx = useContext(SessionsContext);
  if (!ctx) throw new Error("useSessions must be used within SessionsProvider");
  return ctx;
}
