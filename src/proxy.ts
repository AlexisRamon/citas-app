import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const LOGIN_PATH = "/doctor/login";

function isProtectedDoctorPath(pathname: string) {
  const isDoctorArea =
    pathname === "/doctor" || pathname.startsWith("/doctor/");
  const isLogin =
    pathname === LOGIN_PATH || pathname.startsWith(`${LOGIN_PATH}/`);
  return isDoctorArea && !isLogin;
}

function redirectToLogin(
  request: NextRequest,
  response: NextResponse,
  reason?: string,
) {
  const url = request.nextUrl.clone();
  url.pathname = LOGIN_PATH;
  url.search = reason ? `?error=${reason}` : "";

  const redirect = NextResponse.redirect(url);
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

export async function proxy(request: NextRequest) {
  if (!isProtectedDoctorPath(request.nextUrl.pathname)) {
    return updateSession(request);
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return redirectToLogin(request, response);

  const { data: profile, error } = await supabase
    .from("doctor_profiles")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !profile) {
    return redirectToLogin(request, response, "sin-acceso");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};