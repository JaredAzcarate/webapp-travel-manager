import {
  getCaravanFinanceSummary,
  getFinanceOverview,
} from "@/features/finances/services/financeSummary.server";
import { requireAdminRole } from "@/lib/auth/panel-session.server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminRole();
    if (!auth.ok) {
      return auth.response;
    }

    const searchParams = request.nextUrl.searchParams;
    const view = searchParams.get("view");
    const caravanId = searchParams.get("caravanId");

    if (view === "overview") {
      const overview = await getFinanceOverview();
      return NextResponse.json({ overview }, { status: 200 });
    }

    if (!caravanId) {
      return NextResponse.json(
        { message: "caravanId é obrigatório" },
        { status: 400 }
      );
    }

    const summary = await getCaravanFinanceSummary(caravanId);
    return NextResponse.json({ summary }, { status: 200 });
  } catch (error) {
    console.error("Error fetching finance summary:", error);
    return NextResponse.json(
      { message: "Erro ao buscar resumo financeiro" },
      { status: 500 }
    );
  }
}
