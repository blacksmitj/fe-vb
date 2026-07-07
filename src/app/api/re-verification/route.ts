import { db } from "@/lib/db";
import { auth } from "@/lib/auth/auth";
import { headers as getHeaders } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await getHeaders(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filterProgramId = searchParams.get("programId");

    // Fetch active programs where user is an approved member
    const programMemberships = await db.programMember.findMany({
      where: {
        userId: session.user.id,
        status: "APPROVED",
        program: {
          status: "ACTIVE",
          ...(filterProgramId ? { id: filterProgramId } : {}),
        },
      },
      select: {
        programId: true,
        role: true,
        program: {
          select: {
            name: true,
            uniqueKeyColumn: true,
          },
        },
      },
    });

    if (programMemberships.length === 0) {
      const countOnly = searchParams.get("countOnly") === "true";
      if (countOnly) {
        return NextResponse.json({ count: 0 });
      }
      return NextResponse.json({ participants: [] });
    }

    const countOnly = searchParams.get("countOnly") === "true";
    if (countOnly) {
      const countOrConditions = programMemberships.map((membership) => {
        if (membership.role === "ADMIN") {
          return {
            programId: membership.programId,
            evalStatus: { in: ["VERIFIED", "REJECTED", "REVERIFICATION"] as any },
          };
        } else {
          return {
            programId: membership.programId,
            evalStatus: { in: ["VERIFIED", "REJECTED", "REVERIFICATION"] as any },
            evalByUserId: session.user.id,
          };
        }
      });

      const count = await db.participant.count({
        where: {
          OR: countOrConditions,
        },
      });

      return NextResponse.json({ count });
    }

    // Map memberships for quick lookup of roles and program details
    const membershipMap = new Map(
      programMemberships.map((m) => [
        m.programId,
        { role: m.role, name: m.program.name, uniqueKeyColumn: m.program.uniqueKeyColumn },
      ])
    );

    // Build the query where clause
    // We want participants with evalStatus set (VERIFIED or REJECTED)
    // For ADMIN role in a program, we fetch all. For VERIFIER role, only their own evaluations.
    const orConditions = programMemberships.map((membership) => {
      if (membership.role === "ADMIN") {
        return {
          programId: membership.programId,
          evalStatus: { in: ["VERIFIED", "REJECTED", "REVERIFICATION"] as any },
        };
      } else {
        return {
          programId: membership.programId,
          evalStatus: { in: ["VERIFIED", "REJECTED", "REVERIFICATION"] as any },
          evalByUserId: session.user.id,
        };
      }
    });

    const participants = await db.participant.findMany({
      where: {
        OR: orConditions,
      },
      select: {
        id: true,
        programId: true,
        rowIndex: true,
        uniqueKey: true,
        data: true,
        evalStatus: true,
        evalDescription: true,
        evalByUserId: true,
        evalByUserName: true,
        evalAt: true,
      },
      orderBy: {
        evalAt: "desc",
      },
    });

    // Format the response, appending program name and key info
    const formattedParticipants = participants.map((p) => {
      const pm = membershipMap.get(p.programId);
      const participantData = (p.data as Record<string, any>) || {};
      
      // Attempt to extract name from data
      const name = 
        participantData["Nama"] || 
        participantData["Nama Lengkap"] || 
        participantData["Nama Peserta"] || 
        participantData["Name"] || 
        "";

      return {
        id: p.id,
        programId: p.programId,
        programName: pm?.name || "Program",
        uniqueKeyColumn: pm?.uniqueKeyColumn || "ID",
        rowIndex: p.rowIndex,
        uniqueKey: p.uniqueKey,
        name: String(name),
        evalStatus: p.evalStatus,
        evalDescription: p.evalDescription,
        evalByUserId: p.evalByUserId,
        evalByUserName: p.evalByUserName,
        evalAt: p.evalAt ? p.evalAt.toISOString() : null,
      };
    });

    return NextResponse.json({ participants: formattedParticipants });
  } catch (error) {
    console.error("GET /api/re-verification error:", error);
    return NextResponse.json({ error: "Failed to fetch re-verification participants" }, { status: 500 });
  }
}
