import { chapelRepositoryServer } from "@/features/chapels/repositories/chapels.repository.server";
import { CreateChapelInput } from "@/features/chapels/models/chapels.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const input: CreateChapelInput = await request.json();

    if (!input.name) {
      return NextResponse.json(
        { message: "Nome é obrigatório" },
        { status: 400 }
      );
    }

    const chapel = await chapelRepositoryServer.create(input);

    return NextResponse.json(
      {
        message: "Capela criada com sucesso",
        chapel,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating chapel:", error);
    return NextResponse.json(
      { message: "Erro ao criar capela" },
      { status: 500 }
    );
  }
}
