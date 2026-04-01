import { registrationRepositoryServer } from "@/features/registrations/repositories/registrations.repository.server";
import { NextResponse } from "next/server";
import type { PanelSessionUser } from "./panel-session.server";
import { getPanelSessionUser } from "./panel-session.server";

export function filterRegistrationsForPanelUser<T extends { chapelId: string }>(
  user: PanelSessionUser,
  list: T[]
): T[] {
  if (user.role !== "SECRETARY") {
    return list;
  }
  if (!user.chapelId) {
    return [];
  }
  return list.filter((r) => r.chapelId === user.chapelId);
}

/**
 * If the caller is a logged-in secretary, rejects when the registration is not from their chapel.
 * Public callers (no session) are allowed through.
 */
export async function denySecretaryIfWrongChapel(
  registrationId: string
): Promise<NextResponse | null> {
  const user = await getPanelSessionUser();
  if (!user || user.role !== "SECRETARY") {
    return null;
  }
  if (!user.chapelId) {
    return NextResponse.json(
      { message: "Conta de secretário sem capela associada" },
      { status: 403 }
    );
  }
  const reg = await registrationRepositoryServer.getById(registrationId);
  if (reg.chapelId !== user.chapelId) {
    return NextResponse.json({ message: "Acesso negado" }, { status: 403 });
  }
  return null;
}
