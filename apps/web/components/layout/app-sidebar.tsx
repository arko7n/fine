"use client";

import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { SidebarNav } from "./sidebar-nav";
import { SidebarSessions } from "./sidebar-sessions";
import { Separator } from "@/components/ui/separator";
import { useSidebar } from "@/hooks/use-sidebar";
import { useMobile } from "@/hooks/use-mobile";
import { useFineUser } from "@/hooks/use-fine-user";
import { Sheet, SheetContent } from "@/components/ui/sheet";

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { hasProvisioned } = useFineUser();
  const showSessions = pathname.startsWith("/chat") && hasProvisioned;

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 py-4">
        <h1 className="text-lg font-semibold tracking-tight">Myst</h1>
      </div>
      <SidebarNav onNavigate={onNavigate} />
      {showSessions && (
        <>
          <Separator className="my-2" />
          <SidebarSessions onNavigate={onNavigate} />
        </>
      )}
      <div className="mt-auto border-t px-4 py-3">
        <UserButton
          afterSignOutUrl="/sign-in"
          appearance={{
            elements: {
              rootBox: "flex items-center",
              userButtonTrigger: "focus:shadow-none",
            },
          }}
        />
      </div>
    </div>
  );
}

export function AppSidebar() {
  const isMobile = useMobile();
  const { open, setOpen } = useSidebar();

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r bg-muted/30">
      <SidebarContent />
    </aside>
  );
}
