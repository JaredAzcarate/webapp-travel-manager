import { doTimeSlotsOverlap } from "@/common/utils/ordinances.utils";
import type { CaravanWithId } from "@/features/caravans/models/caravans.model";
import type { Registration } from "@/features/registrations/models/registrations.model";

const MAX_DISTINCT = 3;
const MAX_PER_ORDINANCE = 2;
const MAX_TOTAL = 6;

type OrdRow = Registration["ordinances"][number];

/**
 * Structural validation for ordinance rows (counts, overlap, caravan config keys).
 * Capacity availability is still enforced in the registration transaction.
 */
export function validateOrdinanceSelectionRules(
  ordinances: OrdRow[] | undefined,
  caravan: CaravanWithId
): void {
  const filled = (ordinances || []).filter((o) => o.ordinanceId && o.slot);
  if (filled.length === 0) {
    return;
  }

  if (filled.length > MAX_TOTAL) {
    throw new Error(
      "Máximo 6 sessões (até 3 ordenanças com até 2 sessões cada)"
    );
  }

  const byOrd: Record<string, OrdRow[]> = {};
  for (const o of filled) {
    const id = o.ordinanceId;
    if (!byOrd[id]) byOrd[id] = [];
    byOrd[id].push(o);
  }

  if (Object.keys(byOrd).length > MAX_DISTINCT) {
    throw new Error("Máximo 3 tipos de ordenanças diferentes");
  }

  for (const id of Object.keys(byOrd)) {
    const rows = byOrd[id];
    if (rows.length > MAX_PER_ORDINANCE) {
      throw new Error("Máximo 2 sessões por ordenança");
    }
    const slots = rows.map((r) => r.slot!);
    if (new Set(slots).size !== slots.length) {
      throw new Error("Não pode repetir o mesmo horário na mesma ordenança");
    }
  }

  for (let i = 0; i < filled.length; i++) {
    for (let j = i + 1; j < filled.length; j++) {
      const a = filled[i].slot!;
      const b = filled[j].slot!;
      if (doTimeSlotsOverlap(a, b)) {
        throw new Error("Os horários das ordenanças não podem sobrepor-se");
      }
    }
  }

  const limits = caravan.ordinanceCapacityLimits;
  for (const o of filled) {
    const slotLimit = limits?.[o.ordinanceId]?.[o.slot!];
    if (slotLimit === undefined) {
      throw new Error(
        "Uma ou mais ordenanças/horários não estão disponíveis nesta viagem"
      );
    }
  }
}
