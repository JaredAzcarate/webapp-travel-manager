"use client";

import { OrdinancesList } from "@/features/ordinances/components/OrdinancesList";
import { Typography } from "antd";

const { Title } = Typography;

export default function OrdinancesPage() {
  return (
    <div className="p-4 sm:p-6">
      <Title level={2} className="text-xl sm:text-2xl">
        Gestão de Ordenanças
      </Title>

      <div className="mt-4 sm:mt-8">
        <OrdinancesList />
      </div>
    </div>
  );
}
