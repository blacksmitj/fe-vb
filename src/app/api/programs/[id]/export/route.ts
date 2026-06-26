import { db } from "@/lib/db";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import ExcelJS from "exceljs";

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
      select: { name: true },
    });

    if (!program) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    // Get all participants ordered by rowIndex
    const participants = await db.participant.findMany({
      where: { programId: id },
      orderBy: { rowIndex: "asc" },
      select: {
        headers: true,
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

    // Extract headers (headers are same across rows for a single import, use first row)
    const headersList = participants[0].headers || [];

    // Create workbook and sheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Participants Evaluation");

    // We add verification status and details headers at the end
    const finalHeaders = [
      ...headersList.filter(h => !h.startsWith("__") && !h.startsWith("_")),
      "Status Verifikasi",
      "Diverifikasi Oleh",
      "Waktu Verifikasi",
      "Keterangan Verifikasi"
    ];

    // Define columns
    worksheet.columns = finalHeaders.map(h => ({
      header: h,
      key: h,
      width: h.length < 15 ? 15 : h.length + 3
    }));

    // Add rows
    participants.forEach(p => {
      const row = (p.data as Record<string, any>) || {};
      const rowData: Record<string, any> = {};
      
      // Populate original fields
      headersList.forEach(h => {
        if (!h.startsWith("__") && !h.startsWith("_")) {
          rowData[h] = row[h] !== undefined && row[h] !== null ? row[h] : "";
        }
      });

      // Populate verification results
      rowData["Status Verifikasi"] = p.evalStatus === "VERIFIED" ? "SUDAH DIVERIFIKASI" : "BELUM DIVERIFIKASI";
      rowData["Diverifikasi Oleh"] = p.evalByUserName || "";
      rowData["Waktu Verifikasi"] = p.evalAt 
        ? new Date(p.evalAt).toLocaleString("id-ID")
        : "";
      rowData["Keterangan Verifikasi"] = p.evalDescription || "";

      worksheet.addRow(rowData);
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
    const safeProgramName = program.name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const fileName = `export_${safeProgramName}_${new Date().toISOString().split("T")[0]}.xlsx`;

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
