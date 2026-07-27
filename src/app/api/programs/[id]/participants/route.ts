import { db } from "@/lib/db";
import { auth } from "@/lib/auth/auth";
import { headers as getHeaders } from "next/headers";
import { verifyProgramAccess } from "@/lib/auth/program-auth";
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
    const { session, isApproved } = await verifyProgramAccess(id);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isApproved) {
      return NextResponse.json(
        { error: "Forbidden: Hanya anggota program yang disetujui." },
        { status: 403 }
      );
    }

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

    // Get 1 participant by rowIndex and total rows count concurrently
    const [participantRecord, program] = await Promise.all([
      db.participant.findFirst({
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
          verificationHistories: {
            orderBy: { evalAt: "asc" },
            take: 20,
          },
        },
      }),
      db.program.findUnique({
        where: { id },
        select: { totalRows: true },
      }),
    ]);

    const histories = participantRecord ? [...(participantRecord.verificationHistories || [])] : [];
    if (participantRecord && histories.length === 0 && participantRecord.evalByUserId) {
      histories.push({
        id: "initial-legacy",
        participantId: participantRecord.id,
        evalStatus: participantRecord.evalStatus!,
        evalDescription: participantRecord.evalDescription,
        evalByUserId: participantRecord.evalByUserId,
        evalByUserName: participantRecord.evalByUserName || "Sistem",
        evalAt: participantRecord.evalAt || new Date(),
      });
    }

    const participant = participantRecord
      ? {
          id: participantRecord.id,
          uniqueKey: participantRecord.uniqueKey,
          _evaluationStatus: participantRecord.evalStatus,
          _evaluationDescription: participantRecord.evalDescription,
          _verifiedByName: participantRecord.evalByUserName,
          _verifiedByUserId: participantRecord.evalByUserId,
          _evaluatedAt: participantRecord.evalAt ? participantRecord.evalAt.toISOString() : null,
          _verificationHistories: histories,
          ...(participantRecord.data as Record<string, any>),
        }
      : null;

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
        select: { 
          status: true,
          profileTemplate: {
            select: { sections: true }
          },
          profileSchema: {
            select: { sections: true }
          }
        },
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

    // Server-side required field validation
    if (status === "VERIFIED") {
      let sections: any[] = [];
      if (program.profileTemplate && program.profileTemplate.sections) {
        sections = program.profileTemplate.sections as any[];
      } else if (program.profileSchema && program.profileSchema.sections) {
        sections = program.profileSchema.sections as any[];
      }

      if (sections && sections.length > 0) {
        const requiredFields: { label: string; type: string }[] = [];
        sections.forEach((section: any) => {
          if (section.fields && Array.isArray(section.fields)) {
            section.fields.forEach((field: any) => {
              if (field.isRequired && field.label) {
                requiredFields.push({ label: field.label, type: field.type });
              }
            });
          }
        });

        for (const reqField of requiredFields) {
          const val = mergedData[reqField.label];
          let isEmpty = val === undefined || val === null || (typeof val === "string" && val.trim() === "");
          
          // Required checkbox must be checked ("true")
          if (reqField.type === "checkbox" && val !== "true" && val !== true) {
            isEmpty = true;
          }

          // Required array-pills must not be empty or "[]"
          if (reqField.type === "array-pills") {
            const strVal = val !== undefined && val !== null ? String(val).trim() : "";
            if (strVal === "" || strVal === "[]") {
              isEmpty = true;
            } else if (strVal.startsWith("[") && strVal.endsWith("]")) {
              try {
                const parsed = JSON.parse(strVal);
                if (Array.isArray(parsed) && parsed.length === 0) {
                  isEmpty = true;
                }
              } catch (e) {}
            }
          }

          if (isEmpty) {
            return NextResponse.json(
              { error: `Kolom wajib '${reqField.label}' tidak boleh kosong.` },
              { status: 400 }
            );
          }
        }
      }
    }

    // Save back to db in-place
    const updated = await db.participant.update({
      where: { id: targetParticipant.id },
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
        where: { participantId: updated.id },
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
      let action = isUnverif ? "UNVERIFIED" : "VERIFIED";
      let details = isUnverif
        ? `Membatalkan verifikasi data peserta (ID: ${updated.uniqueKey}).`
        : `Memverifikasi data peserta (ID: ${updated.uniqueKey}).${description ? ` Catatan: ${description}` : ""}`;

      if (status === "REVERIFICATION") {
        action = "RE_VERIFIED";
        details = `Memverifikasi ulang data peserta (ID: ${updated.uniqueKey}).${description ? ` Catatan: ${description}` : ""}`;
      }

      await db.activityLog.create({
        data: {
          programId,
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
    console.error("PATCH /api/programs/[id]/participants error:", error);
    return NextResponse.json({ error: "Failed to save evaluation" }, { status: 500 });
  }
}
