"use client";

import { ChapelForm } from "@/features/chapels/components/ChapelForm";
import { useChapel } from "@/features/chapels/hooks/chapels.hooks";
import { Button, Spin, Typography } from "antd";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

const { Title } = Typography;

export default function EditChapelPage() {
  const params = useParams();
  const router = useRouter();
  const chapelId = params.id as string;

  const { chapel, loading, error } = useChapel(chapelId);

  useEffect(() => {
    if (error && !loading) {
      router.push("/admin/chapels");
    }
  }, [error, loading, router]);

  if (loading) {
    return (
      <div className="p-6">
        <Spin size="large" />
      </div>
    );
  }

  if (!chapel) {
    return (
      <div className="p-6">
        <Title level={2}>Capela não encontrada</Title>
        <Button onClick={() => router.push("/admin/chapels")}>
          Voltar para lista
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Title level={2}>Editar Capela</Title>

      <div className="mt-6">
        <ChapelForm
          mode="edit"
          chapelId={chapelId}
          initialChapelData={chapel}
        />
      </div>
    </div>
  );
}

