import { auth } from "@/lib/auth/auth";
import { getGoogleAccessToken } from "@/lib/auth/get-google-token";
import { getSpreadsheetSheets } from "@/lib/google-sheets";
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

  if (!sheetId) {
    return NextResponse.json({ error: "sheetId is required" }, { status: 400 });
  }

  try {
    const accessToken = await getGoogleAccessToken(session.user.id);
    if (!accessToken) {
      return NextResponse.json({ error: "Google authentication required" }, { status: 401 });
    }

    const tabs = await getSpreadsheetSheets(accessToken, sheetId);
    return NextResponse.json({ tabs });
  } catch (error: any) {
    console.error("Error fetching sheet tabs:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch sheet tabs" }, { status: 500 });
  }
}
