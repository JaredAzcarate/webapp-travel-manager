"use client";

import { App, Button, Form, Input } from "antd";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface CreateAdminFormValues {
  username: string;
  password: string;
  confirmPassword: string;
}

export default function SetupAdminPage() {
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
        description: "Usuário admin criado com sucesso! Redirecionando...",
      });

      form.resetFields();

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/login");
      }, 2000);
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
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Criar Usuário Admin
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Configure o primeiro usuário administrador do sistema
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
              block
            >
              Criar Admin
            </Button>
          </Form.Item>
        </Form>

        <div className="text-center text-sm text-gray-600">
          <p>
            Já tem uma conta?{" "}
            <a href="/login" className="text-blue-600 hover:text-blue-500">
              Fazer login
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
