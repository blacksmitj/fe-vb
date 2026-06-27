import { db } from "@/lib/db";
import { auth } from "@/lib/auth/auth";
import { headers as getHeaders } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await getHeaders(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const builders = await db.profileTemplate.findMany({
      include: {
        program: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(builders);
  } catch (error) {
    console.error("GET /api/profile-builders error:", error);
    return NextResponse.json({ error: "Failed to fetch profile builders" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await getHeaders(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description, programId } = await req.json();

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Jika programId dikirim, periksa apakah sudah ada profile builder lain yang memakainya
    if (programId) {
      const existing = await db.profileTemplate.findUnique({
        where: { programId },
      });
      if (existing) {
        return NextResponse.json(
          { error: "Program ini sudah terhubung dengan Profile Builder lain." },
          { status: 400 }
        );
      }
    }

    const newBuilder = await db.profileTemplate.create({
      data: {
        name,
        description: description || "",
        sections: [],
        programId: programId || null,
      },
    });

    return NextResponse.json(newBuilder);
  } catch (error) {
    console.error("POST /api/profile-builders error:", error);
    return NextResponse.json({ error: "Failed to create profile builder" }, { status: 500 });
  }
}
