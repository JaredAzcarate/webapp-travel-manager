"use client";

import { AdminOnlyGuard } from "@/common/components/AdminOnlyGuard";
import { OrdinanceForm } from "@/features/ordinances/components/OrdinanceForm";
import { Typography } from "antd";

const { Title } = Typography;

export default function NewOrdinancePage() {
  return (
    <AdminOnlyGuard>
      <div className="p-6">
        <Title level={2}>Criar Nova Ordenança</Title>

        <div className="mt-6">
          <OrdinanceForm mode="create" />
        </div>
      </div>
    </AdminOnlyGuard>
  );
}
