"use client";

import { useAdmins, useDeleteAdmin } from "@/features/auth/hooks/admin.hooks";
import { AdminWithId } from "@/features/auth/models/admin.model";
import { App, Button, Space, Table, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Timestamp } from "firebase/firestore";
import { Pencil, Plus, Trash } from "phosphor-react";
import { useState } from "react";
import { CreateManagerDrawer } from "./CreateManagerDrawer";
import { EditManagerDrawer } from "./EditManagerDrawer";

const { Title } = Typography;

export const ManagersList = () => {
  const { notification, modal } = App.useApp();
  const { admins, loading } = useAdmins();
  const { deleteAdmin, isPending: isDeleting } = useDeleteAdmin();
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminWithId | null>(null);

  const handleCreateSuccess = () => {
    setCreateDrawerOpen(false);
    // React Query will automatically refetch
  };

  const handleEditSuccess = () => {
    setEditDrawerOpen(false);
    setSelectedAdmin(null);
    // React Query will automatically refetch
  };

  const handleEdit = (admin: AdminWithId) => {
    setSelectedAdmin(admin);
    setEditDrawerOpen(true);
  };

  const handleDelete = (admin: AdminWithId) => {
    if (admin.username === "admin") {
      notification.error({
        title: "Erro",
        description: "Não é possível eliminar o usuário 'admin'",
      });
      return;
    }

    modal.confirm({
      title: "Eliminar Gestor",
      content: `Tem certeza que deseja eliminar o gestor "${admin.username}"?`,
      okText: "Eliminar",
      okType: "danger",
      cancelText: "Cancelar",
      onOk: async () => {
        try {
          await deleteAdmin(admin.id);
          notification.success({
            title: "Sucesso",
            description: "O gestor foi eliminado com sucesso",
          });
        } catch {
          notification.error({
            title: "Erro",
            description: "Erro ao eliminar o gestor",
          });
        }
      },
    });
  };

  const formatDate = (timestamp: Timestamp | undefined | null) => {
    if (!timestamp) return "-";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date();
      return format(date, "dd/MM/yyyy HH:mm", { locale: ptBR });
    } catch {
      return "-";
    }
  };

  const columns: ColumnsType<AdminWithId> = [
    {
      title: "Nome de Usuário",
      dataIndex: "username",
      key: "username",
    },
    {
      title: "Data de Criação",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (createdAt: Timestamp) => formatDate(createdAt),
    },
    {
      title: "Ações",
      key: "actions",
      render: (_, record) => (
        <Space size={"large"} className="w-20">
          <Button
            type="link"
            icon={<Pencil size={16} />}
            onClick={() => handleEdit(record)}
          >
          </Button>
          {record.username !== "admin" && record.username !== "Admin" && (
            <Button
              type="link"
              danger
              icon={<Trash size={16} />}
              onClick={() => handleDelete(record)}
              loading={isDeleting}
            >
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <Title level={4} style={{ margin: 0 }}>
          Lista de Gestores
        </Title>
        <Button
          type="primary"
          icon={<Plus size={16} />}
          onClick={() => setCreateDrawerOpen(true)}
        >
          Criar Usuário
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={admins}
        rowKey="id"
        loading={loading}
        scroll={{ x: true }}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total: ${total} gestores`,
          responsive: true,
        }}
        locale={{
          emptyText: "Nenhum gestor criado ainda",
        }}
      />

      <CreateManagerDrawer
        open={createDrawerOpen}
        onClose={() => setCreateDrawerOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      <EditManagerDrawer
        open={editDrawerOpen}
        onClose={() => {
          setEditDrawerOpen(false);
          setSelectedAdmin(null);
        }}
        admin={selectedAdmin}
        onSuccess={handleEditSuccess}
      />
    </>
  );
};
