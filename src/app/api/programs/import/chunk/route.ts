import { db } from "@/lib/db";
import { auth } from "@/lib/auth/auth";
import { headers as getHeaders } from "next/headers";
import { NextResponse } from "next/server";

function buildSearchText(data: Record<string, any>): string {
  return Object.values(data)
    .filter((v) => v != null && v !== "")
    .map((v) => String(v))
    .join(" ");
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await getHeaders(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { programId, rows, headers, uniqueKeyColumn, startRowIndex } = await req.json();

    if (!programId || !rows || !headers || !uniqueKeyColumn) {
      return NextResponse.json({ error: "Parameter tidak lengkap." }, { status: 400 });
    }

    const participantRecords = rows.map((row: any, idx: number) => {
      const { [uniqueKeyColumn]: uniqueKeyValue, __sheetRowIndex, ...rest } = row;
      const rowIndex = typeof startRowIndex === "number" ? startRowIndex + idx : idx;
      return {
        programId,
        rowIndex,
        uniqueKey: String(uniqueKeyValue ?? "").trim(),
        data: rest as any,
        searchText: buildSearchText(rest),
      };
    });

    await db.participant.createMany({
      data: participantRecords,
    });

    return NextResponse.json({ success: true, count: rows.length });
  } catch (error: any) {
    console.error("POST /api/programs/import/chunk error:", error);
    return NextResponse.json({ error: error.message || "Gagal meng-import chunk data." }, { status: 500 });
  }
}
