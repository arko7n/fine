"use client";

import type { FormEvent, KeyboardEvent } from "react";
import { useRef, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type Props = {
  input: string;
  setInput: (value: string) => void;
  loading: boolean;
  onSubmit: (e: FormEvent) => void;
};

export function ChatInput({ input, setInput, loading, onSubmit }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [input]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!loading && input.trim()) {
        onSubmit(e as unknown as FormEvent);
      }
    }
  };

  return (
    <div className="border-t px-4 py-3">
      <div className="mx-auto flex max-w-2xl items-end gap-2">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message..."
          disabled={loading}
          rows={1}
          className="min-h-0 resize-none rounded-2xl border-0 bg-muted/50 py-2.5 text-sm shadow-none focus-visible:ring-0"
        />
        <Button
          type="button"
          size="icon"
          onClick={(e) => onSubmit(e as unknown as FormEvent)}
          disabled={loading || !input.trim()}
          className="shrink-0 rounded-full"
        >
          <ArrowUp className="size-4" />
        </Button>
      </div>
    </div>
  );
}
