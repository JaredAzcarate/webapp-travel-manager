import { registrationRepositoryServer } from "@/features/registrations/repositories/registrations.repository.server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const registration = await registrationRepositoryServer.cancelRegistration(id);

    return NextResponse.json(
      {
        message: "Participação cancelada com sucesso",
        registration,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error cancelling registration:", error);
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { message: "Inscrição não encontrada" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: "Erro ao cancelar participação" },
      { status: 500 }
    );
  }
}
