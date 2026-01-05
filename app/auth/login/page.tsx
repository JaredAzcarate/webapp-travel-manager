"use client";

import { Button, Form, Input } from "antd";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface LoginFormValues {
  username: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [form] = Form.useForm<LoginFormValues>();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        username: values.username,
        password: values.password,
        redirect: false,
      });

      if (result?.error) {
        form.setFields([
          {
            name: "password",
            errors: ["Credenciais inválidas"],
          },
        ]);
      } else {
        router.push("/admin/caravans");
        router.refresh();
      }
    } catch (error) {
      form.setFields([
        {
          name: "password",
          errors: ["Erro ao fazer login. Tente novamente."],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-6 sm:p-8 shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Login Admin</h1>
          <p className="mt-2 text-sm text-gray-600">
            Entre com suas credenciais para acessar o painel administrativo
          </p>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="mt-8"
        >
          <Form.Item
            name="username"
            label="Nome de Usuário"
            rules={[
              {
                required: true,
                message: "Por favor, insira o nome de usuário",
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
            rules={[{ required: true, message: "Por favor, insira a senha" }]}
          >
            <Input.Password
              placeholder="Senha"
              size="large"
              autoComplete="current-password"
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
              Entrar
            </Button>
          </Form.Item>
        </Form>

        <div className="text-center text-sm text-gray-600">
          <p>
            Precisa criar uma conta?{" "}
            <a href="/admin/managers" className="text-blue-600 hover:text-blue-500">
              Criar admin
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

