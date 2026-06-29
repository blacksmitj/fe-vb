import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const countOnly = searchParams.get("countOnly") === "true";

    // Get all programs where the user is an APPROVED member
    const userPrograms = await db.programMember.findMany({
      where: {
        userId,
        status: "APPROVED",
      },
      include: {
        program: {
          include: {
            profileSchema: true,
            profileTemplate: true,
          }
        }
      }
    });

    if (userPrograms.length === 0) {
      if (countOnly) return NextResponse.json({ count: 0 });
      return NextResponse.json({ data: [] });
    }

    const fixDataEntries = [];
    let count = 0;

    // For each program, check verified participants by this user
    for (const member of userPrograms) {
      const program = member.program;
      
      // Resolve active sections (prioritize profileTemplate, fallback to profileSchema)
      let sections: any[] = [];
      if (program.profileTemplate && program.profileTemplate.sections) {
        sections = program.profileTemplate.sections as any[];
      } else if (program.profileSchema && program.profileSchema.sections) {
        sections = program.profileSchema.sections as any[];
      }

      if (!sections || sections.length === 0) continue;

      // Extract required fields from schema
      const requiredFields: string[] = [];

      if (Array.isArray(sections)) {
        sections.forEach((section) => {
          if (section.fields && Array.isArray(section.fields)) {
            section.fields.forEach((field: any) => {
              if (field.isRequired && field.label) {
                requiredFields.push(field.label);
              }
            });
          }
        });
      }

      if (requiredFields.length === 0) continue;

      const isAdmin = member.role === "ADMIN";

      // Find participants: if Admin, fetch all verified. If Verifier, fetch only verified by self.
      const participants = await db.participant.findMany({
        where: {
          programId: program.id,
          evalStatus: "VERIFIED",
          ...(isAdmin ? {} : { evalByUserId: userId }),
        },
      });

      for (const participant of participants) {
        const data = (participant.data as Record<string, any>) || {};
        const missingFields = [];

        for (const reqField of requiredFields) {
          const val = data[reqField];
          if (val === undefined || val === null || val === "") {
            missingFields.push(reqField);
          }
        }

        if (missingFields.length > 0) {
          count++;
          if (!countOnly) {
            fixDataEntries.push({
              programId: program.id,
              programName: program.name,
              participantId: participant.id,
              uniqueKey: participant.uniqueKey,
              rowIndex: participant.rowIndex,
              missingFields,
              verifiedBy: participant.evalByUserName || "Sistem",
            });
          }
        }
      }
    }

    if (countOnly) {
      return NextResponse.json({ count });
    }

    return NextResponse.json({ data: fixDataEntries });
  } catch (error) {
    console.error("Error fetching fix data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
