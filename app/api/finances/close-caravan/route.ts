import { closeCaravanFinances } from "@/features/finances/services/financeSummary.server";
import { requireAdminRole } from "@/lib/auth/panel-session.server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminRole();
    if (!auth.ok) {
      return auth.response;
    }

    const { caravanId } = await request.json();

    if (!caravanId) {
      return NextResponse.json(
        { message: "caravanId é obrigatório" },
        { status: 400 }
      );
    }

    const caravan = await closeCaravanFinances(caravanId);

    return NextResponse.json(
      { message: "Acompanhamento da viagem finalizado com sucesso", caravan },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error closing caravan finances:", error);
    return NextResponse.json(
      { message: "Erro ao finalizar o acompanhamento da viagem" },
      { status: 500 }
    );
  }
}
