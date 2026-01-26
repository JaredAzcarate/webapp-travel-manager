import { caravanRepositoryServer } from "@/features/caravans/repositories/caravans.repository.server";
import { CreateCaravanInput } from "@/features/caravans/models/caravans.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const input: CreateCaravanInput = await request.json();

    if (!input.name) {
      return NextResponse.json(
        { message: "Nome é obrigatório" },
        { status: 400 }
      );
    }

    const caravan = await caravanRepositoryServer.create(input);

    return NextResponse.json(
      {
        message: "Caravana criada com sucesso",
        caravan,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating caravan:", error);
    return NextResponse.json(
      { message: "Erro ao criar caravana" },
      { status: 500 }
    );
  }
}
