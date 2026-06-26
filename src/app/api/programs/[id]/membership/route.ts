import { db } from "@/lib/db";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

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

  try {
    const member = await db.programMember.findUnique({
      where: {
        programId_userId: {
          programId,
          userId: session.user.id,
        },
      },
    });

    if (!member) {
      return NextResponse.json({ role: null, status: null });
    }

    return NextResponse.json({
      role: member.role,
      status: member.status,
    });
  } catch (error) {
    console.error("GET membership error:", error);
    return NextResponse.json({ error: "Failed to fetch membership status" }, { status: 500 });
  }
}
