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

    // Extract unique labels/headers from layout sections
    const layoutHeaders: string[] = [];
    if (sections && Array.isArray(sections)) {
      sections.forEach((sec: any) => {
        if (sec.fields && Array.isArray(sec.fields)) {
          sec.fields.forEach((f: any) => {
            if (f.label && typeof f.label === "string") {
              const cleanLabel = f.label.trim();
              if (cleanLabel && !layoutHeaders.includes(cleanLabel)) {
                layoutHeaders.push(cleanLabel);
              }
            }
          });
        }
      });
    }

    // Upsert the profile schema
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

    // Synchronize layout headers to ParticipantData headers
    if (layoutHeaders.length > 0) {
      const batches = await db.participantData.findMany({
        where: { programId: id },
        select: {
          id: true,
          headers: true,
        },
      });

      if (batches.length > 0) {
        for (const batch of batches) {
          const currentHeaders = (batch.headers as string[]) || [];
          const missingHeaders = layoutHeaders.filter(
            (lh) => !currentHeaders.map((ch) => ch.toLowerCase()).includes(lh.toLowerCase())
          );

          if (missingHeaders.length > 0) {
            const nextHeaders = [...currentHeaders, ...missingHeaders];
            await db.participantData.update({
              where: { id: batch.id },
              data: { headers: nextHeaders },
            });
          }
        }
      } else {
        // If there are no participant data batches yet, initialize batch 0
        await db.participantData.create({
          data: {
            programId: id,
            batchIndex: 0,
            headers: layoutHeaders,
            rows: [],
          },
        });
      }
    }

    return NextResponse.json({ version: updated.version });
  } catch (error) {
    console.error("PATCH /api/programs/[id]/schema error:", error);
    return NextResponse.json({ error: "Failed to update schema" }, { status: 500 });
  }
}

