"use client";

import { CaravanForm } from "@/features/caravans/components/CaravanForm";
import { Typography } from "antd";

const { Title } = Typography;

export default function NewCaravanPage() {
  return (
    <div className="p-6">
      <Title level={2}>Criar Nova Caravana</Title>

      <div className="mt-6">
        <CaravanForm mode="create" />
      </div>
    </div>
  );
}

