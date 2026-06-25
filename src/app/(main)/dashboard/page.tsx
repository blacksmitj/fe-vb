import { DashboardPage } from "@/components/dashboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — Verif Builder",
  description:
    "Overview of verification requests, templates, submissions, and active users.",
};

export default function Page() {
  return <DashboardPage />;
}
