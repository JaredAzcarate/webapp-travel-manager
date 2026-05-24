"use client";

import { AdminOnlyGuard } from "@/common/components/AdminOnlyGuard";
import { BusForm } from "@/features/buses/components/BusForm";
import { Typography } from "antd";

const { Title } = Typography;

export default function NewBusPage() {
  return (
    <AdminOnlyGuard>
      <div className="p-6">
        <Title level={2}>Criar Novo Autocarro</Title>

        <div className="mt-6">
          <BusForm mode="create" />
        </div>
      </div>
    </AdminOnlyGuard>
  );
}
