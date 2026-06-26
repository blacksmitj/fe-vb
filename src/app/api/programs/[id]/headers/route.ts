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

    // Find first participant to check current headers
    const firstParticipant = await db.participant.findFirst({
      where: { programId: id },
      select: { headers: true },
    });

    let updatedHeaders: string[] = [cleanHeader];

    if (firstParticipant) {
      const currentHeaders = (firstParticipant.headers as string[]) || [];
      if (!currentHeaders.map(h => h.toLowerCase()).includes(cleanHeader.toLowerCase())) {
        updatedHeaders = [...currentHeaders, cleanHeader];
        await db.participant.updateMany({
          where: { programId: id },
          data: { headers: updatedHeaders },
        });
      } else {
        updatedHeaders = currentHeaders;
      }
    }

    return NextResponse.json({ success: true, headers: updatedHeaders });
  } catch (error) {
    console.error("POST /api/programs/[id]/headers error:", error);
    return NextResponse.json({ error: "Failed to add header" }, { status: 500 });
  }
}
