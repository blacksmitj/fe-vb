import type { Metadata } from "next";
import Link from "next/link";
import { Construction, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Dashboard — Verif Builder",
  description:
    "Overview of verification requests, templates, submissions, and active users.",
};

export default function Page() {
  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden font-sans">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-6 bg-background">
        <div className="flex items-center gap-2 px-1">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <span className="text-sm font-medium text-muted-foreground">Dashboard</span>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-dashed border-2 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="pt-8 pb-8 flex flex-col items-center text-center space-y-6">
            <div className="p-4 rounded-full bg-amber-50 dark:bg-amber-950/20 text-amber-500 animate-bounce">
              <Construction className="h-12 w-12" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Under Construction</h2>
              <p className="text-sm text-muted-foreground px-4">
                Halaman dashboard belum digunakan dan saat ini sedang dalam proses pembangunan. Silakan kembali nanti.
              </p>
            </div>

            <Button asChild className="gap-2">
              <Link href="/programs">
                <ArrowLeft className="h-4 w-4" />
                Kembali ke Program
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
