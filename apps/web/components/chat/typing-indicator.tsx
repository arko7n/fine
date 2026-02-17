export function TypingIndicator() {
  return (
    <div className="mr-auto max-w-lg rounded-xl border bg-card px-4 py-3 text-sm text-card-foreground">
      <div className="flex items-center gap-1">
        <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
        <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
        <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
      </div>
    </div>
  );
}
