"use client";

import { CaravanDistributionView } from "@/features/caravans/components/CaravanDistributionView";
import { Button } from "antd";
import { useRouter } from "next/navigation";
import { Suspense } from "react";

export default function CaravanDistributionPage() {
  const router = useRouter();

  return (
    <div className="p-6">
      <div className="mb-4">
        <Button onClick={() => router.push("/admin/caravans")}>
          Voltar para Lista de Viagens
        </Button>
      </div>
      <Suspense fallback={<div>Carregando...</div>}>
        <CaravanDistributionView />
      </Suspense>
    </div>
  );
}
