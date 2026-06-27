import { db } from "@/lib/db";
import { auth } from "@/lib/auth/auth";
import { headers as getHeaders } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await getHeaders(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const {
      name,
      description,
      uniqueKeyColumn,
      totalRows,
      fieldCount,
      errorCount,
      fileName,
      headers,
      profileTemplateId,
    } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "Nama program wajib diisi." }, { status: 400 });
    }
    if (!uniqueKeyColumn) {
      return NextResponse.json({ error: "Kolom ID Unik wajib diisi." }, { status: 400 });
    }

    const program = await db.$transaction(async (tx) => {
      const prog = await tx.program.create({
        data: {
          name,
          description: description || "",
          totalRows: totalRows || 0,
          fieldCount: fieldCount || 0,
          errorCount: errorCount || 0,
          uniqueKeyColumn,
          headers: headers || [],
          programMembers: {
            create: {
              userId: session.user.id,
              role: "ADMIN",
              status: "APPROVED",
            },
          },
        },
      });

      // Initialize empty profile schema
      await tx.profileSchema.create({
        data: {
          programId: prog.id,
          sections: [],
          version: 1,
        },
      });

      // Create Import Log
      await tx.importLog.create({
        data: {
          programId: prog.id,
          fileName: fileName || "file_import",
          totalRows: totalRows || 0,
          errorCount: errorCount || 0,
          status: errorCount > 0 ? "PARTIAL" : "COMPLETED",
          notes: errorCount > 0 ? `${errorCount} baris memiliki masalah validasi.` : "Berhasil di-import.",
        },
      });

      return prog;
    });

    return NextResponse.json(program);
  } catch (error: any) {
    console.error("POST /api/programs/import/start error:", error);
    return NextResponse.json({ error: error.message || "Gagal menginisiasi program." }, { status: 500 });
  }
}
