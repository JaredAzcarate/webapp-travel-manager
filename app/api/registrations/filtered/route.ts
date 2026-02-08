import { registrationRepositoryServer } from "@/features/registrations/repositories/registrations.repository.server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const caravanId = searchParams.get("caravanId");
    const chapelId = searchParams.get("chapelId") || undefined;
    const paymentStatus = searchParams.get("paymentStatus") || undefined;
    const participationStatus = searchParams.get("participationStatus") || undefined;
    const withOrdinances = searchParams.get("withOrdinances") === "true";

    if (!caravanId) {
      return NextResponse.json(
        { message: "caravanId é obrigatório" },
        { status: 400 }
      );
    }

    const registrations = await registrationRepositoryServer.getFiltered(
      caravanId,
      { chapelId, paymentStatus, participationStatus, withOrdinances }
    );

    return NextResponse.json(
      { registrations },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error getting filtered registrations:", error);
    return NextResponse.json(
      { message: "Erro ao buscar inscrições" },
      { status: 500 }
    );
  }
}
