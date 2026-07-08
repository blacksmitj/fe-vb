import { db } from "@/lib/db";
import { auth } from "@/lib/auth/auth";
import { headers as getHeaders } from "next/headers";
import { NextResponse } from "next/server";

function buildSearchText(data: Record<string, any>): string {
  return Object.values(data)
    .filter((v) => v != null && v !== "")
    .map((v) => String(v))
    .join(" ");
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ participantId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await getHeaders(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { participantId } = await params;
    const { searchParams } = new URL(request.url);
    const filterProgramId = searchParams.get("programId");

    // Fetch participant
    const participant = await db.participant.findUnique({
      where: { id: participantId },
      include: {
        verificationHistories: {
          orderBy: { evalAt: "asc" },
        },
        program: {
          select: {
            name: true,
            status: true,
            uniqueKeyColumn: true,
            profileTemplate: {
              select: { sections: true },
            },
            profileSchema: {
              select: { sections: true },
            },
          },
        },
      },
    });

    if (!participant) {
      return NextResponse.json({ error: "Peserta tidak ditemukan" }, { status: 404 });
    }

    // Verify program membership
    const membership = await db.programMember.findUnique({
      where: {
        programId_userId: {
          programId: participant.programId,
          userId: session.user.id,
        },
      },
    });

    if (!membership || membership.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Forbidden: Anda tidak memiliki akses ke program ini." },
        { status: 403 }
      );
    }

    // Load schema
    let sections: any[] = [];
    if (participant.program.profileTemplate?.sections) {
      sections = participant.program.profileTemplate.sections as any[];
    } else if (participant.program.profileSchema?.sections) {
      sections = participant.program.profileSchema.sections as any[];
    }

    // Fetch program memberships for active programs
    const activeMemberships = await db.programMember.findMany({
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
      },
    });

    let prevId: string | null = null;
    let nextId: string | null = null;

    if (activeMemberships.length > 0) {
      // Build conditions to match the re-verification list filters
      const orConditions = activeMemberships.map((m) => {
        if (m.role === "ADMIN") {
          return {
            programId: m.programId,
            evalStatus: { in: ["VERIFIED", "REJECTED", "REVERIFICATION"] as any },
          };
        } else {
          return {
            programId: m.programId,
            evalStatus: { in: ["VERIFIED", "REJECTED", "REVERIFICATION"] as any },
            evalByUserId: session.user.id,
          };
        }
      });

      // Fetch all verified participant IDs in order
      const siblings = await db.participant.findMany({
        where: {
          OR: orConditions,
        },
        select: { id: true },
        orderBy: { evalAt: "desc" },
      });

      const currentIndex = siblings.findIndex((s) => s.id === participantId);
      if (currentIndex !== -1) {
        if (currentIndex > 0) {
          prevId = siblings[currentIndex - 1].id;
        }
        if (currentIndex < siblings.length - 1) {
          nextId = siblings[currentIndex + 1].id;
        }
      }
    }

    const histories = [...(participant.verificationHistories || [])];
    if (histories.length === 0 && participant.evalByUserId) {
      histories.push({
        id: "initial-legacy",
        participantId: participant.id,
        evalStatus: participant.evalStatus!,
        evalDescription: participant.evalDescription,
        evalByUserId: participant.evalByUserId,
        evalByUserName: participant.evalByUserName || "Sistem",
        evalAt: participant.evalAt || new Date(),
      });
    }

    const responseParticipant = {
      id: participant.id,
      programId: participant.programId,
      programName: participant.program.name,
      uniqueKeyColumn: participant.program.uniqueKeyColumn,
      uniqueKey: participant.uniqueKey,
      rowIndex: participant.rowIndex,
      _evaluationStatus: participant.evalStatus,
      _evaluationDescription: participant.evalDescription,
      _verifiedByName: participant.evalByUserName,
      _verifiedByUserId: participant.evalByUserId,
      _evaluatedAt: participant.evalAt ? participant.evalAt.toISOString() : null,
      _verificationHistories: histories,
      ...(participant.data as Record<string, any>),
    };

    return NextResponse.json({
      participant: responseParticipant,
      sections,
      prevId,
      nextId,
    });
  } catch (error) {
    console.error("GET /api/re-verification/[participantId] error:", error);
    return NextResponse.json({ error: "Failed to fetch participant detail" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ participantId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await getHeaders(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { participantId } = await params;
    const { status, description, participant: updatedFields } = await request.json();

    // Fetch participant
    const targetParticipant = await db.participant.findUnique({
      where: { id: participantId },
      include: {
        program: {
          select: {
            status: true,
            profileTemplate: {
              select: { sections: true },
            },
            profileSchema: {
              select: { sections: true },
            },
          },
        },
      },
    });

    if (!targetParticipant) {
      return NextResponse.json({ error: "Peserta tidak ditemukan" }, { status: 404 });
    }

    // Verify program membership and role
    const member = await db.programMember.findUnique({
      where: {
        programId_userId: {
          programId: targetParticipant.programId,
          userId: session.user.id,
        },
      },
    });

    if (!member || member.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Forbidden: Anda tidak memiliki akses ke program ini." },
        { status: 403 }
      );
    }

    if (targetParticipant.program.status === "STOPPED") {
      return NextResponse.json(
        { error: "Verifikasi untuk program ini telah ditangguhkan/ditutup oleh Admin." },
        { status: 403 }
      );
    }

    const isUnverif = status === null || status === "UNVERIFIED";

    // Validate authorization for Unverify
    if (isUnverif) {
      const isAdmin = member.role === "ADMIN";
      const isOriginalVerifier = targetParticipant.evalByUserId === session.user.id;

      if (!isAdmin && !isOriginalVerifier) {
        return NextResponse.json(
          { error: "Hanya Administrator atau Verifikator yang memverifikasi data ini yang dapat membatalkannya." },
          { status: 403 }
        );
      }
    }

    // Clean internal properties
    const cleanFields = { ...(updatedFields || {}) };
    delete cleanFields.id;
    delete cleanFields.uniqueKey;
    delete cleanFields._evaluationStatus;
    delete cleanFields._evaluationDescription;
    delete cleanFields._verifiedByName;
    delete cleanFields._verifiedByUserId;
    delete cleanFields._evaluatedAt;
    delete cleanFields._verificationHistories;

    const mergedData = {
      ...(targetParticipant.data as Record<string, any>),
      ...cleanFields,
    };

    // Save back to db in-place
    const updated = await db.participant.update({
      where: { id: participantId },
      data: {
        data: mergedData,
        evalStatus: isUnverif ? null : (status === "REVERIFICATION" ? "VERIFIED" : (status || "VERIFIED")),
        evalDescription: isUnverif ? null : (description || ""),
        evalByUserId: isUnverif ? null : session.user.id,
        evalByUserName: isUnverif ? null : (session.user.name || session.user.email),
        evalAt: isUnverif ? null : new Date(),
        searchText: buildSearchText(mergedData),
      },
    });

    if (isUnverif) {
      await db.verificationHistory.deleteMany({
        where: { participantId },
      });
    } else {
      await db.verificationHistory.create({
        data: {
          participantId: updated.id,
          evalStatus: updated.evalStatus!,
          evalDescription: updated.evalDescription,
          evalByUserId: session.user.id,
          evalByUserName: session.user.name || session.user.email,
          evalAt: updated.evalAt!,
        },
      });
    }

    const updatedHistories = await db.verificationHistory.findMany({
      where: { participantId: updated.id },
      orderBy: { evalAt: "asc" },
    });

    const responseParticipant = {
      id: updated.id,
      uniqueKey: updated.uniqueKey,
      _evaluationStatus: updated.evalStatus,
      _evaluationDescription: updated.evalDescription,
      _verifiedByName: updated.evalByUserName,
      _verifiedByUserId: updated.evalByUserId,
      _evaluatedAt: updated.evalAt ? updated.evalAt.toISOString() : null,
      _verificationHistories: updatedHistories,
      ...(updated.data as Record<string, any>),
    };

    // Create activity log
    try {
      let action = isUnverif ? "UNVERIFIED" : "RE_VERIFIED";
      let details = isUnverif
        ? `Membatalkan verifikasi data peserta (ID: ${updated.uniqueKey}) di Verifikasi Ulang.`
        : `Memverifikasi ulang data peserta (ID: ${updated.uniqueKey}).${description ? ` Catatan: ${description}` : ""}`;

      if (status === "REVERIFICATION") {
        action = "RE_VERIFIED";
        details = `Memverifikasi ulang data peserta (ID: ${updated.uniqueKey}).${description ? ` Catatan: ${description}` : ""}`;
      }

      await db.activityLog.create({
        data: {
          programId: targetParticipant.programId,
          userId: session.user.id,
          action,
          details,
        },
      });
    } catch (logError) {
      console.error("Failed to write activity log:", logError);
    }

    return NextResponse.json({ success: true, participant: responseParticipant });
  } catch (error) {
    console.error("PATCH /api/re-verification/[participantId] error:", error);
    return NextResponse.json({ error: "Failed to save evaluation" }, { status: 500 });
  }
}
