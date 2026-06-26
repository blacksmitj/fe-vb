import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "@/lib/db";

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  logger: {
    level: "debug",
    log(level, message, ...args) {
      console.log(`[Better-Auth ${level.toUpperCase()}]: ${message}`, ...args);
    },
  },
  onAPIError: {
    onError: (error: any, ctx: any) => {
      console.error("[Better-Auth API Error]:", {
        message: error?.message,
        stack: error?.stack,
        url: ctx?.request?.url || ctx?.req?.url,
        method: ctx?.request?.method || ctx?.req?.method,
      });
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      scope: ["openid", "email", "profile"],
    },
  },
});
