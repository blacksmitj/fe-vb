import { verifyProgramAccess } from "@/lib/auth/program-auth";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: programId } = await params;
    const { session, membership } = await verifyProgramAccess(programId);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!membership) {
      return NextResponse.json({ role: null, status: null });
    }

    return NextResponse.json({
      role: membership.role,
      status: membership.status,
    });
  } catch (error) {
    console.error("GET membership error:", error);
    return NextResponse.json({ error: "Failed to fetch membership status" }, { status: 500 });
  }
}
