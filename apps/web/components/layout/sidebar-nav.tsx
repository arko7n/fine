"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, Plug, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { label: "Chat", href: "/chat", icon: MessageSquare },
  { label: "Integrations", href: "/integrations", icon: Plug },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1 px-2">
      {items.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent",
              active && "bg-accent font-medium"
            )}
          >
            <item.icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
