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

    // Find the maximum batchIndex first
    const maxBatchResult = await db.participantData.aggregate({
      where: { programId: id },
      _max: {
        batchIndex: true,
      },
    });

    const maxBatchIndex = maxBatchResult._max.batchIndex;

    if (maxBatchIndex === null) {
      return NextResponse.json({ error: "No participant data available to export" }, { status: 400 });
    }

    // Extract headers and combine rows sequentially to save memory
    let headersList: string[] = [];
    const allRows: Record<string, any>[] = [];

    for (let i = 0; i <= maxBatchIndex; i++) {
      const batch = await db.participantData.findFirst({
        where: { programId: id, batchIndex: i },
        select: { headers: true, rows: true }, // Avoid loading errorDetails or other fields
      });

      if (batch) {
        if (batch.headers && Array.isArray(batch.headers)) {
          // Collect headers, merge unique ones
          const batchHeaders = batch.headers as string[];
          batchHeaders.forEach(h => {
            if (!headersList.includes(h)) {
              headersList.push(h);
            }
          });
        }
        if (batch.rows && Array.isArray(batch.rows)) {
          allRows.push(...(batch.rows as Record<string, any>[]));
        }
      }
    }

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
    allRows.forEach(row => {
      const rowData: Record<string, any> = {};
      
      // Populate original fields
      headersList.forEach(h => {
        if (!h.startsWith("__") && !h.startsWith("_")) {
          rowData[h] = row[h] !== undefined && row[h] !== null ? row[h] : "";
        }
      });

      // Populate verification results
      rowData["Status Verifikasi"] = row["_evaluationStatus"] === "VERIFIED" ? "SUDAH DIVERIFIKASI" : "BELUM DIVERIFIKASI";
      rowData["Diverifikasi Oleh"] = row["_verifiedByName"] || "";
      rowData["Waktu Verifikasi"] = row["_evaluatedAt"] 
        ? new Date(row["_evaluatedAt"]).toLocaleString("id-ID")
        : "";
      rowData["Keterangan Verifikasi"] = row["_evaluationDescription"] || "";

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
