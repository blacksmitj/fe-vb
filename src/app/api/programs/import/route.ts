import { db } from "@/lib/db";
import { NextResponse } from "next/server";

const BATCH_SIZE = 500;

// Simple validation logic (placeholder/standard)
function validateRows(rows: any[], headers: string[]) {
  const validRows: any[] = [];
  const errorDetails: any[] = [];
  let errorCount = 0;

  rows.forEach((row, index) => {
    // Standard basic check: row must have fields mapped to headers
    // For now we treat all rows as valid, unless they are completely empty
    if (!row || Object.keys(row).length === 0) {
      errorCount++;
      errorDetails.push({
        rowIndex: index,
        column: "Row",
        value: row,
        message: "Baris kosong tidak valid.",
      });
    } else {
      validRows.push(row);
    }
  });

  return { validRows, errorDetails, errorCount };
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  );
}

export async function POST(req: Request) {
  try {
    const { name, description, headers, data } = await req.json();
    const rows = data;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const totalRowsCount = rows ? rows.length : 0;
    const fieldCount = headers ? headers.length : 0;

    // 1. Dapatkan user session
    const sessionRes = await fetch(`${process.env.BETTER_AUTH_URL || "http://localhost:3000"}/api/auth/get-session`, {
      headers: {
        cookie: req.headers.get("cookie") || "",
      },
    });
    const session = await sessionRes.json();
    const userId = session?.user?.id;

    // 1. Buat record Program dengan metadata saja, beserta ProgramMember ADMIN jika user login
    const program = await db.program.create({
      data: {
        name,
        description: description || "",
        totalRows: totalRowsCount,
        fieldCount,
        errorCount: 0,
        ...(userId ? {
          members: {
            create: {
              userId,
              role: "ADMIN",
              status: "APPROVED",
            }
          }
        } : {})
      },
    });

    const parsedRows = rows || [];
    const parsedHeaders = headers || [];

    // 2. Validasi setiap baris
    const { validRows, errorDetails, errorCount } = validateRows(parsedRows, parsedHeaders);

    // 3. Bagi rows menjadi chunks 500 baris
    const chunks = chunkArray(validRows, BATCH_SIZE);

    // 4. Simpan semua batch
    if (chunks.length > 0) {
      await db.participantData.createMany({
        data: chunks.map((chunk, index) => ({
          programId: program.id,
          headers: index === 0 ? parsedHeaders : null, // headers hanya di batch 0
          rows: chunk,
          batchIndex: index,
          totalInBatch: chunk.length,
          errorDetails: index === 0 ? (errorDetails as any) : undefined,
        }) as any),
      });
    } else {
      // Jika tidak ada baris sama sekali, buat 1 batch kosong agar headers tetap tersimpan
      await db.participantData.create({
        data: {
          programId: program.id,
          headers: parsedHeaders,
          rows: [],
          batchIndex: 0,
          totalInBatch: 0,
          errorDetails: errorDetails,
        },
      });
    }

    // 5. Update errorCount di program
    await db.program.update({
      where: { id: program.id },
      data: { errorCount },
    });

    // 6. Catat log import
    await db.importLog.create({
      data: {
        programId: program.id,
        fileName: name,
        totalRows: totalRowsCount,
        errorCount,
        status: errorCount > 0 ? "PARTIAL" : "COMPLETED",
      },
    });

    return NextResponse.json(program);
  } catch (error) {
    console.error("POST /api/programs/import error:", error);
    return NextResponse.json({ error: "Failed to import program" }, { status: 500 });
  }
}
