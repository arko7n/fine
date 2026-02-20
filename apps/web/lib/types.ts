export type ContentPart =
  | { type: "text"; text: string }
  | { type: "thinking"; text: string }
  | {
      type: "tool_use";
      id: string;
      name: string;
      status: "calling" | "done";
      input?: string;
      output?: string;
    };

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  parts?: ContentPart[];
};
