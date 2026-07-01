import { db } from "@/lib/db";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { safeParseDate } from "@/lib/utils";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Check if user is member of the program
    const member = await db.programMember.findUnique({
      where: {
        programId_userId: {
          programId: id,
          userId: session.user.id,
        },
      },
    });

    if (!member || member.status !== "APPROVED") {
      return NextResponse.json({ error: "Forbidden: Program members only" }, { status: 403 });
    }

    const program = await db.program.findUnique({
      where: { id },
      include: {
        profileSchema: true,
        profileTemplate: true,
      },
    });

    if (!program) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    // Get all participants ordered by rowIndex
    const participants = await db.participant.findMany({
      where: { programId: id },
      orderBy: { rowIndex: "asc" },
      select: {
        data: true,
        evalStatus: true,
        evalByUserName: true,
        evalAt: true,
        evalDescription: true,
      },
    });

    if (participants.length === 0) {
      return NextResponse.json({ error: "No participant data available to export" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode"); // "profile" or "all"
    const exportProfile = mode === "profile";

    // Resolve active sections (prioritize profileTemplate, fallback to profileSchema)
    let sections: any[] = [];
    if (program.profileTemplate && program.profileTemplate.sections) {
      sections = program.profileTemplate.sections as any[];
    } else if (program.profileSchema && program.profileSchema.sections) {
      sections = program.profileSchema.sections as any[];
    }

    // Extract fields from profile builder schema
    const builderFields: any[] = [];
    if (sections && Array.isArray(sections)) {
      sections.forEach((sec: any) => {
        if (sec.fields && Array.isArray(sec.fields)) {
          sec.fields.forEach((f: any) => {
            builderFields.push(f);
          });
        }
      });
    }

    const hasProfileBuilder = exportProfile && builderFields.length > 0;

    // Define column headers
    const finalHeaders = hasProfileBuilder
      ? [
          ...builderFields.map((f: any) => f.label),
          "Status Verifikasi",
          "Diverifikasi Oleh",
          "Waktu Verifikasi",
          "Keterangan Verifikasi"
        ]
      : [
          ...program.headers.filter((h: string) => !h.startsWith("__") && !h.startsWith("_")),
          "Status Verifikasi",
          "Diverifikasi Oleh",
          "Waktu Verifikasi",
          "Keterangan Verifikasi"
        ];

    // Create workbook and sheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Participants Evaluation");

    // Define columns
    worksheet.columns = finalHeaders.map((h: string) => ({
      header: h,
      key: h,
      width: h.length < 15 ? 15 : h.length + 3
    }));

    // Add rows
    participants.forEach(p => {
      const row = (p.data as Record<string, any>) || {};
      const rowData: Record<string, any> = {};
      
      if (hasProfileBuilder) {
        builderFields.forEach((field: any) => {
          const val = row[field.label];
          if (field.type === "date") {
            const dateObj = safeParseDate(val);
            if (dateObj) {
              const mode = field.dateMode === "date-time" ? "date-time" : "date-only";
              const options: Intl.DateTimeFormatOptions = {
                day: "numeric",
                month: "long",
                year: "numeric",
                timeZone: "Asia/Jakarta"
              };
              if (mode === "date-time") {
                options.hour = "2-digit";
                options.minute = "2-digit";
              }
              
              let formattedDate = dateObj.toLocaleDateString("id-ID", options);
              if (mode === "date-time") {
                formattedDate += " WIB";
              }
              rowData[field.label] = formattedDate;
            } else {
              rowData[field.label] = val !== undefined && val !== null ? String(val) : "";
            }
          } else {
            rowData[field.label] = val !== undefined && val !== null ? String(val) : "";
          }
        });
      } else {
        // Populate original fields
        program.headers.forEach((h: string) => {
          if (!h.startsWith("__") && !h.startsWith("_")) {
            const val = row[h];
            rowData[h] = val !== undefined && val !== null ? String(val) : "";
          }
        });
      }

      // Populate verification results
      let statusVerifikasi = "BELUM DIVERIFIKASI";
      if (p.evalStatus === "VERIFIED") {
        statusVerifikasi = "SUDAH DIVERIFIKASI";
      } else if (p.evalStatus === "REJECTED") {
        statusVerifikasi = "DITOLAK";
      }

      rowData["Status Verifikasi"] = statusVerifikasi;
      rowData["Diverifikasi Oleh"] = p.evalByUserName || "";
      rowData["Waktu Verifikasi"] = p.evalAt 
        ? p.evalAt.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Asia/Jakarta"
          }) + " WIB"
        : "";
      rowData["Keterangan Verifikasi"] = p.evalDescription || "";

      const addedRow = worksheet.addRow(rowData);
      
      // CRITICAL: Format each cell in the added row as text to prevent scientific notation
      addedRow.eachCell({ includeEmpty: true }, (cell) => {
        cell.numFmt = "@";
        if (cell.value !== null && cell.value !== undefined) {
          cell.value = String(cell.value);
        }
      });
    });

    // Style the header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4F46E5" } // Indigo background
    };
    headerRow.alignment = { vertical: "middle", horizontal: "left" };
    worksheet.getRow(1).height = 25;

    // Buffer generation
    const buffer = await workbook.xlsx.writeBuffer();

    // Format safe file name
    const prefix = exportProfile ? "export_profile" : "export_all";
    const safeProgramName = program.name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const fileName = `${prefix}_${safeProgramName}_${new Date().toISOString().split("T")[0]}.xlsx`;

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`
      }
    });

  } catch (error) {
    console.error("GET /api/programs/[id]/export error:", error);
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 });
  }
}
