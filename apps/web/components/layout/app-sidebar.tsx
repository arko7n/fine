"use client";

import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { SidebarNav } from "./sidebar-nav";
import { SidebarThreads } from "./sidebar-threads";
import { Separator } from "@/components/ui/separator";
import { useSidebar } from "@/hooks/use-sidebar";
import { useMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import type { Thread } from "@/lib/api";

type Props = {
  threads: Thread[];
  activeThreadId: string | null;
  onSelectThread: (id: string) => void;
  onNewChat: () => void;
};

function SidebarContent({
  threads,
  activeThreadId,
  onSelectThread,
  onNewChat,
  onNavigate,
}: Props & { onNavigate?: () => void }) {
  const pathname = usePathname();
  const showThreads = pathname.startsWith("/chat");

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 py-4">
        <h1 className="text-lg font-semibold tracking-tight">Fine</h1>
      </div>
      <SidebarNav onNavigate={onNavigate} />
      {showThreads && (
        <>
          <Separator className="my-2" />
          <SidebarThreads
            threads={threads}
            activeThreadId={activeThreadId}
            onSelectThread={onSelectThread}
            onNewChat={onNewChat}
            onNavigate={onNavigate}
          />
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

export function AppSidebar(props: Props) {
  const isMobile = useMobile();
  const { open, setOpen } = useSidebar();

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent {...props} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r bg-muted/30">
      <SidebarContent {...props} />
    </aside>
  );
}
