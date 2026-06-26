import { db } from "@/lib/db";
import { auth } from "@/lib/auth/auth";
import { headers as getHeaders } from "next/headers";
import { NextResponse } from "next/server";

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
    const { header } = await req.json();

    if (!header || typeof header !== "string" || header.trim() === "") {
      return NextResponse.json({ error: "Header name is required" }, { status: 400 });
    }

    const cleanHeader = header.trim();

    // Check if program exists
    const program = await db.program.findUnique({
      where: { id },
    });

    if (!program) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    // Find all participant data batches
    const batches = await db.participantData.findMany({
      where: { programId: id },
      select: {
        id: true,
        headers: true,
        batchIndex: true,
      },
    });

    if (batches.length === 0) {
      // Create a default batch index 0 if no participant data exists yet
      await db.participantData.create({
        data: {
          programId: id,
          batchIndex: 0,
          headers: [cleanHeader],
          rows: [],
        },
      });
      return NextResponse.json({ success: true, headers: [cleanHeader] });
    }

    let updatedHeaders: string[] = [];

    // Update headers in all batches
    for (const batch of batches) {
      const currentHeaders = (batch.headers as string[]) || [];
      if (!currentHeaders.map(h => h.toLowerCase()).includes(cleanHeader.toLowerCase())) {
        const nextHeaders = [...currentHeaders, cleanHeader];
        await db.participantData.update({
          where: { id: batch.id },
          data: { headers: nextHeaders },
        });
        if (batch.batchIndex === 0) {
          updatedHeaders = nextHeaders;
        }
      } else {
        if (batch.batchIndex === 0) {
          updatedHeaders = currentHeaders;
        }
      }
    }

    return NextResponse.json({ success: true, headers: updatedHeaders });
  } catch (error) {
    console.error("POST /api/programs/[id]/headers error:", error);
    return NextResponse.json({ error: "Failed to add header" }, { status: 500 });
  }
}
