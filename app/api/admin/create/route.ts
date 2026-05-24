import { adminRepositoryServer } from "@/features/auth/repositories/admin.repository.server";
import type { PanelAdminRole } from "@/features/auth/models/admin.model";
import { requireAdminRole } from "@/lib/auth/panel-session.server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminRole();
    if (!auth.ok) {
      return auth.response;
    }

    const { username, password, role, chapelId } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { message: "Username e password são obrigatórios" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: "A senha deve ter no mínimo 8 caracteres" },
        { status: 400 }
      );
    }

    // Check if admin already exists
    const existing = await adminRepositoryServer.getByUsername(username);
    if (existing) {
      return NextResponse.json(
        { message: "Usuário já existe" },
        { status: 409 }
      );
    }

    const resolvedRole: PanelAdminRole =
      role === "SECRETARY" ? "SECRETARY" : "ADMIN";

    if (resolvedRole === "SECRETARY" && !chapelId) {
      return NextResponse.json(
        { message: "Capela obrigatória para perfil secretário" },
        { status: 400 }
      );
    }

    // Create admin
    const admin = await adminRepositoryServer.create({
      username,
      password,
      role: resolvedRole,
      ...(resolvedRole === "SECRETARY" ? { chapelId } : {}),
    });

    return NextResponse.json(
      {
        message: "Admin criado com sucesso",
        adminId: admin.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating admin:", error);
    return NextResponse.json(
      { message: "Erro ao criar admin" },
      { status: 500 }
    );
  }
}
