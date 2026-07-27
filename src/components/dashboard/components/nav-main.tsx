"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronRightIcon,
  LayoutDashboardIcon,
  LayoutTemplateIcon,
  ClipboardListIcon,
  WrenchIcon,
  FileTextIcon,
  RefreshCw,
} from "lucide-react";

import { useDraftsCount } from "@/hooks";
import { Badge } from "@/components/ui/badge";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function NavMain() {
  const pathname = usePathname();
  const { data: draftsCount } = useDraftsCount();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const isProgramsActive =
    pathname.startsWith("/programs") ||
    (pathname.startsWith("/builder") && !pathname.includes("builderId"));

  const isProfileBuilderActive =
    pathname.startsWith("/profile-builders") ||
    (pathname.startsWith("/builder") && pathname.includes("builderId"));

  const hasDraftNotification = draftsCount !== undefined && draftsCount > 0;

  return (
    <>
      {/* KATEGORI: UTAMA */}
      <SidebarGroup>
        <SidebarGroupLabel>Utama</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/dashboard"}
              tooltip="Dashboard"
            >
              <Link href="/dashboard">
                <LayoutDashboardIcon />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>

      {/* KATEGORI: VERIFIKASI */}
      <SidebarGroup>
        <SidebarGroupLabel>Verifikasi</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isProgramsActive}
              tooltip="Programs"
            >
              <Link href="/programs">
                <ClipboardListIcon />
                <span>Programs</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/drafts"}
              tooltip="Draft Evaluasi"
            >
              <Link href="/drafts" className="flex justify-between items-center w-full">
                <div className="flex items-center gap-2">
                  <div className="relative flex items-center justify-center">
                    <FileTextIcon />
                    {isCollapsed && hasDraftNotification && (
                      <span className="absolute -top-1 -right-1 flex h-2 w-2 rounded-full bg-amber-500 ring-2 ring-sidebar animate-gentle-glow animate-gentle-bounce" />
                    )}
                  </div>
                  <span>Draft Evaluasi</span>
                </div>
                {!isCollapsed && hasDraftNotification && (
                  <Badge className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full p-0 text-[10px] font-bold bg-amber-500 text-white animate-gentle-bounce shadow-[0_0_6px_rgba(245,158,11,0.5)]">
                    {draftsCount}
                  </Badge>
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>

      {/* KATEGORI: BUILDER */}
      <SidebarGroup>
        <SidebarGroupLabel>Builder</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isProfileBuilderActive}
              tooltip="Profile Builder"
            >
              <Link href="/profile-builders">
                <LayoutTemplateIcon />
                <span>Profile Builder</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    </>
  );
}
