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

    const programs = await db.program.findMany({
      where: {
        programMembers: {
          some: {
            userId: session.user.id,
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
          select: {
            status: true,
          },
          orderBy: {
            importedAt: "desc",
          },
          take: 1,
        },
        programMembers: {
          where: {
            userId: session.user.id,
          },
          select: {
            role: true,
          },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const programIds = programs.map((p) => p.id);
    const evalStats = await db.participant.groupBy({
      by: ["programId", "evalStatus"],
      where: {
        programId: { in: programIds },
      },
      _count: {
        id: true,
      },
    });

    const statsMap: Record<string, { verified: number; rejected: number }> = {};
    programIds.forEach(id => {
      statsMap[id] = { verified: 0, rejected: 0 };
    });

    evalStats.forEach(stat => {
      const progStats = statsMap[stat.programId];
      if (progStats) {
        if (stat.evalStatus === "VERIFIED") {
          progStats.verified = stat._count.id;
        } else if (stat.evalStatus === "REJECTED") {
          progStats.rejected = stat._count.id;
        }
      }
    });

    const formattedPrograms = programs.map((p) => {
      const progStats = statsMap[p.id] || { verified: 0, rejected: 0 };
      const pending = Math.max(0, p.totalRows - progStats.verified - progStats.rejected);
      return {
        id: p.id,
        name: p.name,
        description: p.description,
        totalRows: p.totalRows,
        fieldCount: p.fieldCount,
        errorCount: p.errorCount,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        importStatus: p.importLogs[0]?.status || "COMPLETED",
        userRole: (p.programMembers[0]?.role ?? "VERIFIER") as "ADMIN" | "VERIFIER",
        verifiedCount: progStats.verified,
        rejectedCount: progStats.rejected,
        pendingCount: pending,
        status: p.status,
      };
    });

    return NextResponse.json(formattedPrograms);
  } catch (error) {
    console.error("GET /api/programs error:", error);
    return NextResponse.json({ error: "Failed to fetch programs" }, { status: 500 });
  }
}

