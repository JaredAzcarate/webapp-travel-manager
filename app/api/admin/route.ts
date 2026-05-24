import { adminRepositoryServer } from "@/features/auth/repositories/admin.repository.server";
import { requireAdminRole } from "@/lib/auth/panel-session.server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const auth = await requireAdminRole();
    if (!auth.ok) {
      return auth.response;
    }

    const admins = await adminRepositoryServer.getAll();

    // Strip password from response (never send to client)
    const adminsSafe = admins.map(({ password: _password, ...admin }) => admin);

    return NextResponse.json({ admins: adminsSafe });
  } catch (error) {
    console.error("Error fetching admins:", error);
    return NextResponse.json(
      { message: "Erro ao obter gestores" },
      { status: 500 }
    );
  }
}
