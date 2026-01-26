import { busRepositoryServer } from "@/features/buses/repositories/buses.repository.server";
import { UpdateBusInput } from "@/features/buses/models/buses.model";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const input: UpdateBusInput = await request.json();
    const { id } = await params;

    const bus = await busRepositoryServer.update(id, input);

    return NextResponse.json(
      {
        message: "Autocarro atualizado com sucesso",
        bus,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating bus:", error);
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { message: "Autocarro não encontrado" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: "Erro ao atualizar autocarro" },
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

    await busRepositoryServer.delete(id);

    return NextResponse.json(
      {
        message: "Autocarro eliminado com sucesso",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting bus:", error);
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { message: "Autocarro não encontrado" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: "Erro ao eliminar autocarro" },
      { status: 500 }
    );
  }
}
