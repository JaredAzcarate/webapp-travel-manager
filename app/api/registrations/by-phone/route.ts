import { registrationRepositoryServer } from "@/features/registrations/repositories/registrations.repository.server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const phone = searchParams.get("phone");
    const caravanId = searchParams.get("caravanId") || undefined;

    if (!phone) {
      return NextResponse.json(
        { message: "phone é obrigatório" },
        { status: 400 }
      );
    }

    const registrations = await registrationRepositoryServer.getByPhone(
      phone,
      caravanId
    );

    return NextResponse.json({ registrations }, { status: 200 });
  } catch (error) {
    console.error("Error getting registrations by phone:", error);
    return NextResponse.json(
      { message: "Erro ao buscar inscrições" },
      { status: 500 }
    );
  }
}
