"use client";

import { AdminOnlyGuard } from "@/common/components/AdminOnlyGuard";
import { CaravanForm } from "@/features/caravans/components/CaravanForm";
import { useCaravan } from "@/features/caravans/hooks/caravans.hooks";
import { Button, Spin, Typography } from "antd";
import Link from "next/link";
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
      <AdminOnlyGuard>
        <div className="p-6">
          <Spin size="large" />
        </div>
      </AdminOnlyGuard>
    );
  }

  if (!caravan) {
    return (
      <AdminOnlyGuard>
        <div className="p-6">
          <Title level={2}>Viagem não encontrada</Title>
          <Button onClick={() => router.push("/admin/caravans")}>
            Voltar para lista
          </Button>
        </div>
      </AdminOnlyGuard>
    );
  }

  return (
    <AdminOnlyGuard>
      <div className="p-6">
        <Title level={2}>Editar Viagem</Title>

        <div className="mt-4">
          <Link href={`/admin/caravans/edit/${caravanId}/ordinances`}>
            <Button type="default">Configurar cupos de ordenanças desta viagem</Button>
          </Link>
        </div>

        <div className="mt-6">
          <CaravanForm
            mode="edit"
            caravanId={caravanId}
            initialCaravanData={caravan}
          />
        </div>
      </div>
    </AdminOnlyGuard>
  );
}

