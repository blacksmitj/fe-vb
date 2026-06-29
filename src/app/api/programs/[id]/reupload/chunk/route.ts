import { db } from "@/lib/db";
import { auth } from "@/lib/auth/auth";
import { headers as getHeaders } from "next/headers";
import { NextResponse } from "next/server";

function buildSearchText(data: Record<string, any>): string {
  return Object.values(data)
    .filter((v) => v != null && v !== "")
    .map((v) => String(v))
    .join(" ");
}

export async function POST(
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
    const { id } = await params;

    // Validate ADMIN membership
    const membership = await db.programMember.findUnique({
      where: {
        programId_userId: {
          programId: id,
          userId: session.user.id,
        },
      },
    });

    if (!membership || membership.role !== "ADMIN" || membership.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Hanya Admin program yang diperbolehkan meng-reupload data." },
        { status: 403 }
      );
    }

    const {
      rows,
      headers,
      uniqueKeyColumn,
      startRowIndex,
      filterMode = "ALL",
      allowedUniqueKeys = [],
      existingHeaders = [],
    } = await req.json();

    if (!rows || !headers || !uniqueKeyColumn) {
      return NextResponse.json({ error: "Parameter tidak lengkap." }, { status: 400 });
    }

    if (filterMode === "ALL") {
      const participantRecords = rows.map((row: any, idx: number) => {
        const { [uniqueKeyColumn]: uniqueKeyValue, __sheetRowIndex, ...rest } = row;
        const rowIndex = typeof startRowIndex === "number" ? startRowIndex + idx : idx;
        const uniqueKeyValStr = String(uniqueKeyValue ?? "").trim();

        const combinedData = {
          ...rest,
          [uniqueKeyColumn]: uniqueKeyValStr,
        };

        return {
          programId: id,
          rowIndex,
          uniqueKey: uniqueKeyValStr,
          data: combinedData as any,
          searchText: buildSearchText(combinedData),
        };
      });

      await db.participant.createMany({
        data: participantRecords,
      });

      return NextResponse.json({ success: true, count: rows.length });
    } else {
      const allowedSet = new Set(allowedUniqueKeys);
      const headersSet = new Set(existingHeaders);
      headersSet.add(uniqueKeyColumn); // Selalu simpan/izinkan kolom kunci unik

      let updatedCount = 0;

      await db.$transaction(async (tx) => {
        for (let idx = 0; idx < rows.length; idx++) {
          const row = rows[idx];
          const uniqueKeyValue = row[uniqueKeyColumn];
          const uniqueKeyValStr = String(uniqueKeyValue ?? "").trim();

          if (!allowedSet.has(uniqueKeyValStr)) {
            continue;
          }

          const oldParticipant = await tx.participant.findUnique({
            where: {
              programId_uniqueKey: {
                programId: id,
                uniqueKey: uniqueKeyValStr,
              },
            },
            select: { data: true },
          });

          if (!oldParticipant) {
            continue;
          }

          const oldData = (oldParticipant.data as Record<string, any>) || {};
          const filteredRowData: Record<string, any> = {};

          // Copy data lama
          Object.assign(filteredRowData, oldData);

          // Update dengan data baru, tapi batasi hanya kolom yang ada di existingHeaders
          const { __sheetRowIndex, ...rest } = row;
          for (const key of Object.keys(rest)) {
            if (headersSet.has(key)) {
              filteredRowData[key] = rest[key];
            }
          }

          // Pastikan uniqueKeyColumn terisi nilai string yang bersih
          filteredRowData[uniqueKeyColumn] = uniqueKeyValStr;

          await tx.participant.update({
            where: {
              programId_uniqueKey: {
                programId: id,
                uniqueKey: uniqueKeyValStr,
              },
            },
            data: {
              data: filteredRowData,
              searchText: buildSearchText(filteredRowData),
            },
          });

          updatedCount++;
        }
      }, {
        maxWait: 10000,
        timeout: 20000,
      });

      return NextResponse.json({ success: true, count: updatedCount });
    }
  } catch (error: any) {
    console.error("POST /api/programs/[id]/reupload/chunk error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal meng-insert chunk data reupload." },
      { status: 500 }
    );
  }
}
