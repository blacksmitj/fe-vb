"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  CheckCircle2Icon,
  ClockIcon,
  FileTextIcon,
  LayoutTemplateIcon,
  TrendingUpIcon,
  UsersIcon,
  XCircleIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

// ─── Mock data ────────────────────────────────────────────────────────────────

const monthlyVerifications = [
  { month: "Jan", requests: 186, approved: 140, rejected: 46 },
  { month: "Feb", requests: 305, approved: 245, rejected: 60 },
  { month: "Mar", requests: 237, approved: 195, rejected: 42 },
  { month: "Apr", requests: 273, approved: 220, rejected: 53 },
  { month: "May", requests: 349, approved: 290, rejected: 59 },
  { month: "Jun", requests: 414, approved: 355, rejected: 59 },
];

const templateActivity = [
  { template: "KYC Basic", submissions: 124 },
  { template: "KYC Enhanced", submissions: 98 },
  { template: "AML Check", submissions: 76 },
  { template: "Business Reg.", submissions: 54 },
  { template: "Address Proof", submissions: 41 },
  { template: "Income Verify", submissions: 38 },
];

const recentSubmissions = [
  {
    id: "SUB-0091",
    user: "Siti Rahma",
    template: "KYC Basic",
    status: "approved",
    submitted: "2 min ago",
  },
  {
    id: "SUB-0090",
    user: "Budi Santoso",
    template: "KYC Enhanced",
    status: "pending",
    submitted: "14 min ago",
  },
  {
    id: "SUB-0089",
    user: "Dewi Lestari",
    template: "AML Check",
    status: "rejected",
    submitted: "31 min ago",
  },
  {
    id: "SUB-0088",
    user: "Andi Pratama",
    template: "Business Reg.",
    status: "approved",
    submitted: "1 hr ago",
  },
  {
    id: "SUB-0087",
    user: "Rini Agustina",
    template: "Address Proof",
    status: "pending",
    submitted: "2 hr ago",
  },
];

// ─── Chart configs ─────────────────────────────────────────────────────────────

const verificationsChartConfig: ChartConfig = {
  requests: { label: "Total Requests", color: "var(--chart-1)" },
  approved: { label: "Approved", color: "var(--chart-2)" },
  rejected: { label: "Rejected", color: "var(--chart-3)" },
};

const templateChartConfig: ChartConfig = {
  submissions: { label: "Submissions", color: "var(--chart-1)" },
};

// ─── KPI cards data ────────────────────────────────────────────────────────────

const kpiCards = [
  {
    title: "Verification Requests",
    value: "1,764",
    trend: "+12.4%",
    up: true,
    description: "vs. last month",
    icon: FileTextIcon,
  },
  {
    title: "Templates Created",
    value: "48",
    trend: "+4",
    up: true,
    description: "this month",
    icon: LayoutTemplateIcon,
  },
  {
    title: "Approval Rate",
    value: "83.2%",
    trend: "+2.1%",
    up: true,
    description: "vs. last month",
    icon: CheckCircle2Icon,
  },
  {
    title: "Active Users",
    value: "321",
    trend: "-5",
    up: false,
    description: "currently online",
    icon: UsersIcon,
  },
];

// ─── Status badge helper ───────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === "approved") {
    return (
      <Badge
        variant="secondary"
        className="gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
      >
        <CheckCircle2Icon className="size-3" />
        Approved
      </Badge>
    );
  }
  if (status === "rejected") {
    return (
      <Badge
        variant="secondary"
        className="gap-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      >
        <XCircleIcon className="size-3" />
        Rejected
      </Badge>
    );
  }
  return (
    <Badge
      variant="secondary"
      className="gap-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
    >
      <ClockIcon className="size-3" />
      Pending
    </Badge>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function DashboardPage() {
  return (
    <div className="flex flex-col h-full bg-background overflow-hidden font-sans">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-6">
        <div className="flex items-center gap-2 px-1">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      {/* ── Content Area ───────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* ── KPI Cards ──────────────────────────────────────── */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card) => (
          <Card key={card.title} className="@container/card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tracking-tight">{card.value}</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <span
                  className={`flex items-center gap-0.5 font-medium ${
                    card.up ? "text-emerald-600" : "text-red-500"
                  }`}
                >
                  {card.up ? (
                    <ArrowUpRightIcon className="size-3" />
                  ) : (
                    <ArrowDownRightIcon className="size-3" />
                  )}
                  {card.trend}
                </span>
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* ── Charts ─────────────────────────────────────────── */}
      <section className="grid gap-4 md:grid-cols-2">
        {/* Area chart — verification requests over time */}
        <Card>
          <CardHeader>
            <CardTitle>Verification Requests</CardTitle>
            <CardDescription>
              Monthly overview — Jan–Jun 2025
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={verificationsChartConfig}>
              <AreaChart
                accessibilityLayer
                data={monthlyVerifications}
                margin={{ top: 4, left: -20, right: 12 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <defs>
                  <linearGradient
                    id="fillRequests"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="var(--color-requests)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-requests)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                  <linearGradient
                    id="fillApproved"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="var(--color-approved)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-approved)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>
                <Area
                  dataKey="requests"
                  type="natural"
                  fill="url(#fillRequests)"
                  stroke="var(--color-requests)"
                  stackId="a"
                />
                <Area
                  dataKey="approved"
                  type="natural"
                  fill="url(#fillApproved)"
                  stroke="var(--color-approved)"
                  stackId="b"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
          <CardFooter className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUpIcon className="size-4 text-emerald-500" />
            Trending up 12.4% this month
          </CardFooter>
        </Card>

        {/* Bar chart — submissions by template */}
        <Card>
          <CardHeader>
            <CardTitle>Submissions by Template</CardTitle>
            <CardDescription>Top 6 templates — last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={templateChartConfig}>
              <BarChart
                accessibilityLayer
                data={templateActivity}
                layout="vertical"
                margin={{ top: 4, left: 0, right: 12, bottom: 0 }}
              >
                <CartesianGrid horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false} />
                <YAxis
                  dataKey="template"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  width={100}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Bar
                  dataKey="submissions"
                  fill="var(--color-submissions)"
                  radius={4}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
          <CardFooter className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUpIcon className="size-4 text-emerald-500" />
            431 total submissions this period
          </CardFooter>
        </Card>
      </section>

      {/* ── Recent Submissions ─────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Submissions</CardTitle>
          <CardDescription>
            Latest 5 verification submissions across all templates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="pb-3 text-left font-medium">ID</th>
                  <th className="pb-3 text-left font-medium">User</th>
                  <th className="pb-3 text-left font-medium">Template</th>
                  <th className="pb-3 text-left font-medium">Status</th>
                  <th className="pb-3 text-right font-medium">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentSubmissions.map((sub) => (
                  <tr key={sub.id} className="group">
                    <td className="py-3 font-mono text-xs text-muted-foreground">
                      {sub.id}
                    </td>
                    <td className="py-3 font-medium">{sub.user}</td>
                    <td className="py-3 text-muted-foreground">
                      {sub.template}
                    </td>
                    <td className="py-3">
                      <StatusBadge status={sub.status} />
                    </td>
                    <td className="py-3 text-right text-muted-foreground">
                      {sub.submitted}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
