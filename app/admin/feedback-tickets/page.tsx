"use client";

import { AdminOnlyGuard } from "@/common/components/AdminOnlyGuard";
import { FeedbackTicketsTable } from "@/features/feedback/components/FeedbackTicketsTable";
import { Typography } from "antd";

const { Title } = Typography;

export default function FeedbackTicketsPage() {
  return (
    <AdminOnlyGuard>
      <div className="p-4 sm:p-6">
        <Title level={2} className="text-xl sm:text-2xl">
          Feedbacks e sugestões
        </Title>
        <p className="text-gray-600 mb-6">
          Mensagens enviadas a partir do site público.
        </p>
        <FeedbackTicketsTable />
      </div>
    </AdminOnlyGuard>
  );
}
