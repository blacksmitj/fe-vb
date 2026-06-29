import { db } from "@/lib/db";
import { auth } from "@/lib/auth/auth";
import { headers as getHeaders } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await getHeaders(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if the user is an APPROVED member of the program
    const membership = await db.programMember.findUnique({
      where: {
        programId_userId: {
          programId: id,
          userId: session.user.id,
        },
      },
    });

    if (!membership || membership.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Forbidden: Hanya anggota program yang disetujui." },
        { status: 403 }
      );
    }
    
    const program = await db.program.findUnique({
      where: { id },
      select: {
        profileTemplate: {
          select: {
            sections: true,
            version: true,
          },
        },
      }
    });

    if (program?.profileTemplate) {
      return NextResponse.json({
        sections: program.profileTemplate.sections,
        version: program.profileTemplate.version,
      });
    }

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
    const session = await auth.api.getSession({
      headers: await getHeaders(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if the user is an APPROVED ADMIN of the program
    const membership = await db.programMember.findUnique({
      where: {
        programId_userId: {
          programId: id,
          userId: session.user.id,
        },
      },
    });

    if (!membership || membership.role !== "ADMIN" || membership.status !== "APPROVED") {
      return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
    }

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

    // Synchronize layout headers to Program headers
    if (layoutHeaders.length > 0) {
      const program = await db.program.findUnique({
        where: { id },
        select: { headers: true },
      });

      if (program) {
        const currentHeaders = program.headers || [];
        const missingHeaders = layoutHeaders.filter(
          (lh) => !currentHeaders.map((ch) => ch.toLowerCase()).includes(lh.toLowerCase())
        );

        if (missingHeaders.length > 0) {
          const nextHeaders = [...currentHeaders, ...missingHeaders];
          await db.program.update({
            where: { id },
            data: { headers: nextHeaders },
          });
        }
      }
    }

    return NextResponse.json({ version: updated.version });
  } catch (error) {
    console.error("PATCH /api/programs/[id]/schema error:", error);
    return NextResponse.json({ error: "Failed to update schema" }, { status: 500 });
  }
}

