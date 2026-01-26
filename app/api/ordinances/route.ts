import { ordinanceRepositoryServer } from "@/features/ordinances/repositories/ordinances.repository.server";
import { CreateOrdinanceInput } from "@/features/ordinances/models/ordinances.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const input: CreateOrdinanceInput = await request.json();

    if (!input.name) {
      return NextResponse.json(
        { message: "Nome é obrigatório" },
        { status: 400 }
      );
    }

    const ordinance = await ordinanceRepositoryServer.create(input);

    return NextResponse.json(
      {
        message: "Ordenança criada com sucesso",
        ordinance,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating ordinance:", error);
    return NextResponse.json(
      { message: "Erro ao criar ordenança" },
      { status: 500 }
    );
  }
}
