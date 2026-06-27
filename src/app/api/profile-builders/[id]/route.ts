import { db } from "@/lib/db";
import { auth } from "@/lib/auth/auth";
import { headers as getHeaders } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(
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
    const builder = await db.profileTemplate.findUnique({
      where: { id },
      include: {
        program: {
          select: {
            id: true,
            name: true,
            headers: true,
          },
        },
      },
    });

    if (!builder) {
      return NextResponse.json({ error: "Profile Builder not found" }, { status: 404 });
    }

    // Validasi akses program jika template terhubung ke program
    if (builder.programId) {
      const member = await db.programMember.findFirst({
        where: {
          programId: builder.programId,
          userId: session.user.id,
          status: "APPROVED",
          role: "ADMIN",
        },
      });
      if (!member) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Ambil data participant pertama untuk preview jika program terhubung
    let data: any[] = [];
    if (builder.program) {
      const firstParticipant = await db.participant.findFirst({
        where: { programId: builder.program.id },
        orderBy: { rowIndex: "asc" },
        select: { data: true },
      });
      if (firstParticipant && firstParticipant.data) {
        data = [firstParticipant.data];
      }
    }

    const result = {
      ...builder,
      program: builder.program
        ? {
            ...builder.program,
            data,
          }
        : null,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/profile-builders/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch profile builder" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
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

    // Ambil data builder lama untuk pengecekan akses
    const existingBuilder = await db.profileTemplate.findUnique({
      where: { id },
    });
    if (!existingBuilder) {
      return NextResponse.json({ error: "Profile Builder not found" }, { status: 404 });
    }

    // Validasi akses program jika template terhubung ke program sebelumnya
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

    const { name, description, sections, programId } = await req.json();

    const dataToUpdate: any = {};
    if (name !== undefined) dataToUpdate.name = name;
    if (description !== undefined) dataToUpdate.description = description;
    if (sections !== undefined) {
      dataToUpdate.sections = sections;
      dataToUpdate.version = { increment: 1 };
    }

    if (programId !== undefined) {
      // Jika ingin menghubungkan ke suatu program, pastikan tidak melanggar unique constraint
      if (programId !== null) {
        // Periksa keanggotaan program baru
        const member = await db.programMember.findFirst({
          where: {
            programId,
            userId: session.user.id,
            status: "APPROVED",
            role: "ADMIN",
          },
        });
        if (!member) {
          return NextResponse.json(
            { error: "Anda tidak memiliki akses ke program ini." },
            { status: 403 }
          );
        }

        const existing = await db.profileTemplate.findFirst({
          where: {
            programId,
            NOT: { id },
          },
        });
        if (existing) {
          return NextResponse.json(
            { error: "Program ini sudah digunakan oleh Profile Builder lain." },
            { status: 400 }
          );
        }
      }
      dataToUpdate.programId = programId;
    }

    const updated = await db.profileTemplate.update({
      where: { id },
      data: dataToUpdate,
      include: {
        program: {
          select: {
            id: true,
            name: true,
            headers: true,
          },
        },
      },
    });

    // Ambil data participant pertama untuk preview jika program terhubung
    let data: any[] = [];
    if (updated.program) {
      const firstParticipant = await db.participant.findFirst({
        where: { programId: updated.program.id },
        orderBy: { rowIndex: "asc" },
        select: { data: true },
      });
      if (firstParticipant && firstParticipant.data) {
        data = [firstParticipant.data];
      }
    }

    const result = {
      ...updated,
      program: updated.program
        ? {
            ...updated.program,
            data,
          }
        : null,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("PATCH /api/profile-builders/[id] error:", error);
    return NextResponse.json({ error: "Failed to update profile builder" }, { status: 500 });
  }
}

export async function DELETE(
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

    // Ambil data builder lama untuk pengecekan akses
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

    await db.profileTemplate.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/profile-builders/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete profile builder" }, { status: 500 });
  }
}
