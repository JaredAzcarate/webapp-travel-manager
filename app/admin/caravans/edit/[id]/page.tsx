"use client";

import { CaravanForm } from "@/features/caravans/components/CaravanForm";
import { useCaravan } from "@/features/caravans/hooks/caravans.hooks";
import { Button, Spin, Typography } from "antd";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

const { Title } = Typography;

export default function EditCaravanPage() {
  const params = useParams();
  const router = useRouter();
  const caravanId = params.id as string;

  const { caravan, loading, error } = useCaravan(caravanId);

  useEffect(() => {
    if (error && !loading) {
      router.push("/admin/caravans");
    }
  }, [error, loading, router]);

  if (loading) {
    return (
      <div className="p-6">
        <Spin size="large" />
      </div>
    );
  }

  if (!caravan) {
    return (
      <div className="p-6">
        <Title level={2}>Viagem não encontrada</Title>
        <Button onClick={() => router.push("/admin/caravans")}>
          Voltar para lista
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Title level={2}>Editar Viagem</Title>

      <div className="mt-6">
        <CaravanForm
          mode="edit"
          caravanId={caravanId}
          initialCaravanData={caravan}
        />
      </div>
    </div>
  );
}

