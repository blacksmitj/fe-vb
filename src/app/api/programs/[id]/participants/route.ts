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
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    
    // Check if it's a search query
    const searchQuery = searchParams.get("search");
    
    if (searchQuery !== null) {
      const query = searchQuery.trim();
      if (!query) {
        return NextResponse.json({ matches: [] });
      }

      // Fast Trigram ILIKE Search using GIN index on searchText
      const matchesRaw = await db.participant.findMany({
        where: {
          programId: id,
          searchText: {
            contains: query,
            mode: "insensitive",
          },
        },
        select: {
          id: true,
          rowIndex: true,
          uniqueKey: true,
          data: true,
          evalStatus: true,
        },
        orderBy: {
          rowIndex: "asc",
        },
        take: 100,
      });

      const matches = matchesRaw.map((m) => ({
        globalIndex: m.rowIndex,
        row: {
          id: m.id,
          uniqueKey: m.uniqueKey,
          _evaluationStatus: m.evalStatus,
          ...(m.data as Record<string, any>),
        },
      }));

      return NextResponse.json({ matches });
    }

    const pageParam = searchParams.get("page");
    const page = pageParam ? parseInt(pageParam, 10) : 0;

    if (isNaN(page) || page < 0) {
      return NextResponse.json({ error: "Invalid page parameter" }, { status: 400 });
    }

    // Get 1 participant by rowIndex (0-based)
    const participantRecord = await db.participant.findFirst({
      where: {
        programId: id,
        rowIndex: page,
      },
      select: {
        id: true,
        rowIndex: true,
        uniqueKey: true,
        data: true,
        evalStatus: true,
        evalDescription: true,
        evalByUserId: true,
        evalByUserName: true,
        evalAt: true,
      },
    });

    const participant = participantRecord
      ? {
          id: participantRecord.id,
          uniqueKey: participantRecord.uniqueKey,
          _evaluationStatus: participantRecord.evalStatus,
          _evaluationDescription: participantRecord.evalDescription,
          _verifiedByName: participantRecord.evalByUserName,
          _verifiedByUserId: participantRecord.evalByUserId,
          _evaluatedAt: participantRecord.evalAt ? participantRecord.evalAt.toISOString() : null,
          ...(participantRecord.data as Record<string, any>),
        }
      : null;

    // Get total rows count from the program
    const program = await db.program.findUnique({
      where: { id },
      select: { totalRows: true },
    });

    return NextResponse.json({ 
      participant,
      totalRows: program?.totalRows ?? 0
    });
  } catch (error) {
    console.error("GET /api/programs/[id]/participants error:", error);
    return NextResponse.json({ error: "Failed to fetch participant" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({
    headers: await getHeaders(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id: programId } = await params;

    // Check program status and membership role first
    const [program, member] = await Promise.all([
      db.program.findUnique({
        where: { id: programId },
        select: { status: true },
      }),
      db.programMember.findUnique({
        where: {
          programId_userId: {
            programId,
            userId: session.user.id,
          },
        },
      }),
    ]);

    if (!program) {
      return NextResponse.json({ error: "Program tidak ditemukan" }, { status: 404 });
    }

    if (!member || member.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Anda bukan anggota program ini atau pendaftaran Anda belum disetujui." },
        { status: 403 }
      );
    }

    if (program.status === "STOPPED") {
      return NextResponse.json(
        { error: "Verifikasi untuk program ini telah ditangguhkan/ditutup oleh Admin." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    
    // We support updating by direct participantId or fallback by page (rowIndex)
    const participantIdParam = searchParams.get("participantId");
    const pageParam = searchParams.get("page");
    const page = pageParam ? parseInt(pageParam, 10) : 0;

    const { status, description, participant: updatedFields } = await req.json();

    let targetParticipant = null;

    if (participantIdParam) {
      targetParticipant = await db.participant.findUnique({
        where: { id: participantIdParam },
      });
    } else {
      targetParticipant = await db.participant.findFirst({
        where: { programId, rowIndex: page },
      });
    }

    if (!targetParticipant) {
      return NextResponse.json({ error: "Participant data not found" }, { status: 404 });
    }

    const isUnverif = status === null || status === "UNVERIFIED";

    // Validate authorization for Unverif
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

    // Filter out internal application properties if present
    const cleanFields = { ...(updatedFields || {}) };
    delete cleanFields.id;
    delete cleanFields.uniqueKey;
    delete cleanFields._evaluationStatus;
    delete cleanFields._evaluationDescription;
    delete cleanFields._verifiedByName;
    delete cleanFields._verifiedByUserId;
    delete cleanFields._evaluatedAt;

    const mergedData = {
      ...(targetParticipant.data as Record<string, any>),
      ...cleanFields,
    };

    // Save back to db in-place
    const updated = await db.participant.update({
      where: { id: targetParticipant.id },
      data: {
        data: mergedData,
        evalStatus: isUnverif ? null : (status || "VERIFIED"),
        evalDescription: isUnverif ? null : (description || ""),
        evalByUserId: isUnverif ? null : session.user.id,
        evalByUserName: isUnverif ? null : (session.user.name || session.user.email),
        evalAt: isUnverif ? null : new Date(),
        searchText: buildSearchText(mergedData),
      },
    });

    const responseParticipant = {
      id: updated.id,
      uniqueKey: updated.uniqueKey,
      _evaluationStatus: updated.evalStatus,
      _evaluationDescription: updated.evalDescription,
      _verifiedByName: updated.evalByUserName,
      _verifiedByUserId: updated.evalByUserId,
      _evaluatedAt: updated.evalAt ? updated.evalAt.toISOString() : null,
      ...(updated.data as Record<string, any>),
    };

    // Create activity log
    try {
      const details = isUnverif
        ? `Membatalkan verifikasi data peserta (ID: ${updated.uniqueKey}).`
        : `Memverifikasi data peserta (ID: ${updated.uniqueKey}).${description ? ` Catatan: ${description}` : ""}`;

      await db.activityLog.create({
        data: {
          programId,
          userId: session.user.id,
          action: isUnverif ? "UNVERIFIED" : "VERIFIED",
          details,
        },
      });
    } catch (logError) {
      console.error("Failed to write activity log:", logError);
    }

    return NextResponse.json({ success: true, participant: responseParticipant });
  } catch (error) {
    console.error("PATCH /api/programs/[id]/participants error:", error);
    return NextResponse.json({ error: "Failed to save evaluation" }, { status: 500 });
  }
}
