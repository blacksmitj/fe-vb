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

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({
    headers: await getHeaders(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Validate ADMIN membership
    const membership = await db.programMember.findUnique({
      where: {
        programId_userId: {
          programId: id,
          userId: session.user.id,
        },
      },
    });

    if (!membership || membership.role !== "ADMIN" || membership.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Hanya Admin program yang diperbolehkan meng-reupload data." },
        { status: 403 }
      );
    }

    const { rows, headers, uniqueKeyColumn, startRowIndex } = await req.json();

    if (!rows || !headers || !uniqueKeyColumn) {
      return NextResponse.json({ error: "Parameter tidak lengkap." }, { status: 400 });
    }

    const participantRecords = rows.map((row: any, idx: number) => {
      const { [uniqueKeyColumn]: uniqueKeyValue, __sheetRowIndex, ...rest } = row;
      const rowIndex = typeof startRowIndex === "number" ? startRowIndex + idx : idx;
      const uniqueKeyValStr = String(uniqueKeyValue ?? "").trim();

      const combinedData = {
        ...rest,
        [uniqueKeyColumn]: uniqueKeyValStr,
      };

      return {
        programId: id,
        rowIndex,
        uniqueKey: uniqueKeyValStr,
        data: combinedData as any,
        searchText: buildSearchText(combinedData),
      };
    });

    await db.participant.createMany({
      data: participantRecords,
    });

    return NextResponse.json({ success: true, count: rows.length });
  } catch (error: any) {
    console.error("POST /api/programs/[id]/reupload/chunk error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal meng-insert chunk data reupload." },
      { status: 500 }
    );
  }
}
