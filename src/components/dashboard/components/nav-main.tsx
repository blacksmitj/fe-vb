"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronRightIcon,
  LayoutDashboardIcon,
  LayoutTemplateIcon,
  ClipboardListIcon,
  WrenchIcon,
} from "lucide-react";

import { useFixDataCount } from "@/hooks/use-fix-data";
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

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType;
  items: { title: string; url: string }[];
  isFixData?: boolean;
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboardIcon,
    items: [],
  },
  {
    title: "Programs",
    url: "/programs",
    icon: ClipboardListIcon,
    items: [],
  },
  {
    title: "Profile Builder",
    url: "/profile-builders",
    icon: LayoutTemplateIcon,
    items: [],
  },
  {
    title: "Perbaikan Data",
    url: "/fix-data",
    icon: WrenchIcon,
    items: [],
    isFixData: true,
  },
];

export function NavMain() {
  const pathname = usePathname();
  const { data: fixDataCount } = useFixDataCount();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {navItems.map((item) => {
          const isActive =
            item.url === "/dashboard"
              ? pathname === "/dashboard"
              : item.url === "/programs"
                ? pathname.startsWith("/programs") || (pathname.startsWith("/builder") && !pathname.includes("builderId"))
                : item.url === "/profile-builders"
                  ? pathname.startsWith("/profile-builders") || (pathname.startsWith("/builder") && pathname.includes("builderId"))
                  : pathname.startsWith(item.url) && item.url !== "/";

          // Simple items (no sub-items)
          if (item.items.length === 0) {
            const hasNotification = item.isFixData && fixDataCount !== undefined && fixDataCount > 0;
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                  <Link href={item.url} className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-2">
                      <div className="relative flex items-center justify-center">
                        <item.icon />
                        {isCollapsed && hasNotification && (
                          <span className="absolute -top-1 -right-1 flex h-2 w-2 rounded-full bg-destructive ring-2 ring-sidebar" />
                        )}
                      </div>
                      <span>{item.title}</span>
                    </div>
                    {!isCollapsed && hasNotification && (
                      <Badge variant="destructive" className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full p-0 text-[10px]">
                        {fixDataCount}
                      </Badge>
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }

          // Collapsible items with sub-menu
          const isOpen = item.items.some((sub) => pathname === sub.url) || isActive;

          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={isOpen}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title}>
                    <item.icon />
                    <span>{item.title}</span>
                    <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items.map((sub) => (
                      <SidebarMenuSubItem key={sub.title}>
                        <SidebarMenuSubButton asChild isActive={pathname === sub.url}>
                          <Link href={sub.url}>
                            <span>{sub.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
