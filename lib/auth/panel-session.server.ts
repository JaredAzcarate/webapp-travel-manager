import { auth } from "@/lib/auth/config";
import { NextResponse } from "next/server";

export type PanelRole = "ADMIN" | "SECRETARY";

export interface PanelSessionUser {
  id: string;
  username: string;
  role: PanelRole;
  chapelId?: string;
}

/**
 * Returns the current panel user from NextAuth session, or null if unauthenticated.
 */
export async function getPanelSessionUser(): Promise<PanelSessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }
  const role = session.user.role ?? "ADMIN";
  return {
    id: session.user.id,
    username: session.user.username,
    role,
    chapelId: session.user.chapelId,
  };
}

/**
 * Requires an authenticated panel user. Use in API routes.
 */
export async function requirePanelSession():
  Promise<
    | { ok: true; user: PanelSessionUser }
    | { ok: false; response: NextResponse }
  > {
  const user = await getPanelSessionUser();
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ message: "Não autorizado" }, { status: 401 }),
    };
  }
  return { ok: true, user };
}

/**
 * Requires ADMIN role (not SECRETARY). Use for sensitive admin-only APIs.
 */
export async function requireAdminRole():
  Promise<
    | { ok: true; user: PanelSessionUser }
    | { ok: false; response: NextResponse }
  > {
  const result = await requirePanelSession();
  if (!result.ok) {
    return result;
  }
  if (result.user.role !== "ADMIN") {
    return {
      ok: false,
      response: NextResponse.json(
        { message: "Acesso reservado a administradores" },
        { status: 403 }
      ),
    };
  }
  return { ok: true, user: result.user };
}
