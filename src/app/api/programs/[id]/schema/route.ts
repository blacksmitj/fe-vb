import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const schema = await db.profileSchema.findUnique({
      where: { programId: id },
    });

    if (!schema) {
      return NextResponse.json({ sections: [], version: 0 });
    }

    return NextResponse.json(schema);
  } catch (error) {
    console.error("GET /api/programs/[id]/schema error:", error);
    return NextResponse.json({ error: "Failed to fetch schema" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { sections } = await req.json();

    const updated = await db.profileSchema.upsert({
      where: { programId: id },
      create: {
        programId: id,
        sections: sections || [],
        version: 1,
      },
      update: {
        sections: sections || [],
        version: { increment: 1 }, // naik monoton setiap save
      },
      select: { version: true },
    });

    return NextResponse.json({ version: updated.version });
  } catch (error) {
    console.error("PATCH /api/programs/[id]/schema error:", error);
    return NextResponse.json({ error: "Failed to update schema" }, { status: 500 });
  }
}
