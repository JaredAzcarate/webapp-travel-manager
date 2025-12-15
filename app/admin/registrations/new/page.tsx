"use client";

import { RegistrationForm } from "@/features/registrations/components/RegistrationForm";
import { Typography } from "antd";

const { Title } = Typography;

export default function NewRegistrationPage() {
  return (
    <div className="p-6">
      <Title level={2}>Criar Nova Inscrição</Title>

      <div className="mt-6">
        <RegistrationForm mode="create" />
      </div>
    </div>
  );
}

