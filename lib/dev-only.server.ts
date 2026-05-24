import { NextResponse } from "next/server";

/** Blocks the request outside development (e.g. production). */
export function developmentOnlyResponse(): NextResponse | null {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { message: "Disponível apenas em ambiente de desenvolvimento" },
      { status: 403 }
    );
  }
  return null;
}
