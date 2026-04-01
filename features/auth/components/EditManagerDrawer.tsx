"use client";

import { toDate } from "@/common/utils/timestamp.utils";
import {
  type AdminWithId,
  type PanelAdminRole,
} from "@/features/auth/models/admin.model";
import { useChapels } from "@/features/chapels/hooks/chapels.hooks";
import { useQueryClient } from "@tanstack/react-query";
import { App, Button, Divider, Drawer, Form, Input, Select } from "antd";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEffect, useState } from "react";

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

interface ProfileFormValues {
  role: PanelAdminRole;
  chapelId?: string;
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
  const [profileForm] = Form.useForm<ProfileFormValues>();
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const { chapels, loading: loadingChapels } = useChapels();
  const role = Form.useWatch("role", profileForm);

  useEffect(() => {
    if (admin) {
      profileForm.setFieldsValue({
        role: admin.role ?? "ADMIN",
        chapelId: admin.chapelId,
      });
    }
  }, [admin, profileForm]);

  const handleProfileSubmit = async (values: ProfileFormValues) => {
    if (!admin) return;

    setProfileLoading(true);
    try {
      const response = await fetch(`/api/admin/${admin.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: values.role,
          chapelId: values.role === "SECRETARY" ? values.chapelId : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erro ao atualizar perfil");
      }

      notification.success({
        title: "Sucesso",
        description: "Perfil atualizado com sucesso!",
      });

      queryClient.invalidateQueries({ queryKey: ["admins"] });
      onClose();
      onSuccess();
    } catch (error) {
      notification.error({
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
      });
    } finally {
      setProfileLoading(false);
    }
  };

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

  const formatDate = (timestamp: unknown) => {
    const date = toDate(timestamp as Parameters<typeof toDate>[0]);
    return date ? format(date, "dd/MM/yyyy HH:mm", { locale: ptBR }) : "-";
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

          <Divider>Perfil e capela</Divider>

          <Form
            form={profileForm}
            layout="vertical"
            onFinish={handleProfileSubmit}
            className="flex flex-col gap-4"
          >
            <Form.Item
              name="role"
              label="Perfil"
              rules={[{ required: true, message: "Selecione o perfil" }]}
            >
              <Select
                options={[
                  { value: "ADMIN", label: "Administrador" },
                  {
                    value: "SECRETARY",
                    label: "Secretário (apenas inscrições da capela)",
                  },
                ]}
              />
            </Form.Item>

            {role === "SECRETARY" && (
              <Form.Item
                name="chapelId"
                label="Capela"
                rules={[
                  {
                    required: true,
                    message: "Selecione a capela do secretário",
                  },
                ]}
              >
                <Select
                  placeholder={
                    loadingChapels ? "A carregar..." : "Selecione a capela"
                  }
                  loading={loadingChapels}
                  options={chapels.map((c) => ({ label: c.name, value: c.id }))}
                />
              </Form.Item>
            )}

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={profileLoading}
                block
              >
                Guardar perfil
              </Button>
            </Form.Item>
          </Form>

          <Divider>Alterar senha</Divider>

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
                type="default"
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
