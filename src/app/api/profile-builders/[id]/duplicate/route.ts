import { db } from "@/lib/db";
import { auth } from "@/lib/auth/auth";
import { headers as getHeaders } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await getHeaders(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Ambil data builder lama untuk pengecekan akses dan data
    const existingBuilder = await db.profileTemplate.findUnique({
      where: { id },
    });
    if (!existingBuilder) {
      return NextResponse.json({ error: "Profile Builder not found" }, { status: 404 });
    }

    // Validasi akses program jika template terhubung ke program
    if (existingBuilder.programId) {
      const member = await db.programMember.findFirst({
        where: {
          programId: existingBuilder.programId,
          userId: session.user.id,
          status: "APPROVED",
          role: "ADMIN",
        },
      });
      if (!member) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Buat profile template baru hasil duplikasi
    const duplicated = await db.profileTemplate.create({
      data: {
        name: `${existingBuilder.name} (Copy)`,
        description: existingBuilder.description || "",
        sections: existingBuilder.sections || [],
        programId: null, // duplikat tidak langsung terhubung ke program
      },
    });

    return NextResponse.json(duplicated);
  } catch (error) {
    console.error("POST /api/profile-builders/[id]/duplicate error:", error);
    return NextResponse.json({ error: "Failed to duplicate profile builder" }, { status: 500 });
  }
}
