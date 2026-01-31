"use client";

import { PublicContent } from "@/common/components/PublicContent";
import { toDate } from "@/common/utils/timestamp.utils";
import { useCaravan } from "@/features/caravans/hooks/caravans.hooks";
import { RegistrationForm } from "@/features/registrations/components/RegistrationForm";
import { Alert, App, Card, Spin, Typography } from "antd";
import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";

const { Title } = Typography;

export default function PublicRegistrationPage() {
  const router = useRouter();
  const params = useParams();
  const { notification } = App.useApp();
  const caravanId = params.caravanId as string;

  const { caravan, loading } = useCaravan(caravanId || "");

  const isFormOpen = useMemo(() => {
    if (!caravan) return false;
    const now = new Date();
    const formOpenAt = toDate(caravan.formOpenAt);
    const formCloseAt = toDate(caravan.formCloseAt);

    if (!formOpenAt || !formCloseAt) return false;

    return now >= formOpenAt && now <= formCloseAt;
  }, [caravan]);

  const handleSuccess = () => {
    notification.success({
      title: "Sucesso",
      description: "A inscrição foi criada com sucesso",
    });
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
      <PublicContent>
        <Card>
          <Alert
            message="Caravana não encontrada"
            description="A caravana solicitada não existe ou não está disponível."
            type="error"
            showIcon
          />
        </Card>
      </PublicContent>
    );
  }

  if (!isFormOpen) {
    return (
      <PublicContent>
        <Card>
          <Alert
            description="O formulário de inscrição não está aberto no momento."
            type="warning"
            showIcon
          />
        </Card>
      </PublicContent>
    );
  }

  return (
    <PublicContent>

        <Title level={3}>
          {caravan.name}
        </Title>

      <RegistrationForm
        mode="create"
        caravanId={caravan.id}
        onSuccess={handleSuccess}
      />
    </PublicContent>
  );
}
