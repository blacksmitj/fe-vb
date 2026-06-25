import { db } from "@/lib/db";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const program = await db.program.findUnique({
      where: { id },
      select: {
        sheetId: true,
        sheetName: true,
        sheetUniqueKey: true,
        sheetEvalStatusCol: true,
        sheetEvalDescCol: true,
        sheetLastSyncAt: true,
      },
    });

    if (!program) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    return NextResponse.json(program);
  } catch (error) {
    console.error("GET program sheet config error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const {
    sheetId,
    sheetName,
    sheetUniqueKey,
    sheetEvalStatusCol,
    sheetEvalDescCol,
  } = body;

  try {
    const updated = await db.program.update({
      where: { id },
      data: {
        sheetId: sheetId || null,
        sheetName: sheetName || null,
        sheetUniqueKey: sheetUniqueKey || null,
        sheetEvalStatusCol: sheetEvalStatusCol || null,
        sheetEvalDescCol: sheetEvalDescCol || null,
      },
    });

    return NextResponse.json({ success: true, program: updated });
  } catch (error) {
    console.error("PATCH program sheet config error:", error);
    return NextResponse.json({ error: "Failed to update config" }, { status: 500 });
  }
}
