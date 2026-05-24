"use client";

import { useChapels } from "@/features/chapels/hooks/chapels.hooks";
import { useQueryClient } from "@tanstack/react-query";
import { App, Button, Drawer, Form, Input, Select } from "antd";
import type { PanelAdminRole } from "@/features/auth/models/admin.model";
import { useState } from "react";

interface CreateManagerDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface CreateAdminFormValues {
  username: string;
  password: string;
  confirmPassword: string;
  role: PanelAdminRole;
  chapelId?: string;
}

export const CreateManagerDrawer = ({
  open,
  onClose,
  onSuccess,
}: CreateManagerDrawerProps) => {
  const { notification } = App.useApp();
  const queryClient = useQueryClient();
  const [form] = Form.useForm<CreateAdminFormValues>();
  const [loading, setLoading] = useState(false);
  const { chapels, loading: loadingChapels } = useChapels();
  const role = Form.useWatch("role", form);

  const handleSubmit = async (values: CreateAdminFormValues) => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: values.username,
          password: values.password,
          role: values.role,
          ...(values.role === "SECRETARY" ? { chapelId: values.chapelId } : {}),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erro ao criar admin");
      }

      notification.success({
        title: "Sucesso",
        description: "Utilizador criado com sucesso!",
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

  return (
    <Drawer
      title="Criar Usuário"
      open={open}
      onClose={onClose}
      size="large"
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className="flex flex-col gap-4"
        initialValues={{ role: "ADMIN" as PanelAdminRole }}
      >
        <Form.Item
          name="username"
          label="Nome de Usuário"
          rules={[
            {
              required: true,
              message: "Por favor, insira o nome de usuário",
            },
            {
              min: 3,
              message: "O nome de usuário deve ter no mínimo 3 caracteres",
            },
            {
              pattern: /^[a-zA-Z0-9_-]+$/,
              message: "Use apenas letras, números, _ ou -",
            },
          ]}
        >
          <Input
            placeholder="Nome de usuário"
            size="large"
            autoComplete="username"
          />
        </Form.Item>

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
              { required: true, message: "Selecione a capela do secretário" },
            ]}
          >
            <Select
              placeholder={loadingChapels ? "A carregar..." : "Selecione a capela"}
              loading={loadingChapels}
              options={chapels.map((c) => ({ label: c.name, value: c.id }))}
            />
          </Form.Item>
        )}

        <Form.Item
          name="password"
          label="Senha"
          rules={[
            { required: true, message: "Por favor, insira a senha" },
            { min: 8, message: "A senha deve ter no mínimo 8 caracteres" },
          ]}
        >
          <Input.Password
            placeholder="Senha"
            size="large"
            autoComplete="new-password"
          />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label="Confirmar Senha"
          dependencies={["password"]}
          rules={[
            { required: true, message: "Por favor, confirme a senha" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("password") === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error("As senhas não coincidem"));
              },
            }),
          ]}
        >
          <Input.Password
            placeholder="Confirmar senha"
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
            Criar Usuário
          </Button>
        </Form.Item>
      </Form>
    </Drawer>
  );
};
