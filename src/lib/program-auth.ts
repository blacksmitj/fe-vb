import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { ProgramRole } from "@prisma/client";

/**
 * Mendapatkan session user yang sedang login dari request headers.
 */
export async function getSessionUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session?.user ?? null;
}

/**
 * Memastikan user adalah ADMIN dari suatu Program.
 * Jika tidak berhak, melempar error dengan status code atau mengembalikan null.
 */
export async function assertProgramAdmin(programId: string) {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("Unauthorized: Please sign in first");
  }

  const member = await db.programMember.findUnique({
    where: {
      programId_userId: {
        programId,
        userId: user.id,
      },
    },
  });

  if (!member || member.role !== ProgramRole.ADMIN || member.status !== "APPROVED") {
    throw new Error("Forbidden: Only program admins can perform this action");
  }

  return user;
}

/**
 * Memastikan user adalah MEMBER (ADMIN / VERIFIER) dari suatu Program dengan status APPROVED.
 */
export async function assertProgramMember(programId: string) {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("Unauthorized: Please sign in first");
  }

  const member = await db.programMember.findUnique({
    where: {
      programId_userId: {
        programId,
        userId: user.id,
      },
    },
  });

  if (!member || member.status !== "APPROVED") {
    throw new Error("Forbidden: You do not have access to this program");
  }

  return { user, member };
}
