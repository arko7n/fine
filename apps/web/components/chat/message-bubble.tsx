type Props = {
  role: "user" | "assistant";
  content: string;
};

export function MessageBubble({ role, content }: Props) {
  return (
    <div
      className={
        role === "user"
          ? "ml-auto max-w-md rounded-xl bg-primary px-4 py-3 text-sm text-primary-foreground"
          : "mr-auto max-w-lg rounded-xl border bg-card px-4 py-3 text-sm text-card-foreground"
      }
    >
      <p className="whitespace-pre-wrap">{content}</p>
    </div>
  );
}
