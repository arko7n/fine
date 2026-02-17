"use client";

import { useContext } from "react";
import { SidebarContext } from "@/components/layout/sidebar-provider";

export function useSidebar() {
  return useContext(SidebarContext);
}
