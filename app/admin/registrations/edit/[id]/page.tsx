"use client";

import { RegistrationForm } from "@/features/registrations/components/RegistrationForm";
import { useRegistration } from "@/features/registrations/hooks/registrations.hooks";
import { Button, Spin, Typography } from "antd";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

const { Title } = Typography;

export default function EditRegistrationPage() {
  const params = useParams();
  const router = useRouter();
  const registrationId = params.id as string;

  const { registration, loading, error } = useRegistration(registrationId);

  useEffect(() => {
    if (error && !loading) {
      router.push("/admin/registrations");
    }
  }, [error, loading, router]);

  if (loading) {
    return (
      <div className="p-6">
        <Spin size="large" />
      </div>
    );
  }

  if (!registration) {
    return (
      <div className="p-6">
        <Title level={2}>Inscrição não encontrada</Title>
        <Button onClick={() => router.push("/admin/registrations")}>
          Voltar para lista
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Title level={2}>Editar Inscrição</Title>

      <div className="mt-6">
        <RegistrationForm
          mode="edit"
          registrationId={registrationId}
          initialRegistrationData={registration}
        />
      </div>
    </div>
  );
}

