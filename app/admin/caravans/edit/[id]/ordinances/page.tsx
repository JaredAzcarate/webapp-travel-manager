"use client";

import { AdminOnlyGuard } from "@/common/components/AdminOnlyGuard";
import { CaravanOrdinanceCapacitiesEditor } from "@/features/caravans/components/CaravanOrdinanceCapacitiesEditor";
import { useCaravan } from "@/features/caravans/hooks/caravans.hooks";
import { Button, Spin, Typography } from "antd";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

const { Title } = Typography;

export default function EditCaravanOrdinancesPage() {
  const params = useParams();
  const router = useRouter();
  const caravanId = params.id as string;
  const { caravan, loading, error } = useCaravan(caravanId);

  useEffect(() => {
    if (error && !loading) {
      router.push("/admin/caravans");
    }
  }, [error, loading, router]);

  if (loading || !caravan) {
    return (
      <AdminOnlyGuard>
        <div className="p-6">
          <Spin size="large" />
        </div>
      </AdminOnlyGuard>
    );
  }

  return (
    <AdminOnlyGuard>
      <div className="p-6">
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <Button type="link" className="p-0">
            <Link href={`/admin/caravans/edit/${caravanId}`}>
              Voltar à edição da viagem
            </Link>
          </Button>
        </div>
        <Title level={2}>Cupos de ordenanças</Title>
        <p className="text-gray-600 mb-6 max-w-3xl">
          {caravan.name}
        </p>
        <CaravanOrdinanceCapacitiesEditor caravan={caravan} />
      </div>
    </AdminOnlyGuard>
  );
}
