import { caravanRepositoryServer } from "@/features/caravans/repositories/caravans.repository.server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const caravans = await caravanRepositoryServer.getActive();
    return NextResponse.json({ caravans }, { status: 200 });
  } catch (error) {
    console.error("Error fetching active viagens ao templo:", error);
    return NextResponse.json(
      { message: "Erro ao buscar viagens ativas" },
      { status: 500 }
    );
  }
}
