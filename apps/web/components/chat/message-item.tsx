"use client";

import type { ChatMessage } from "@/lib/types";
import { MarkdownContent } from "./markdown-content";
import { ThinkingBlock } from "./thinking-block";
import { ToolUseBlock } from "./tool-use-block";

type Props = {
  message: ChatMessage;
  streaming?: boolean;
};

export function MessageItem({ message, streaming }: Props) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-lg rounded-2xl bg-muted px-4 py-2.5 text-sm">
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  // Assistant message — render parts if available, else fall back to content
  if (message.parts && message.parts.length > 0) {
    return (
      <div className="text-sm">
        {message.parts.map((part, i) => {
          switch (part.type) {
            case "thinking":
              return (
                <ThinkingBlock key={i} text={part.text} streaming={streaming} />
              );
            case "tool_use":
              return (
                <ToolUseBlock key={i} name={part.name} status={part.status} />
              );
            case "text":
              return <MarkdownContent key={i} content={part.text} />;
            default:
              return null;
          }
        })}
      </div>
    );
  }

  return (
    <div className="text-sm">
      <MarkdownContent content={message.content} />
    </div>
  );
}
