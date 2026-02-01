import { CreateCaravanInput } from "@/features/caravans/models/caravans.model";
import { caravanRepositoryServer } from "@/features/caravans/repositories/caravans.repository.server";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const caravans = await caravanRepositoryServer.getAll();
    return NextResponse.json({ caravans }, { status: 200 });
  } catch (error) {
    console.error("Error fetching caravans:", error);
    return NextResponse.json(
      { message: "Erro ao buscar viagens ao templo" },
      { status: 500 }
    );
  }
}

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
        message: "Viagem ao templo criado com sucesso",
        caravan,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating caravan:", error);
    return NextResponse.json(
      { message: "Erro ao criar viagem ao templo" },
      { status: 500 }
    );
  }
}
