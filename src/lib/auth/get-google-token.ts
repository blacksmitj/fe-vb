import { db } from "@/lib/db";

export async function getGoogleAccessToken(userId: string): Promise<string | null> {
  try {
    const account = await db.account.findFirst({
      where: {
        userId,
        providerId: "google",
      },
    });

    if (!account) {
      console.error(`Google account not found for user: ${userId}`);
      return null;
    }

    const { accessToken, refreshToken, accessTokenExpiresAt } = account;

    if (!accessToken) return null;

    // Check if token is expired or close to expiring (within 1 minute buffer)
    const isExpired = accessTokenExpiresAt 
      ? new Date().getTime() >= new Date(accessTokenExpiresAt).getTime() - 60000 
      : false;

    if (!isExpired) {
      return accessToken;
    }

    // If expired, refresh it using refresh_token
    if (!refreshToken) {
      console.error(`Google refresh token is missing for user: ${userId}`);
      return accessToken; // Fallback to current token, might fail
    }

    console.log(`Google access token expired for user ${userId}. Refreshing...`);

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Failed to refresh Google OAuth token:", errText);
      return null;
    }

    const tokens = await response.json();
    const newAccessToken = tokens.access_token;
    const expiresIn = tokens.expires_in; // in seconds

    const updatedExpiresAt = new Date(Date.now() + expiresIn * 1000);

    // Save back to DB
    await db.account.update({
      where: { id: account.id },
      data: {
        accessToken: newAccessToken,
        accessTokenExpiresAt: updatedExpiresAt,
        // Google might also return a new refresh token optionally
        ...(tokens.refresh_token ? { refreshToken: tokens.refresh_token } : {}),
      },
    });

    console.log(`Google access token successfully refreshed for user: ${userId}`);
    return newAccessToken;
  } catch (error) {
    console.error("Error in getGoogleAccessToken:", error);
    return null;
  }
}
