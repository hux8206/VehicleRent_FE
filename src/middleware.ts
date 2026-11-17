import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("accessToken")?.value?.trim();
  const userRole = request.cookies.get("userRole")?.value?.trim();

  // If already logged in, redirect away from login/register unless there's an explicit error param
  if ((pathname === "/login" || pathname === "/register") && token && userRole && !request.nextUrl.searchParams.has("error")) {
    if (userRole === "0") return NextResponse.redirect(new URL("/admin", request.url));
    if (userRole === "1") return NextResponse.redirect(new URL("/partner", request.url));
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Protect Admin Routes (/admin/*)
  if (pathname.startsWith("/admin")) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      loginUrl.searchParams.set("error", "unauthorized");
      return NextResponse.redirect(loginUrl);
    }
    if (userRole !== "0") {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("error", "forbidden");
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect Partner Routes (/partner/*)
  if (pathname.startsWith("/partner")) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      loginUrl.searchParams.set("error", "unauthorized");
      return NextResponse.redirect(loginUrl);
    }
    if (userRole !== "1") {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("error", "forbidden");
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect Customer Booking History (/customer/bookings) and Profile (/profile)
  if (pathname.startsWith("/customer/bookings") || pathname.startsWith("/profile")) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/partner/:path*",
    "/customer/bookings/:path*",
    "/profile/:path*",
    "/login",
    "/register",
  ],
};

