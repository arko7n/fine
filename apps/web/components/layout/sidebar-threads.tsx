"use client";

import { Plus, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Thread } from "@/lib/api";

type Props = {
  threads: Thread[];
  activeThreadId: string | null;
  onSelectThread: (id: string) => void;
  onNewChat: () => void;
  onNavigate?: () => void;
};

export function SidebarThreads({
  threads,
  activeThreadId,
  onSelectThread,
  onNewChat,
  onNavigate,
}: Props) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2">
        <span className="text-xs font-medium text-muted-foreground">Threads</span>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => {
            onNewChat();
            onNavigate?.();
          }}
        >
          <Plus className="size-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-1 px-2 pb-2">
          {threads.length === 0 && (
            <p className="px-2 py-4 text-center text-xs text-muted-foreground">
              No conversations yet
            </p>
          )}
          {threads.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                onSelectThread(t.id);
                onNavigate?.();
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent",
                activeThreadId === t.id && "bg-accent"
              )}
            >
              <MessageSquare className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{t.last_message || t.body.title}</span>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
