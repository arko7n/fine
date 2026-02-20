"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Plus, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { fetchSessions, type Session } from "@/lib/api";

export function SidebarSessions({ onNavigate }: { onNavigate?: () => void }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeSessionId = searchParams.get("s");

  useEffect(() => {
    fetchSessions().then(setSessions);
  }, []);

  const handleSelect = useCallback(
    (id: string) => {
      router.push(`/chat?s=${id}`);
      onNavigate?.();
    },
    [router, onNavigate],
  );

  const handleNewChat = useCallback(() => {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    setSessions((prev) => [
      { id, title: "New Chat", createdAt: now, updatedAt: now },
      ...prev,
    ]);
    router.push(`/chat?s=${id}`);
    onNavigate?.();
  }, [router, onNavigate]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2">
        <span className="text-xs font-medium text-muted-foreground">
          Sessions
        </span>
        <Button variant="ghost" size="icon-xs" onClick={handleNewChat}>
          <Plus className="size-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-1 px-2 pb-2">
          {sessions.length === 0 && (
            <p className="px-2 py-4 text-center text-xs text-muted-foreground">
              No conversations yet
            </p>
          )}
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => handleSelect(s.id)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent",
                activeSessionId === s.id && "bg-accent",
              )}
            >
              <MessageSquare className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{s.title}</span>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
