"use client";

import { BusesList } from "@/features/buses/components/BusesList";
import { Typography } from "antd";

const { Title } = Typography;

export default function BusesPage() {
  return (
    <div className="p-4 sm:p-6">
      <Title level={2} className="text-xl sm:text-2xl">
        Gestão de Autocarros
      </Title>

      <div className="mt-4 sm:mt-8">
        <BusesList />
      </div>
    </div>
  );
}
