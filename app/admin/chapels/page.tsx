"use client";

import { AdminOnlyGuard } from "@/common/components/AdminOnlyGuard";
import { ChapelsList } from "@/features/chapels/components/ChapelsList";
import { Typography } from "antd";

const { Title } = Typography;

export default function ChapelsPage() {
  return (
    <AdminOnlyGuard>
      <div className="p-4 sm:p-6">
        <Title level={2} className="text-xl sm:text-2xl">
          Gestão de Capelas
        </Title>

        <div className="mt-4 sm:mt-8">
          <ChapelsList />
        </div>
      </div>
    </AdminOnlyGuard>
  );
}
