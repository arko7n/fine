"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type Props = {
  text: string;
  streaming?: boolean;
};

export function ThinkingBlock({ text, streaming }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors py-1">
        <ChevronRight
          className={`size-3.5 transition-transform ${open ? "rotate-90" : ""}`}
        />
        <span>{streaming ? "Thinking..." : "Thought"}</span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="ml-5 mt-1 mb-2 text-xs text-muted-foreground whitespace-pre-wrap border-l-2 border-muted pl-3">
          {text}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
