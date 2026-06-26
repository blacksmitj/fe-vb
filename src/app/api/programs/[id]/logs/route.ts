import { db } from "@/lib/db";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

// Helper to check if logged-in user is an approved member (ADMIN or VERIFIER) of the program
async function isApprovedMember(userId: string, programId: string): Promise<boolean> {
  const member = await db.programMember.findUnique({
    where: {
      programId_userId: {
        programId,
        userId,
      },
    },
  });
  return member?.status === "APPROVED";
}

// GET: Get activity logs for a program
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

  const isMember = await isApprovedMember(session.user.id, programId);
  if (!isMember) {
    return NextResponse.json({ error: "Forbidden: Program members only" }, { status: 403 });
  }

  try {
    const logs = await db.activityLog.findMany({
      where: { programId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error("GET logs error:", error);
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
  }
}
