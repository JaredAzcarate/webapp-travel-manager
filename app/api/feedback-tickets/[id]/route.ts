import { feedbackTicketsRepositoryServer } from "@/features/feedback/repositories/feedbackTickets.repository.server";
import { requireAdminRole } from "@/lib/auth/panel-session.server";
import { developmentOnlyResponse } from "@/lib/dev-only.server";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdminRole();
  if (!authResult.ok) {
    return authResult.response;
  }

  const { id } = await context.params;
  try {
    const body = await request.json();
    const status = body.status as "OPEN" | "ARCHIVED" | undefined;
    const notes =
      typeof body.notes === "string" ? body.notes.slice(0, 8000) : undefined;

    if (status && status !== "OPEN" && status !== "ARCHIVED") {
      return NextResponse.json({ message: "Estado inválido" }, { status: 400 });
    }

    const update: Record<string, unknown> = {};
    if (status !== undefined) update.status = status;
    if (notes !== undefined) update.notes = notes;

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ message: "Nada para atualizar" }, { status: 400 });
    }

    await feedbackTicketsRepositoryServer.update(id, update);
    return NextResponse.json({ message: "Atualizado" }, { status: 200 });
  } catch (error) {
    console.error("PATCH feedback-tickets:", error);
    return NextResponse.json(
      { message: "Erro ao atualizar" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const devOnly = developmentOnlyResponse();
  if (devOnly) {
    return devOnly;
  }

  const authResult = await requireAdminRole();
  if (!authResult.ok) {
    return authResult.response;
  }

  const { id } = await context.params;
  try {
    await feedbackTicketsRepositoryServer.delete(id);
    return NextResponse.json({ message: "Feedback eliminado" }, { status: 200 });
  } catch (error) {
    console.error("DELETE feedback-tickets:", error);
    return NextResponse.json(
      { message: "Erro ao eliminar feedback" },
      { status: 500 }
    );
  }
}
