"use client";

import {
  useUpdateCaravanOrdinanceCapacities,
} from "@/features/caravans/hooks/caravans.hooks";
import type { CaravanWithId } from "@/features/caravans/models/caravans.model";
import {
  type CapacityValue,
  isGenderSpecificLimit,
} from "@/features/caravans/utils/ordinanceCapacity.utils";
import { useOrdinances } from "@/features/ordinances/hooks/ordinances.hooks";
import { App, Button, Card, InputNumber, Typography } from "antd";
import { useEffect, useMemo, useState } from "react";

const { Text, Paragraph } = Typography;

function formatCount(c: CapacityValue | undefined): string {
  if (c === undefined) return "0";
  if (isGenderSpecificLimit(c)) {
    return `M: ${c.M ?? 0} · F: ${c.F ?? 0}`;
  }
  return String(c);
}

export function CaravanOrdinanceCapacitiesEditor({
  caravan,
}: {
  caravan: CaravanWithId;
}) {
  const { notification } = App.useApp();
  const { ordinances } = useOrdinances();
  const ordinanceMap = useMemo(
    () => Object.fromEntries(ordinances.map((o) => [o.id, o])),
    [ordinances]
  );

  const [limits, setLimits] = useState<
    NonNullable<CaravanWithId["ordinanceCapacityLimits"]>
  >(() =>
    JSON.parse(JSON.stringify(caravan.ordinanceCapacityLimits || {}))
  );

  useEffect(() => {
    setLimits(JSON.parse(JSON.stringify(caravan.ordinanceCapacityLimits || {})));
  }, [caravan]);

  const { mutateAsync, isPending } = useUpdateCaravanOrdinanceCapacities();

  const updateSimple = (ordId: string, slot: string, value: number | null) => {
    setLimits((prev) => {
      const next = JSON.parse(JSON.stringify(prev)) as typeof prev;
      if (!next[ordId]) next[ordId] = {};
      (next[ordId] as Record<string, CapacityValue>)[slot] = Math.max(
        0,
        value ?? 0
      );
      return next;
    });
  };

  const updateMF = (
    ordId: string,
    slot: string,
    key: "M" | "F",
    value: number | null
  ) => {
    setLimits((prev) => {
      const next = JSON.parse(JSON.stringify(prev)) as typeof prev;
      if (!next[ordId]) next[ordId] = {};
      const cur = (next[ordId] as Record<string, CapacityValue>)[slot];
      const base =
        isGenderSpecificLimit(cur) ? { ...cur } : { M: 0, F: 0 };
      base[key] = Math.max(0, value ?? 0);
      (next[ordId] as Record<string, CapacityValue>)[slot] = base;
      return next;
    });
  };

  const handleSave = async () => {
    try {
      await mutateAsync({
        caravanId: caravan.id,
        ordinanceCapacityLimits: limits,
      });
      notification.success({
        title: "Guardado",
        description: "Os cupos desta viagem foram atualizados.",
      });
    } catch (e) {
      notification.error({
        title: "Erro",
        description: e instanceof Error ? e.message : "Falha ao guardar",
      });
    }
  };

  const entries = Object.entries(limits);

  if (entries.length === 0) {
    return (
      <Paragraph type="secondary">
        Não há cupos de ordenanças nesta viagem. São gerados automaticamente ao
        criar a viagem, com base nas ordenanças configuradas no sistema.
      </Paragraph>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Text type="secondary">
        Ajuste os limites por horário. Não pode definir um valor inferior ao
        número de inscrições já registadas nem remover horários com inscrições.
      </Text>

      {entries.map(([ordId, slots]) => (
        <Card
          key={ordId}
          title={ordinanceMap[ordId]?.name || ordId}
          size="small"
        >
          <div className="flex flex-col gap-4">
            {Object.entries(slots || {}).map(([slot, cap]) => {
              const count = caravan.ordinanceCapacityCounts?.[ordId]?.[slot];
              return (
                <div
                  key={slot}
                  className="flex flex-wrap items-center gap-4 border-b border-gray-100 pb-3 last:border-0"
                >
                  <span className="font-medium min-w-[140px]">{slot}</span>
                  {isGenderSpecificLimit(cap as CapacityValue) ? (
                    <>
                      <label className="flex items-center gap-2">
                        <span className="text-gray-600">Homens</span>
                        <InputNumber
                          min={0}
                          value={(cap as { M: number; F: number }).M}
                          onChange={(v) => updateMF(ordId, slot, "M", v)}
                        />
                      </label>
                      <label className="flex items-center gap-2">
                        <span className="text-gray-600">Mulheres</span>
                        <InputNumber
                          min={0}
                          value={(cap as { M: number; F: number }).F}
                          onChange={(v) => updateMF(ordId, slot, "F", v)}
                        />
                      </label>
                    </>
                  ) : (
                    <label className="flex items-center gap-2">
                      <span className="text-gray-600">Lugares</span>
                      <InputNumber
                        min={0}
                        value={cap as number}
                        onChange={(v) => updateSimple(ordId, slot, v)}
                      />
                    </label>
                  )}
                  <Text type="secondary" className="text-sm">
                    Inscritos: {formatCount(count)}
                  </Text>
                </div>
              );
            })}
          </div>
        </Card>
      ))}

      <Button type="primary" loading={isPending} onClick={handleSave}>
        Guardar cupos
      </Button>
    </div>
  );
}
