"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/hooks/use-sidebar";
import { useMobile } from "@/hooks/use-mobile";

export function MobileHeader() {
  const isMobile = useMobile();
  const { toggle } = useSidebar();

  if (!isMobile) return null;

  return (
    <header className="flex items-center gap-2 border-b px-4 py-3 md:hidden">
      <Button variant="ghost" size="icon-sm" onClick={toggle}>
        <Menu className="size-5" />
      </Button>
      <h1 className="text-lg font-semibold tracking-tight">Myst</h1>
    </header>
  );
}
