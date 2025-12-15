"use client";

import {
  useChapels,
  useDeleteChapel,
} from "@/features/chapels/hooks/chapels.hooks";
import { ChapelWithId } from "@/features/chapels/models/chapels.model";
import { App, Button, Space, Table, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";

const { Title } = Typography;

export const ChapelsList = () => {
  const router = useRouter();
  const { notification, modal } = App.useApp();
  const { chapels, loading } = useChapels();
  const { deleteChapel, isPending: isDeleting } = useDeleteChapel();

  const handleDelete = (chapel: ChapelWithId) => {
    modal.confirm({
      title: "Eliminar Capela",
      content: `Tem certeza que deseja eliminar a capela "${chapel.name}"?`,
      okText: "Eliminar",
      okType: "danger",
      cancelText: "Cancelar",
      onOk: () => {
        deleteChapel(chapel.id);
        notification.success({
          title: "Sucesso",
          description: "A capela foi eliminada com sucesso",
        });
      },
    });
  };

  const columns: ColumnsType<ChapelWithId> = [
    {
      title: "Nome",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "WhatsApp",
      dataIndex: "whatsappPhone",
      key: "whatsappPhone",
      render: (phone: string | undefined) => phone || "-",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (email: string | undefined) => email || "-",
    },
    {
      title: "Endereço",
      dataIndex: "address",
      key: "address",
      render: (address: string | undefined) => address || "-",
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
            onClick={() => router.push(`/admin/chapels/edit/${record.id}`)}
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
          Lista de Capelas
        </Title>
        <Button
          type="primary"
          onClick={() => router.push("/admin/chapels/new")}
        >
          Nova Capela
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={chapels}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total: ${total} capelas`,
        }}
        locale={{
          emptyText: "Nenhuma capela criada ainda",
        }}
      />
    </>
  );
};

