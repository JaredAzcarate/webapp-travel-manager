import {
  createChapelTransferWithCreditBox,
} from "@/features/finances/services/financeSummary.server";
import { requireAdminRole } from "@/lib/auth/panel-session.server";
import { Timestamp } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { chapelTransferRepositoryServer } from "@/features/finances/repositories/chapelTransfers.repository.server";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminRole();
    if (!auth.ok) {
      return auth.response;
    }

    const searchParams = request.nextUrl.searchParams;
    const caravanId = searchParams.get("caravanId");
    const chapelId = searchParams.get("chapelId");

    if (!caravanId || !chapelId) {
      return NextResponse.json(
        { message: "caravanId e chapelId são obrigatórios" },
        { status: 400 }
      );
    }

    const transfers = await chapelTransferRepositoryServer.getByCaravanAndChapel(
      caravanId,
      chapelId
    );

    return NextResponse.json({ transfers }, { status: 200 });
  } catch (error) {
    console.error("Error fetching chapel transfers:", error);
    return NextResponse.json(
      { message: "Erro ao buscar transferências" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminRole();
    if (!auth.ok) {
      return auth.response;
    }

    const body = await request.json();
    const {
      caravanId,
      chapelId,
      amount,
      transferredAt,
      notes,
      applyCreditAmount,
    } = body;

    if (!caravanId || !chapelId || amount === undefined || !transferredAt) {
      return NextResponse.json(
        { message: "caravanId, chapelId, amount e transferredAt são obrigatórios" },
        { status: 400 }
      );
    }

    const parsedAmount = Number(amount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { message: "O montante deve ser superior a zero" },
        { status: 400 }
      );
    }

    const creditRequested = Number(applyCreditAmount ?? 0);
    const result = await createChapelTransferWithCreditBox({
      caravanId,
      chapelId,
      amount: Math.round(parsedAmount * 100) / 100,
      transferredAt: Timestamp.fromDate(new Date(transferredAt)),
      registeredBy: auth.user.id,
      ...(typeof notes === "string" && notes.trim()
        ? { notes: notes.trim() }
        : {}),
      ...(!Number.isNaN(creditRequested) && creditRequested > 0
        ? { applyCreditAmount: Math.round(creditRequested * 100) / 100 }
        : {}),
    });

    return NextResponse.json(
      {
        message: "Transferência registada com sucesso",
        transfer: result.transfer,
        creditUsed: result.creditUsed,
        creditGenerated: result.creditGenerated,
        chapelCreditBalance: result.chapelCreditBalance,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating chapel transfer:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Erro ao registar transferência";
    return NextResponse.json({ message }, { status: 500 });
  }
}
