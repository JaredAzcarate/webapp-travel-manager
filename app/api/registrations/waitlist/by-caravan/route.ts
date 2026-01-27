import { registrationRepositoryServer } from "@/features/registrations/repositories/registrations.repository.server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const caravanId = searchParams.get("caravanId");

    if (!caravanId) {
      return NextResponse.json(
        { message: "caravanId é obrigatório" },
        { status: 400 }
      );
    }

    const registrations = await registrationRepositoryServer.getWaitlistByCaravanId(
      caravanId
    );

    return NextResponse.json({ registrations }, { status: 200 });
  } catch (error) {
    console.error("Error getting waitlist by caravan:", error);
    return NextResponse.json(
      { message: "Erro ao buscar lista de espera" },
      { status: 500 }
    );
  }
}
