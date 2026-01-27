import { registrationRepositoryServer } from "@/features/registrations/repositories/registrations.repository.server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const busId = searchParams.get("busId");
    const caravanId = searchParams.get("caravanId");

    if (!busId || !caravanId) {
      return NextResponse.json(
        { message: "busId e caravanId são obrigatórios" },
        { status: 400 }
      );
    }

    const registrations = await registrationRepositoryServer.getCancelledByBusId(
      busId,
      caravanId
    );

    return NextResponse.json({ registrations }, { status: 200 });
  } catch (error) {
    console.error("Error getting cancelled registrations by bus:", error);
    return NextResponse.json(
      { message: "Erro ao buscar inscrições canceladas" },
      { status: 500 }
    );
  }
}
