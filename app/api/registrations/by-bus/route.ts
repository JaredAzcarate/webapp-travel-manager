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
    const busId = searchParams.get("busId");
    const caravanId = searchParams.get("caravanId");

    if (!busId || !caravanId) {
      return NextResponse.json(
        { message: "busId e caravanId são obrigatórios" },
        { status: 400 }
      );
    }

    let registrations = await registrationRepositoryServer.getByBusId(
      busId,
      caravanId
    );

    registrations = filterRegistrationsForPanelUser(auth.user, registrations);

    return NextResponse.json({ registrations }, { status: 200 });
  } catch (error) {
    console.error("Error getting registrations by bus:", error);
    return NextResponse.json(
      { message: "Erro ao buscar inscrições" },
      { status: 500 }
    );
  }
}
