import { auth } from "@/lib/auth/auth";
import { getGoogleAccessToken } from "@/lib/auth/get-google-token";
import { getSheetHeadersOnly } from "@/lib/google-sheets";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const sheetId = searchParams.get("sheetId");
  const sheetName = searchParams.get("sheetName");

  if (!sheetId || !sheetName) {
    return NextResponse.json({ error: "sheetId and sheetName are required" }, { status: 400 });
  }

  try {
    const accessToken = await getGoogleAccessToken(session.user.id);
    if (!accessToken) {
      return NextResponse.json({ error: "Google authentication required" }, { status: 401 });
    }

    const cols = await getSheetHeadersOnly(accessToken, sheetId, sheetName);
    return NextResponse.json({ headers: cols });
  } catch (error: any) {
    console.error("Error fetching sheet headers:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch sheet headers" }, { status: 500 });
  }
}
