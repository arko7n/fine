"use client";

import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  input: string;
  setInput: (value: string) => void;
  loading: boolean;
  onSubmit: (e: FormEvent) => void;
};

export function ChatInput({ input, setInput, loading, onSubmit }: Props) {
  return (
    <form onSubmit={onSubmit} className="border-t px-4 py-4">
      <div className="mx-auto flex max-w-2xl gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Message..."
          disabled={loading}
        />
        <Button type="submit" disabled={loading || !input.trim()}>
          Send
        </Button>
      </div>
    </form>
  );
}
