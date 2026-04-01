import { registrationRepositoryServer } from "@/features/registrations/repositories/registrations.repository.server";
import { filterRegistrationsForPanelUser } from "@/lib/auth/registration-access.server";
import { requirePanelSession } from "@/lib/auth/panel-session.server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePanelSession();
    if (!auth.ok) {
      return auth.response;
    }

    const searchParams = request.nextUrl.searchParams;
    const caravanId = searchParams.get("caravanId");
    let chapelId = searchParams.get("chapelId") || undefined;

    if (auth.user.role === "SECRETARY") {
      chapelId = auth.user.chapelId;
      if (!chapelId) {
        return NextResponse.json(
          { message: "Conta de secretário sem capela" },
          { status: 403 }
        );
      }
    }
    const paymentStatus = searchParams.get("paymentStatus") || undefined;
    const participationStatus = searchParams.get("participationStatus") || undefined;
    const withOrdinances = searchParams.get("withOrdinances") === "true";

    if (!caravanId) {
      return NextResponse.json(
        { message: "caravanId é obrigatório" },
        { status: 400 }
      );
    }

    let registrations = await registrationRepositoryServer.getFiltered(
      caravanId,
      { chapelId, paymentStatus, participationStatus, withOrdinances }
    );

    registrations = filterRegistrationsForPanelUser(auth.user, registrations);

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
