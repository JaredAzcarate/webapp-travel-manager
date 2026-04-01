import type { CaravanWithId } from "@/features/caravans/models/caravans.model";
import { caravanRepositoryServer } from "@/features/caravans/repositories/caravans.repository.server";
import {
  mergeOrdinanceCapacityCounts,
  validateOrdinanceCapacityLimitsUpdate,
} from "@/features/caravans/services/validateOrdinanceCapacityUpdate.server";
import { requireAdminRole } from "@/lib/auth/panel-session.server";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdminRole();
  if (!authResult.ok) {
    return authResult.response;
  }

  const { id: caravanId } = await context.params;

  try {
    const body = await request.json();
    const ordinanceCapacityLimits = body.ordinanceCapacityLimits as
      | CaravanWithId["ordinanceCapacityLimits"]
      | undefined;

    if (!ordinanceCapacityLimits || typeof ordinanceCapacityLimits !== "object") {
      return NextResponse.json(
        { message: "ordinanceCapacityLimits é obrigatório" },
        { status: 400 }
      );
    }

    const caravan = await caravanRepositoryServer.getById(caravanId);
    const validation = validateOrdinanceCapacityLimitsUpdate(
      caravan,
      ordinanceCapacityLimits as NonNullable<CaravanWithId["ordinanceCapacityLimits"]>
    );

    if (!validation.ok) {
      return NextResponse.json({ message: validation.message }, { status: 400 });
    }

    const ordinanceCapacityCounts = mergeOrdinanceCapacityCounts(
      caravan,
      ordinanceCapacityLimits as NonNullable<CaravanWithId["ordinanceCapacityLimits"]>
    );

    const updated = await caravanRepositoryServer.update(caravanId, {
      ordinanceCapacityLimits: ordinanceCapacityLimits as NonNullable<
        CaravanWithId["ordinanceCapacityLimits"]
      >,
      ordinanceCapacityCounts,
    });

    return NextResponse.json({ caravan: updated }, { status: 200 });
  } catch (error) {
    console.error("PATCH ordinance-capacities:", error);
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ message: "Viagem não encontrada" }, { status: 404 });
    }
    return NextResponse.json(
      { message: "Erro ao atualizar cupos" },
      { status: 500 }
    );
  }
}
