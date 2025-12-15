"use client";

import { RegistrationsList } from "@/features/registrations/components/RegistrationsList";
import { Typography } from "antd";

const { Title } = Typography;

export default function RegistrationsPage() {
  return (
    <div className="p-6">
      <Title level={2}>Gestão de Inscrições</Title>

      <div className="mt-8">
        <RegistrationsList />
      </div>
    </div>
  );
}
