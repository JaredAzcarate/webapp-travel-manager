"use client";

import { OrdinanceForm } from "@/features/ordinances/components/OrdinanceForm";
import { useOrdinance } from "@/features/ordinances/hooks/ordinances.hooks";
import { Button, Spin, Typography } from "antd";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

const { Title } = Typography;

export default function EditOrdinancePage() {
  const params = useParams();
  const router = useRouter();
  const ordinanceId = params.id as string;

  const { ordinance, loading, error } = useOrdinance(ordinanceId);

  useEffect(() => {
    if (error && !loading) {
      router.push("/admin/ordinances");
    }
  }, [error, loading, router]);

  if (loading) {
    return (
      <div className="p-6">
        <Spin size="large" />
      </div>
    );
  }

  if (!ordinance) {
    return (
      <div className="p-6">
        <Title level={2}>Ordenança não encontrada</Title>
        <Button onClick={() => router.push("/admin/ordinances")}>
          Voltar para lista
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Title level={2}>Editar Ordenança</Title>

      <div className="mt-6">
        <OrdinanceForm
          mode="edit"
          ordinanceId={ordinanceId}
          initialOrdinanceData={ordinance}
        />
      </div>
    </div>
  );
}
