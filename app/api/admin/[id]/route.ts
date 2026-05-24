import type { PanelAdminRole } from "@/features/auth/models/admin.model";
import { adminRepositoryServer } from "@/features/auth/repositories/admin.repository.server";
import { requireAdminRole } from "@/lib/auth/panel-session.server";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminRole();
    if (!auth.ok) {
      return auth.response;
    }

    const { id } = await params;
    const body = await request.json();
    const role = body.role as PanelAdminRole;
    const chapelId = body.chapelId as string | undefined;

    if (role !== "ADMIN" && role !== "SECRETARY") {
      return NextResponse.json(
        { message: "Perfil inválido" },
        { status: 400 }
      );
    }

    if (role === "SECRETARY" && (!chapelId || typeof chapelId !== "string")) {
      return NextResponse.json(
        { message: "Capela obrigatória para perfil secretário" },
        { status: 400 }
      );
    }

    await adminRepositoryServer.updateProfile(id, {
      role,
      chapelId: role === "ADMIN" ? null : chapelId,
    });

    return NextResponse.json(
      { message: "Gestor atualizado com sucesso" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating admin profile:", error);
    return NextResponse.json(
      { message: "Erro ao atualizar gestor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminRole();
    if (!auth.ok) {
      return auth.response;
    }

    const { id } = await params;

    await adminRepositoryServer.delete(id);

    return NextResponse.json(
      { message: "Gestor eliminado com sucesso" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting admin:", error);
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { message: "Gestor não encontrado" },
        { status: 404 }
      );
    }
    if (
      error instanceof Error &&
      error.message.includes("Não é possível eliminar")
    ) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { message: "Erro ao eliminar gestor" },
      { status: 500 }
    );
  }
}
