"use client";

import * as React from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface PageLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function PageLayout({ children, className, ...props }: PageLayoutProps) {
  return (
    <div
      className={cn(
        "flex flex-col h-screen w-full bg-background overflow-hidden font-sans",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface PageHeaderProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
  actions?: React.ReactNode;
}

export function PageHeader({
  children,
  actions,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 bg-background transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12",
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-2 px-1">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        {children}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}

interface PageContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  scrollable?: boolean;
}

export function PageContent({
  children,
  scrollable = true,
  className,
  ...props
}: PageContentProps) {
  return (
    <div
      className={cn(
        "flex-1 p-4 pt-2 md:p-6 md:pt-4",
        scrollable ? "overflow-y-auto" : "overflow-hidden",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
