import {
  closeCaravanFinances,
  reopenCaravanFinances,
} from "@/features/finances/services/financeSummary.server";
import { requireAdminRole } from "@/lib/auth/panel-session.server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminRole();
    if (!auth.ok) {
      return auth.response;
    }

    const { caravanId, action = "close" } = await request.json();

    if (!caravanId) {
      return NextResponse.json(
        { message: "caravanId é obrigatório" },
        { status: 400 }
      );
    }

    if (action !== "close" && action !== "reopen") {
      return NextResponse.json(
        { message: "action deve ser 'close' ou 'reopen'" },
        { status: 400 }
      );
    }

    const caravan =
      action === "reopen"
        ? await reopenCaravanFinances(caravanId)
        : await closeCaravanFinances(caravanId);

    return NextResponse.json(
      {
        message:
          action === "reopen"
            ? "Acompanhamento da viagem reaberto com sucesso"
            : "Acompanhamento da viagem finalizado com sucesso",
        caravan,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating caravan finances status:", error);
    return NextResponse.json(
      { message: "Erro ao atualizar o acompanhamento da viagem" },
      { status: 500 }
    );
  }
}
