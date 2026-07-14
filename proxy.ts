import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  const isLoginRoute = pathname === "/login"

  if (!session && !isLoginRoute) {
    return NextResponse.redirect(new URL("/login", req.nextUrl))
  }

  if (session && isLoginRoute) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl))
  }

  if (
    session &&
    pathname.startsWith("/admins") &&
    session.user.role !== "super_admin"
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|logo.webp).*)"],
}
