import { busRepositoryServer } from "@/features/buses/repositories/buses.repository.server";
import { CreateBusInput } from "@/features/buses/models/buses.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const input: CreateBusInput = await request.json();

    if (!input.name || !input.capacity) {
      return NextResponse.json(
        { message: "Nome e capacidade são obrigatórios" },
        { status: 400 }
      );
    }

    const bus = await busRepositoryServer.create(input);

    return NextResponse.json(
      {
        message: "Autocarro criado com sucesso",
        bus,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating bus:", error);
    return NextResponse.json(
      { message: "Erro ao criar autocarro" },
      { status: 500 }
    );
  }
}
