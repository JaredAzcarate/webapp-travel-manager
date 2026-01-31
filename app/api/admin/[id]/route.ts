import { adminRepositoryServer } from "@/features/auth/repositories/admin.repository.server";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
