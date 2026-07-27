import { db } from "@/lib/db";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";

export interface ProgramAuthResult {
  session: any;
  membership: {
    role: string | null;
    status: string | null;
  } | null;
  isApproved: boolean;
  isAdmin: boolean;
}

export async function verifyProgramAccess(programId: string): Promise<ProgramAuthResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return {
      session: null,
      membership: null,
      isApproved: false,
      isAdmin: false,
    };
  }

  const member = await db.programMember.findUnique({
    where: {
      programId_userId: {
        programId,
        userId: session.user.id,
      },
    },
    select: {
      role: true,
      status: true,
    },
  });

  const isApproved = member?.status === "APPROVED";
  const isAdmin = member?.role === "ADMIN";

  return {
    session,
    membership: member ? { role: member.role, status: member.status } : null,
    isApproved,
    isAdmin,
  };
}
