import { db } from "@/lib/db";
import { auth } from "@/lib/auth/auth";
import { headers as getHeaders } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const program = await db.program.findUnique({
      where: { id },
      include: {
        profileSchema: true,
        profileTemplate: true,
      }
    });

    if (!program) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const includePreview = searchParams.get("preview") === "true";

    let headers: string[] = program.headers;
    let data: Record<string, any>[] = [];

    if (includePreview) {
      // Fetch first 10 rows for preview
      const previewRows = await db.participant.findMany({
        where: { programId: id },
        orderBy: { rowIndex: "asc" },
        take: 10,
        select: { data: true },
      });
        
      data = previewRows.map(p => (p.data as Record<string, any>) || {});
    }

    // Fetch evaluation statistics
    const stats = await db.participant.groupBy({
      by: ["evalStatus"],
      where: { programId: id },
      _count: { id: true },
    });

    let verifiedCount = 0;
    let rejectedCount = 0;

    stats.forEach(stat => {
      if (stat.evalStatus === "VERIFIED") {
        verifiedCount = stat._count.id;
      } else if (stat.evalStatus === "REJECTED") {
        rejectedCount = stat._count.id;
      }
    });

    const pendingCount = Math.max(0, program.totalRows - verifiedCount - rejectedCount);

    return NextResponse.json({
      id: program.id,
      name: program.name,
      description: program.description,
      totalRows: program.totalRows,
      fieldCount: program.fieldCount,
      errorCount: program.errorCount,
      createdAt: program.createdAt.toISOString(),
      updatedAt: program.updatedAt.toISOString(),
      headers,
      data,
      profileSchema: program.profileTemplate?.sections ?? program.profileSchema?.sections ?? [],
      profileTemplateId: program.profileTemplateId,
      verifiedCount,
      rejectedCount,
      pendingCount,
      status: program.status,
    });
  } catch (error) {
    console.error("GET /api/programs/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch program" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
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

    const { status, name, description, profileTemplateId } = await request.json();

    const dataToUpdate: any = {};
    if (status !== undefined) dataToUpdate.status = status;
    if (name !== undefined) dataToUpdate.name = name;
    if (description !== undefined) dataToUpdate.description = description;
    if (profileTemplateId !== undefined) dataToUpdate.profileTemplateId = profileTemplateId;

    const updated = await db.program.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/programs/[id] error:", error);
    return NextResponse.json({ error: "Failed to update program" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
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

    await db.program.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/programs/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete program" }, { status: 500 });
  }
}

