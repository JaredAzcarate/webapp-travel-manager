"use client";

import {
  useChapels,
  useDeleteChapel,
} from "@/features/chapels/hooks/chapels.hooks";
import { ChapelWithId } from "@/features/chapels/models/chapels.model";
import { App, Button, Space, Table, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash } from "phosphor-react";

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
      title: "Lugar de saida do autocarro",
      dataIndex: "busDepartureLocation",
      key: "busDepartureLocation",
      render: (location: string | undefined) => location || "-",
    },
    {
      title: "Ações",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<Pencil size={16} />}
            onClick={() => router.push(`/admin/chapels/edit/${record.id}`)}
          >
            Editar
          </Button>
          <Button
            type="link"
            danger
            icon={<Trash size={16} />}
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
          icon={<Plus size={16} />}
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
        scroll={{ x: true }}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total: ${total} capelas`,
          responsive: true,
        }}
        locale={{
          emptyText: "Nenhuma capela criada ainda",
        }}
      />
    </>
  );
};
