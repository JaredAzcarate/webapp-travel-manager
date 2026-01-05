"use client";

import { App, Button, Form, Input } from "antd";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface CreateAdminFormValues {
  username: string;
  password: string;
  confirmPassword: string;
}

export default function ManagersPage() {
  const router = useRouter();
  const { notification } = App.useApp();
  const [form] = Form.useForm<CreateAdminFormValues>();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: CreateAdminFormValues) => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: values.username,
          password: values.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erro ao criar admin");
      }

      notification.success({
        title: "Sucesso",
        description: "Usuário admin criado com sucesso!",
      });

      form.resetFields();
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
    <div className="max-w-2xl p-4 sm:p-0">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Gestores</h1>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Criar Usuário Admin</h2>
          <p className="text-gray-600 text-sm">
            Crie um novo usuário administrador do sistema
          </p>
        </div>

        <Form form={form} layout="vertical" onFinish={handleSubmit}>
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
            >
              Criar Admin
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}

