"use client";

import { useCancelledRegistrationsByBusId } from "@/features/registrations/hooks/registrations.hooks";
import { RegistrationWithId } from "@/features/registrations/models/registrations.model";
import { Spin, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";

interface CancelledRegistrationsListProps {
  busId: string;
  caravanId: string;
  chapelMap: Map<string, string>;
}

export const CancelledRegistrationsList = ({
  busId,
  caravanId,
  chapelMap,
}: CancelledRegistrationsListProps) => {
  const { registrations, loading } = useCancelledRegistrationsByBusId(
    busId,
    caravanId
  );

  const columns: ColumnsType<RegistrationWithId> = [
    {
      title: "Nome Completo",
      dataIndex: "fullName",
      key: "fullName",
    },
    {
      title: "Capela",
      key: "chapelId",
      render: (_, record) => {
        const chapelName = chapelMap.get(record.chapelId);
        return chapelName || record.chapelId;
      },
    },
    {
      title: "Status de Pagamento",
      key: "paymentStatus",
      render: (_, record) => {
        const colorMap: Record<string, string> = {
          PENDING: "orange",
          PAID: "green",
          FREE: "blue",
          CANCELLED: "red",
        };
        const labelMap: Record<string, string> = {
          PENDING: "Pendente",
          PAID: "Pago",
          FREE: "Grátis",
          CANCELLED: "Cancelado",
        };
        return (
          <Tag color={colorMap[record.paymentStatus] || "default"}>
            {labelMap[record.paymentStatus] || record.paymentStatus}
          </Tag>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Table
      columns={columns}
      dataSource={registrations}
      rowKey="id"
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showTotal: (total) => `Total: ${total} cancelados`,
      }}
      locale={{
        emptyText: "Nenhum passageiro cancelado neste autocarro",
      }}
    />
  );
};
