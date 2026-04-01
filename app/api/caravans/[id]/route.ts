import { UpdateCaravanInput } from "@/features/caravans/models/caravans.model";
import { caravanRepositoryServer } from "@/features/caravans/repositories/caravans.repository.server";
import { requireAdminRole } from "@/lib/auth/panel-session.server";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminRole();
    if (!auth.ok) {
      return auth.response;
    }

    const input: UpdateCaravanInput = await request.json();
    const { id } = await params;

    const caravan = await caravanRepositoryServer.update(id, input);

    return NextResponse.json(
      {
        message: "Viagem atualizada com sucesso",
        caravan,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating caravan:", error);
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { message: "Viagem não encontrada" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: "Erro ao atualizar viagem" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminRole();
    if (!auth.ok) {
      return auth.response;
    }

    const { id } = await params;

    await caravanRepositoryServer.delete(id);

    return NextResponse.json(
      {
        message: "Viagem eliminada com sucesso",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting caravan:", error);
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { message: "Viagem não encontrada" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: "Erro ao eliminar viagem" },
      { status: 500 }
    );
  }
}
