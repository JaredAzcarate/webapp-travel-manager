import { busRepositoryServer } from "@/features/buses/repositories/buses.repository.server";
import { caravanRepositoryServer } from "@/features/caravans/repositories/caravans.repository.server";
import { registrationRepositoryServer } from "@/features/registrations/repositories/registrations.repository.server";
import { NextRequest, NextResponse } from "next/server";

/**
 * Public read-only seat summary for registration UX (no panel auth).
 * Returns only capacity, occupied, and available counts.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const caravanId = searchParams.get("caravanId");
    const busId = searchParams.get("busId");

    if (!caravanId || !busId) {
      return NextResponse.json(
        { message: "caravanId e busId são obrigatórios" },
        { status: 400 }
      );
    }

    const caravan = await caravanRepositoryServer.getById(caravanId);

    if (!caravan.isActive) {
      return NextResponse.json(
        { message: "Viagem não disponível" },
        { status: 404 }
      );
    }

    if (!caravan.busIds.includes(busId)) {
      return NextResponse.json(
        { message: "Autocarro não associado a esta viagem" },
        { status: 404 }
      );
    }

    const bus = await busRepositoryServer.getById(busId);
    const capacity = bus.capacity;
    const occupied = await registrationRepositoryServer.countActiveByBus(
      caravanId,
      busId
    );
    const available = Math.max(0, capacity - occupied);

    return NextResponse.json(
      { capacity, occupied, available },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/public/bus-seat-summary:", error);
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { message: "Recurso não encontrado" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: "Erro ao obter resumo de lugares" },
      { status: 500 }
    );
  }
}
