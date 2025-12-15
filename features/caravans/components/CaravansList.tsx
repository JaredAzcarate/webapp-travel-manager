"use client";

import {
  useCaravans,
  useDeleteCaravan,
} from "@/features/caravans/hooks/caravans.hooks";
import { CaravanWithId } from "@/features/caravans/models/caravans.model";
import { App, Button, Space, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";

const { Title } = Typography;

export const CaravansList = () => {
  const router = useRouter();
  const { notification, modal } = App.useApp();
  const { caravans, loading } = useCaravans();
  const { deleteCaravan, isPending: isDeleting } = useDeleteCaravan();

  const handleDelete = (caravan: CaravanWithId) => {
    modal.confirm({
      title: "Eliminar Caravana",
      content: `Tem certeza que deseja eliminar a caravana "${caravan.name}"?`,
      okText: "Eliminar",
      okType: "danger",
      cancelText: "Cancelar",
      onOk: () => {
        deleteCaravan(caravan.id);
        notification.success({
          title: "Sucesso",
          description: "A caravana foi eliminada com sucesso",
        });
      },
    });
  };

  const columns: ColumnsType<CaravanWithId> = [
    {
      title: "Nome",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Templo",
      dataIndex: "templeName",
      key: "templeName",
      render: (templeName: string | undefined) => templeName || "-",
    },
    {
      title: "Partida",
      key: "departureAt",
      render: (_, record) => {
        const timestamp = record.departureAt;
        if (timestamp && "toDate" in timestamp) {
          return dayjs(timestamp.toDate()).format("DD/MM/YYYY HH:mm");
        }
        return "-";
      },
    },
    {
      title: "Regresso",
      key: "returnAt",
      render: (_, record) => {
        const timestamp = record.returnAt;
        if (timestamp && "toDate" in timestamp) {
          return dayjs(timestamp.toDate()).format("DD/MM/YYYY HH:mm");
        }
        return "-";
      },
    },
    {
      title: "Status",
      key: "isActive",
      render: (_, record) => (
        <Tag color={record.isActive ? "green" : "default"}>
          {record.isActive ? "Ativa" : "Inativa"}
        </Tag>
      ),
    },
    {
      title: "Data de Criação",
      key: "createdAt",
      render: (_, record) => {
        const timestamp = record.createdAt;
        if (timestamp && "toDate" in timestamp) {
          return dayjs(timestamp.toDate()).format("DD/MM/YYYY HH:mm");
        }
        return "-";
      },
    },
    {
      title: "Ações",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            onClick={() => router.push(`/admin/caravans/edit/${record.id}`)}
          >
            Editar
          </Button>
          <Button
            type="link"
            danger
            onClick={() => handleDelete(record)}
            loading={isDeleting}
          >
            Eliminar
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <Title level={4} style={{ margin: 0 }}>
          Lista de Caravanas
        </Title>
        <Button
          type="primary"
          onClick={() => router.push("/admin/caravans/new")}
        >
          Nova Caravana
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={caravans}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total: ${total} caravanas`,
        }}
        locale={{
          emptyText: "Nenhuma caravana criada ainda",
        }}
      />
    </>
  );
};

