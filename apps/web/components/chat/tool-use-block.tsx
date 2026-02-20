"use client";

import { Loader2, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Props = {
  name: string;
  status: "calling" | "done";
};

export function ToolUseBlock({ name, status }: Props) {
  return (
    <Badge variant="outline" className="my-1 gap-2 rounded-md py-1">
      {status === "calling" ? (
        <Loader2 className="size-3 animate-spin" />
      ) : (
        <Check className="size-3 text-green-600" />
      )}
      <span>{name}</span>
    </Badge>
  );
}
