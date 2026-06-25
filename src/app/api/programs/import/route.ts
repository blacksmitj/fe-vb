import { db } from "@/lib/db";
import { auth } from "@/lib/auth/auth";
import { pullFromSheet } from "@/lib/sync-service";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, description, sheetId, sheetName, sheetUniqueKey, sheetEvalStatusCol, sheetEvalDescCol } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "Nama program wajib diisi." }, { status: 400 });
    }
    if (!sheetId || !sheetName || !sheetUniqueKey) {
      return NextResponse.json({ error: "Google Sheet ID, Nama Tab, dan Kolom ID Unik wajib diisi." }, { status: 400 });
    }

    // 1. Create Program
    const program = await db.program.create({
      data: {
        name,
        description: description || "",
        sheetId,
        sheetName,
        sheetUniqueKey,
        sheetEvalStatusCol: sheetEvalStatusCol || null,
        sheetEvalDescCol: sheetEvalDescCol || null,
      },
    });

    // 2. Perform the initial pull from Sheet
    const syncResult = await pullFromSheet(program.id, session.user.id);

    if (!syncResult.success) {
      // Delete the program if the initial sync fails so we don't leave orphaned programs
      await db.program.delete({ where: { id: program.id } });
      return NextResponse.json({ error: syncResult.error || "Gagal melakukan sinkronisasi pertama." }, { status: 400 });
    }

    return NextResponse.json(program);
  } catch (error) {
    console.error("POST /api/programs/import error:", error);
    return NextResponse.json({ error: "Gagal menghubungkan Google Sheet program." }, { status: 500 });
  }
}

