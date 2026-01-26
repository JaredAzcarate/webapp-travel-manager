import { chapelRepositoryServer } from "@/features/chapels/repositories/chapels.repository.server";
import { UpdateChapelInput } from "@/features/chapels/models/chapels.model";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const input: UpdateChapelInput = await request.json();
    const { id } = await params;

    const chapel = await chapelRepositoryServer.update(id, input);

    return NextResponse.json(
      {
        message: "Capela atualizada com sucesso",
        chapel,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating chapel:", error);
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { message: "Capela não encontrada" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: "Erro ao atualizar capela" },
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

    await chapelRepositoryServer.delete(id);

    return NextResponse.json(
      {
        message: "Capela eliminada com sucesso",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting chapel:", error);
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { message: "Capela não encontrada" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: "Erro ao eliminar capela" },
      { status: 500 }
    );
  }
}
