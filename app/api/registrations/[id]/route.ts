import { registrationRepositoryServer } from "@/features/registrations/repositories/registrations.repository.server";
import { UpdateRegistrationInput } from "@/features/registrations/models/registrations.model";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const input: UpdateRegistrationInput = await request.json();
    const { id } = await params;

    const registration = await registrationRepositoryServer.update(id, input);

    return NextResponse.json(
      {
        message: "Inscrição atualizada com sucesso",
        registration,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating registration:", error);
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { message: "Inscrição não encontrada" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: "Erro ao atualizar inscrição" },
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

    await registrationRepositoryServer.delete(id);

    return NextResponse.json(
      {
        message: "Inscrição eliminada com sucesso",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting registration:", error);
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { message: "Inscrição não encontrada" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: "Erro ao eliminar inscrição" },
      { status: 500 }
    );
  }
}
