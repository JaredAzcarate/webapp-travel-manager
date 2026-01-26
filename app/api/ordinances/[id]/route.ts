import { ordinanceRepositoryServer } from "@/features/ordinances/repositories/ordinances.repository.server";
import { UpdateOrdinanceInput } from "@/features/ordinances/models/ordinances.model";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const input: UpdateOrdinanceInput = await request.json();
    const { id } = await params;

    const ordinance = await ordinanceRepositoryServer.update(id, input);

    return NextResponse.json(
      {
        message: "Ordenança atualizada com sucesso",
        ordinance,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating ordinance:", error);
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { message: "Ordenança não encontrada" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: "Erro ao atualizar ordenança" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await ordinanceRepositoryServer.delete(id);

    return NextResponse.json(
      {
        message: "Ordenança eliminada com sucesso",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting ordinance:", error);
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { message: "Ordenança não encontrada" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: "Erro ao eliminar ordenança" },
      { status: 500 }
    );
  }
}
