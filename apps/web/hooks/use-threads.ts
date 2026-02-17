"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { createThread, listThreads, getThread } from "@/lib/api";
import type { Thread } from "@/lib/api";
import React from "react";

type Message = { role: "user" | "assistant"; content: string };

type ThreadsContextType = {
  threads: Thread[];
  activeThreadId: string | null;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  loadThreads: () => Promise<Thread[]>;
  selectThread: (id: string) => Promise<void>;
  newChat: () => Promise<void>;
};

const ThreadsContext = createContext<ThreadsContextType | null>(null);

export function ThreadsProvider({ children }: { children: ReactNode }) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  const loadThreads = useCallback(async () => {
    const data = await listThreads();
    setThreads(data);
    return data;
  }, []);

  useEffect(() => {
    loadThreads().then(async (data) => {
      if (data.length === 0) {
        const thread = await createThread("New Chat");
        setThreads([thread]);
        setActiveThreadId(thread.id);
      } else {
        setActiveThreadId(data[0].id);
        const full = await getThread(data[0].id);
        setMessages(
          full.events.map((e) => ({
            role: e.body.role,
            content: e.body.content,
          }))
        );
      }
    });
  }, [loadThreads]);

  const selectThread = useCallback(async (id: string) => {
    setActiveThreadId(id);
    const thread = await getThread(id);
    setMessages(
      thread.events.map((e) => ({
        role: e.body.role,
        content: e.body.content,
      }))
    );
  }, []);

  const newChat = useCallback(async () => {
    const thread = await createThread("New Chat");
    setThreads((prev) => [thread, ...prev]);
    setActiveThreadId(thread.id);
    setMessages([]);
  }, []);

  return React.createElement(
    ThreadsContext.Provider,
    {
      value: { threads, activeThreadId, messages, setMessages, loadThreads, selectThread, newChat },
    },
    children
  );
}

export function useThreads() {
  const ctx = useContext(ThreadsContext);
  if (!ctx) throw new Error("useThreads must be used within ThreadsProvider");
  return ctx;
}
