"use client";

import { ManagersList } from "@/features/auth/components/ManagersList";
import { Typography } from "antd";

const { Title } = Typography;

export default function ManagersPage() {
  return (
    <div className="p-4 sm:p-6">
      <Title level={2} className="text-xl sm:text-2xl">
        Gestores
      </Title>

      <div className="mt-4 sm:mt-8">
        <ManagersList />
      </div>
    </div>
  );
}

