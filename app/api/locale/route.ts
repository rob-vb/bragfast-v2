import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body: unknown = await request.json();
  const locale =
    typeof body === "object" && body !== null && "locale" in body
      ? body.locale
      : null;

  if (locale !== "nl" && locale !== "en") {
    return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
  }

  (await cookies()).set("lang", locale, {
    httpOnly: true,
    maxAge: 365 * 24 * 60 * 60,
    path: "/",
    sameSite: "lax",
  });

  return new NextResponse(null, { status: 204 });
}
