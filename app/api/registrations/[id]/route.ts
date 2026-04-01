import { caravanRepositoryServer } from "@/features/caravans/repositories/caravans.repository.server";
import { registrationRepositoryServer } from "@/features/registrations/repositories/registrations.repository.server";
import { UpdateRegistrationInput } from "@/features/registrations/models/registrations.model";
import { validateOrdinanceSelectionRules } from "@/features/registrations/services/validateOrdinanceSelections.server";
import { denySecretaryIfWrongChapel } from "@/lib/auth/registration-access.server";
import { requirePanelSession } from "@/lib/auth/panel-session.server";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePanelSession();
    if (!auth.ok) {
      return auth.response;
    }

    const { id } = await params;

    const denied = await denySecretaryIfWrongChapel(id);
    if (denied) {
      return denied;
    }

    const input: UpdateRegistrationInput = await request.json();

    if (auth.user.role === "SECRETARY") {
      delete (input as { chapelId?: string }).chapelId;
    }

    const existing = await registrationRepositoryServer.getById(id);
    const caravan = await caravanRepositoryServer.getById(existing.caravanId);
    const mergedOrdinances =
      input.ordinances !== undefined ? input.ordinances : existing.ordinances;
    if (mergedOrdinances?.length) {
      validateOrdinanceSelectionRules(mergedOrdinances, caravan);
    }

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
    const auth = await requirePanelSession();
    if (!auth.ok) {
      return auth.response;
    }

    const { id } = await params;

    const denied = await denySecretaryIfWrongChapel(id);
    if (denied) {
      return denied;
    }

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
