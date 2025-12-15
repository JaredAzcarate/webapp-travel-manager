"use client";

import { CaravansList } from "@/features/caravans/components/CaravansList";
import { Typography } from "antd";

const { Title } = Typography;

export default function CaravansPage() {
  return (
    <div className="p-6">
      <Title level={2}>Gestão de Caravanas</Title>

      <div className="mt-8">
        <CaravansList />
      </div>
    </div>
  );
}
