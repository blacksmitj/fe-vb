import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const sessionCookie = request.cookies.get("better-auth.session_token") || 
                        request.cookies.get("__Secure-better-auth.session_token");

  const { pathname, search } = request.nextUrl;
  const isAuthPage = pathname === "/";
  
  // Protected paths
  const isProtectedPage = 
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/builder") ||
    pathname.startsWith("/programs");

  if (isProtectedPage && !sessionCookie) {
    const callbackURL = encodeURIComponent(`${pathname}${search}`);
    return NextResponse.redirect(new URL(`/?callbackURL=${callbackURL}`, request.url));
  }

  if (isAuthPage && sessionCookie) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/builder/:path*",
    "/programs/:path*",
  ],
};
