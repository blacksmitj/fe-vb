import { db } from "@/lib/db";
import { getSessionUser, assertProgramAdmin, assertProgramMember } from "@/lib/program-auth";
import { NextResponse } from "next/server";
import { ProgramRole, MemberStatus } from "@prisma/client";

/**
 * GET /api/programs/[id]/members
 * List all members of a program (Accessible to any approved Program Member)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: programId } = await params;
    await assertProgramMember(programId);

    const members = await db.programMember.findMany({
      where: { programId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(members);
  } catch (error: any) {
    console.error("GET /api/programs/[id]/members error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch members" }, { status: 500 });
  }
}

/**
 * POST /api/programs/[id]/members
 * Request join a program as a verifier (authenticated user)
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: programId } = await params;
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if already a member
    const existingMember = await db.programMember.findUnique({
      where: {
        programId_userId: {
          programId,
          userId: user.id,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: `Already member with status: ${existingMember.status}` },
        { status: 400 }
      );
    }

    // Create program member as pending verifier
    const member = await db.programMember.create({
      data: {
        programId,
        userId: user.id,
        role: ProgramRole.VERIFIER,
        status: MemberStatus.PENDING,
      },
    });

    return NextResponse.json(member);
  } catch (error: any) {
    console.error("POST /api/programs/[id]/members error:", error);
    return NextResponse.json({ error: error.message || "Failed to join program" }, { status: 500 });
  }
}
