import { deleteChapelTransferWithCreditBox } from "@/features/finances/services/financeSummary.server";
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
    await deleteChapelTransferWithCreditBox(id);

    return NextResponse.json(
      { message: "Transferência eliminada com sucesso" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting chapel transfer:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Erro ao eliminar transferência";
    const isCreditInUse =
      error instanceof Error &&
      error.message.includes("Não é possível eliminar");

    return NextResponse.json(
      { message },
      { status: isCreditInUse ? 409 : 500 }
    );
  }
}
