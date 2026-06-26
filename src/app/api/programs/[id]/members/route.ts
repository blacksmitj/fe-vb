import { db } from "@/lib/db";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

// Helper to check if logged-in user is ADMIN of the program
async function isAdmin(userId: string, programId: string): Promise<boolean> {
  const member = await db.programMember.findUnique({
    where: {
      programId_userId: {
        programId,
        userId,
      },
    },
  });
  return member?.role === "ADMIN" && member?.status === "APPROVED";
}

// GET: Get all members of a program (Admin only)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: programId } = await params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userIsAdmin = await isAdmin(session.user.id, programId);
  if (!userIsAdmin) {
    return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
  }

  try {
    const members = await db.programMember.findMany({
      where: { programId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error("GET members error:", error);
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }
}

// POST: Join a program as a verifier (Pending approval)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: programId } = await params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check if already a member
    const existing = await db.programMember.findUnique({
      where: {
        programId_userId: {
          programId,
          userId: session.user.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: "Already registered/requested" }, { status: 400 });
    }

    const member = await db.programMember.create({
      data: {
        programId,
        userId: session.user.id,
        role: "VERIFIER",
        status: "PENDING",
      },
    });

    return NextResponse.json(member);
  } catch (error) {
    console.error("POST join member error:", error);
    return NextResponse.json({ error: "Failed to join program" }, { status: 500 });
  }
}

// PATCH: Approve or Reject a member (Admin only)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: programId } = await params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userIsAdmin = await isAdmin(session.user.id, programId);
  if (!userIsAdmin) {
    return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
  }

  try {
    const { memberId, status } = await req.json();

    if (!memberId || !["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status or member ID" }, { status: 400 });
    }

    // Check if target member exists and belongs to this program
    const targetMember = await db.programMember.findUnique({
      where: { id: memberId },
    });

    if (!targetMember || targetMember.programId !== programId) {
      return NextResponse.json({ error: "Member not found in this program" }, { status: 404 });
    }

    // Do not allow self-modifying admin status
    if (targetMember.userId === session.user.id) {
      return NextResponse.json({ error: "Cannot modify your own membership status" }, { status: 400 });
    }

    const updated = await db.programMember.update({
      where: { id: memberId },
      data: { status },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH member status error:", error);
    return NextResponse.json({ error: "Failed to update member status" }, { status: 500 });
  }
}
