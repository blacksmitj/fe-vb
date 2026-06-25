import { db } from "@/lib/db";
import { assertProgramAdmin } from "@/lib/program-auth";
import { NextResponse } from "next/server";
import { MemberStatus, ProgramRole } from "@prisma/client";

/**
 * PATCH /api/programs/[id]/members/[memberId]
 * Update member role or status (Approve/Reject) — Admin Only
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { id: programId, memberId } = await params;
    await assertProgramAdmin(programId);

    const { status, role } = await request.json();

    const data: any = {};
    if (status && Object.values(MemberStatus).includes(status)) {
      data.status = status;
    }
    if (role && Object.values(ProgramRole).includes(role)) {
      data.role = role;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const updatedMember = await db.programMember.update({
      where: {
        id: memberId,
        programId, // Safety lock to ensure we only update within this program
      },
      data,
    });

    return NextResponse.json(updatedMember);
  } catch (error: any) {
    console.error("PATCH member error:", error);
    return NextResponse.json({ error: error.message || "Failed to update member" }, { status: 500 });
  }
}

/**
 * DELETE /api/programs/[id]/members/[memberId]
 * Remove member from program — Admin Only
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { id: programId, memberId } = await params;
    await assertProgramAdmin(programId);

    await db.programMember.delete({
      where: {
        id: memberId,
        programId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE member error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete member" }, { status: 500 });
  }
}
