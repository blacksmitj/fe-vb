import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const programs = await db.program.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        totalRows: true,
        fieldCount: true,
        errorCount: true,
        createdAt: true,
        updatedAt: true,
        importLogs: {
          select: {
            status: true,
          },
          orderBy: {
            importedAt: "desc",
          },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedPrograms = programs.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      totalRows: p.totalRows,
      fieldCount: p.fieldCount,
      errorCount: p.errorCount,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      status: p.importLogs[0]?.status || "COMPLETED",
    }));

    return NextResponse.json(formattedPrograms);
  } catch (error) {
    console.error("GET /api/programs error:", error);
    return NextResponse.json({ error: "Failed to fetch programs" }, { status: 500 });
  }
}

