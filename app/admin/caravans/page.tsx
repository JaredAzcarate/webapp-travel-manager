"use client";

import { CaravansList } from "@/features/caravans/components/CaravansList";
import { Typography } from "antd";

const { Title } = Typography;

export default function CaravansPage() {
  return (
    <div className="p-4 sm:p-6">
      <Title level={2} className="text-xl sm:text-2xl">
        Gestão de Viagens
      </Title>

      <div className="mt-4 sm:mt-8">
        <CaravansList />
      </div>
    </div>
  );
}
