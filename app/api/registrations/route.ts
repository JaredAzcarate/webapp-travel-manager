import { registrationRepositoryServer } from "@/features/registrations/repositories/registrations.repository.server";
import { CreateRegistrationInput } from "@/features/registrations/models/registrations.model";
import { getPanelSessionUser } from "@/lib/auth/panel-session.server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const input: CreateRegistrationInput = await request.json();

    const panelUser = await getPanelSessionUser();
    if (panelUser?.role === "SECRETARY") {
      if (!panelUser.chapelId || input.chapelId !== panelUser.chapelId) {
        return NextResponse.json(
          { message: "Só pode inscrever participantes da sua capela" },
          { status: 403 }
        );
      }
    }

    if (!input.caravanId) {
      return NextResponse.json(
        { message: "caravanId é obrigatório" },
        { status: 400 }
      );
    }

    if (!input.phone || !input.fullName) {
      return NextResponse.json(
        { message: "phone e fullName são obrigatórios" },
        { status: 400 }
      );
    }

    const registration = await registrationRepositoryServer.create(input);

    return NextResponse.json(
      {
        message: "Inscrição criada com sucesso",
        registration,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating registration:", error);
    if (error instanceof Error) {
      return NextResponse.json(
        { message: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: "Erro ao criar inscrição" },
      { status: 500 }
    );
  }
}
