import { db } from "@/lib/db";
import { auth } from "@/lib/auth/auth";
import { headers as getHeaders } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await getHeaders(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // ─── 1. Ambil semua program milik user ───────────────────────────────────
    const programs = await db.program.findMany({
      where: {
        programMembers: {
          some: {
            userId,
            status: "APPROVED",
          },
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        totalRows: true,
        fieldCount: true,
        errorCount: true,
        createdAt: true,
        updatedAt: true,
        status: true,
        importLogs: {
          select: { status: true },
          orderBy: { importedAt: "desc" },
          take: 1,
        },
        programMembers: {
          where: { userId },
          select: { role: true },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const programIds = programs.map((p) => p.id);

    // ─── 2. Hitung eval stats per program ────────────────────────────────────
    const evalStats = await db.participant.groupBy({
      by: ["programId", "evalStatus"],
      where: { programId: { in: programIds } },
      _count: { id: true },
    });

    const statsMap: Record<string, { verified: number; rejected: number }> = {};
    programIds.forEach((id) => {
      statsMap[id] = { verified: 0, rejected: 0 };
    });
    evalStats.forEach((stat) => {
      const s = statsMap[stat.programId];
      if (!s) return;
      if (stat.evalStatus === "VERIFIED") s.verified = stat._count.id;
      else if (stat.evalStatus === "REJECTED") s.rejected = stat._count.id;
    });

    // ─── 3. Format program list ───────────────────────────────────────────────
    const formattedPrograms = programs.map((p) => {
      const s = statsMap[p.id] ?? { verified: 0, rejected: 0 };
      const pending = Math.max(0, p.totalRows - s.verified - s.rejected);
      return {
        id: p.id,
        name: p.name,
        description: p.description,
        totalRows: p.totalRows,
        fieldCount: p.fieldCount,
        errorCount: p.errorCount,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        status: p.status,
        importStatus: p.importLogs[0]?.status ?? "COMPLETED",
        userRole: (p.programMembers[0]?.role ?? "VERIFIER") as "ADMIN" | "VERIFIER",
        verifiedCount: s.verified,
        rejectedCount: s.rejected,
        pendingCount: pending,
      };
    });

    // ─── 4. Global stats ─────────────────────────────────────────────────────
    const totalParticipants = formattedPrograms.reduce((acc, p) => acc + p.totalRows, 0);
    const totalVerified = formattedPrograms.reduce((acc, p) => acc + p.verifiedCount, 0);
    const totalRejected = formattedPrograms.reduce((acc, p) => acc + p.rejectedCount, 0);
    const totalPending = formattedPrograms.reduce((acc, p) => acc + p.pendingCount, 0);
    const activePrograms = formattedPrograms.filter((p) => p.status === "ACTIVE").length;

    const globalStats = {
      totalParticipants,
      totalVerified,
      totalRejected,
      totalPending,
      activePrograms,
    };

    // ─── 5. Aktivitas terbaru (10 item) lintas semua program ─────────────────
    const activityLogs = await db.activityLog.findMany({
      where: { programId: { in: programIds } },
      select: {
        id: true,
        action: true,
        details: true,
        createdAt: true,
        program: { select: { name: true } },
        user: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const recentActivity = activityLogs.map((log) => ({
      id: log.id,
      action: log.action,
      details: log.details,
      programName: log.program.name,
      userName: log.user.name,
      createdAt: log.createdAt,
    }));

    return NextResponse.json({
      globalStats,
      programs: formattedPrograms,
      recentActivity,
    });
  } catch (error) {
    console.error("GET /api/dashboard error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
