import { chapelTransferRepositoryServer } from "@/features/finances/repositories/chapelTransfers.repository.server";
import { requireAdminRole } from "@/lib/auth/panel-session.server";
import { NextRequest, NextResponse } from "next/server";

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
    await chapelTransferRepositoryServer.delete(id);

    return NextResponse.json(
      { message: "Transferência eliminada com sucesso" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting chapel transfer:", error);
    return NextResponse.json(
      { message: "Erro ao eliminar transferência" },
      { status: 500 }
    );
  }
}
