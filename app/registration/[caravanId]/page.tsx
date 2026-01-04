"use client";

import { useCaravan } from "@/features/caravans/hooks/caravans.hooks";
import { RegistrationForm } from "@/features/registrations/components/RegistrationForm";
import { Alert, Card, Spin, Typography } from "antd";
import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";

const { Title } = Typography;

export default function PublicRegistrationPage() {
  const router = useRouter();
  const params = useParams();
  const caravanId = params.caravanId as string;

  const { caravan, loading } = useCaravan(caravanId || "");

  const isFormOpen = useMemo(() => {
    if (!caravan) return false;
    const now = new Date();
    const formOpenAt = caravan.formOpenAt?.toDate();
    const formCloseAt = caravan.formCloseAt?.toDate();

    if (!formOpenAt || !formCloseAt) return false;

    return now >= formOpenAt && now <= formCloseAt;
  }, [caravan]);

  const handleSuccess = () => {
    router.push("/registration/success");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (!caravan) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <Alert
              message="Caravana não encontrada"
              description="A caravana solicitada não existe ou não está disponível."
              type="error"
              showIcon
            />
          </Card>
        </div>
      </div>
    );
  }

  if (!isFormOpen) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <Alert
              message="Formulário fechado"
              description="O formulário de inscrição não está aberto no momento."
              type="warning"
              showIcon
            />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <Title level={2} className="mb-6">
            Inscrição para {caravan.name}
          </Title>
          <RegistrationForm
            mode="create"
            caravanId={caravan.id}
            onSuccess={handleSuccess}
          />
        </Card>
      </div>
    </div>
  );
}
