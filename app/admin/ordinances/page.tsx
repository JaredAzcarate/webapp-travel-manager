"use client";

import { OrdinancesList } from "@/features/ordinances/components/OrdinancesList";
import { Typography } from "antd";

const { Title } = Typography;

export default function OrdinancesPage() {
  return (
    <div className="p-6">
      <Title level={2}>Gestão de Ordenanças</Title>

      <div className="mt-8">
        <OrdinancesList />
      </div>
    </div>
  );
}
