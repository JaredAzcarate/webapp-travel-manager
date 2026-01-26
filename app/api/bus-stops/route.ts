import { busStopRepositoryServer } from "@/features/buses/repositories/busStops.repository.server";
import { CreateBusStopInput } from "@/features/buses/models/busStops.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const input: CreateBusStopInput = await request.json();

    if (!input.busId || !input.chapelId) {
      return NextResponse.json(
        { message: "BusId e chapelId são obrigatórios" },
        { status: 400 }
      );
    }

    const busStop = await busStopRepositoryServer.create(input);

    return NextResponse.json(
      {
        message: "Parada criada com sucesso",
        busStop,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating bus stop:", error);
    return NextResponse.json(
      { message: "Erro ao criar parada" },
      { status: 500 }
    );
  }
}
