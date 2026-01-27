import { registrationRepositoryServer } from "@/features/registrations/repositories/registrations.repository.server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const registration = await registrationRepositoryServer.markPaymentAsPaid(id);

    return NextResponse.json(
      {
        message: "Pagamento marcado como realizado com sucesso",
        registration,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error marking payment as paid:", error);
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { message: "Inscrição não encontrada" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: "Erro ao marcar pagamento" },
      { status: 500 }
    );
  }
}
