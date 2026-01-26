import { busStopRepositoryServer } from "@/features/buses/repositories/busStops.repository.server";
import { UpdateBusStopInput } from "@/features/buses/models/busStops.model";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const input: UpdateBusStopInput = await request.json();
    const { id } = await params;

    const busStop = await busStopRepositoryServer.update(id, input);

    return NextResponse.json(
      {
        message: "Parada atualizada com sucesso",
        busStop,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating bus stop:", error);
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { message: "Parada não encontrada" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: "Erro ao atualizar parada" },
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

    await busStopRepositoryServer.delete(id);

    return NextResponse.json(
      {
        message: "Parada eliminada com sucesso",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting bus stop:", error);
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { message: "Parada não encontrada" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: "Erro ao eliminar parada" },
      { status: 500 }
    );
  }
}
