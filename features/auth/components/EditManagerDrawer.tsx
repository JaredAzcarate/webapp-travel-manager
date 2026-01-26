"use client";

import { AdminWithId } from "@/features/auth/models/admin.model";
import { useQueryClient } from "@tanstack/react-query";
import { App, Button, Drawer, Form, Input } from "antd";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Timestamp } from "firebase/firestore";
import { useState } from "react";

interface EditManagerDrawerProps {
  open: boolean;
  onClose: () => void;
  admin: AdminWithId | null;
  onSuccess: () => void;
}

interface EditAdminFormValues {
  newPassword: string;
  confirmPassword: string;
}

export const EditManagerDrawer = ({
  open,
  onClose,
  admin,
  onSuccess,
}: EditManagerDrawerProps) => {
  const { notification } = App.useApp();
  const queryClient = useQueryClient();
  const [form] = Form.useForm<EditAdminFormValues>();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: EditAdminFormValues) => {
    if (!admin) return;

    setLoading(true);
    try {
      const response = await fetch("/api/admin/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminId: admin.id,
          newPassword: values.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erro ao atualizar senha");
      }

      notification.success({
        title: "Sucesso",
        description: "Senha atualizada com sucesso!",
      });

      queryClient.invalidateQueries({ queryKey: ["admins"] });
      form.resetFields();
      onClose();
      onSuccess();
    } catch (error) {
      notification.error({
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
      });
    } finally {
      setLoading(false);
    }
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

  return (
    <Drawer
      title="Editar Usuário"
      open={open}
      onClose={onClose}
      size="large"
      destroyOnClose
    >
      {admin && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome de Usuário
            </label>
            <Input
              value={admin.username}
              disabled
              size="large"
              className="bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data de Criação
            </label>
            <Input
              value={formatDate(admin.createdAt)}
              disabled
              size="large"
              className="bg-gray-50"
            />
          </div>

          <Form form={form} layout="vertical" onFinish={handleSubmit} className="flex flex-col gap-4">
            <Form.Item
              name="newPassword"
              label="Nova Senha"
              rules={[
                { required: true, message: "Por favor, insira a nova senha" },
                {
                  min: 8,
                  message: "A senha deve ter no mínimo 8 caracteres",
                },
              ]}
            >
              <Input.Password
                placeholder="Nova senha"
                size="large"
                autoComplete="new-password"
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="Confirmar Nova Senha"
              dependencies={["newPassword"]}
              rules={[
                {
                  required: true,
                  message: "Por favor, confirme a nova senha",
                },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("newPassword") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error("As senhas não coincidem"));
                  },
                }),
              ]}
            >
              <Input.Password
                placeholder="Confirmar nova senha"
                size="large"
                autoComplete="new-password"
              />
            </Form.Item>

            <Form.Item className="mt-6">
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={loading}
                block
              >
                Atualizar Senha
              </Button>
            </Form.Item>
          </Form>
        </div>
      )}
    </Drawer>
  );
};
