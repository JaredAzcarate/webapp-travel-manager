"use client";

import {
  useDeleteOrdinance,
  useOrdinances,
} from "@/features/ordinances/hooks/ordinances.hooks";
import { OrdinanceWithId } from "@/features/ordinances/models/ordinances.model";
import { App, Button, Space, Table, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash } from "phosphor-react";

const { Title } = Typography;

export const OrdinancesList = () => {
  const router = useRouter();
  const { notification, modal } = App.useApp();
  const { ordinances, loading } = useOrdinances();
  const { deleteOrdinance, isPending: isDeleting } = useDeleteOrdinance();

  const handleDelete = (ordinance: OrdinanceWithId) => {
    modal.confirm({
      title: "Eliminar Ordenança",
      content: `Tem certeza que deseja eliminar a ordenança "${ordinance.name}"?`,
      okText: "Eliminar",
      okType: "danger",
      cancelText: "Cancelar",
      onOk: async () => {
        try {
          deleteOrdinance(ordinance.id);
          notification.success({
            title: "Sucesso",
            description: "A ordenança foi eliminada com sucesso",
          });
        } catch (error) {
          notification.error({
            title: "Erro",
            description: "Não foi possível eliminar a ordenança",
          });
        }
      },
    });
  };

  const columns: ColumnsType<OrdinanceWithId> = [
    {
      title: "Nome",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Sesiones",
      key: "sessions",
      render: (_, record) => {
        const sessionCount = record.sessions?.length || 0;
        return `${sessionCount} sesión${sessionCount !== 1 ? "es" : ""}`;
      },
    },
    {
      title: "Ações",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<Pencil size={16} />}
            onClick={() => router.push(`/admin/ordinances/edit/${record.id}`)}
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
          Lista de Ordenanças
        </Title>
        <Button
          type="primary"
          icon={<Plus size={16} />}
          onClick={() => router.push("/admin/ordinances/new")}
        >
          Nova Ordenança
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={ordinances}
        rowKey="id"
        loading={loading}
        scroll={{ x: true }}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total: ${total} ordenanças`,
          responsive: true,
        }}
        locale={{
          emptyText: "Nenhuma ordenança criada ainda",
        }}
      />
    </>
  );
};
