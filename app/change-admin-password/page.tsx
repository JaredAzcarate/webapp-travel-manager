"use client";

import { App, Button, Card, Form, Input, Typography } from "antd";
import { useState } from "react";

const { Title } = Typography;

interface FormValues {
  username: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ChangeAdminPasswordPage() {
  const { notification } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: FormValues) => {
    if (values.newPassword !== values.confirmPassword) {
      form.setFields([
        {
          name: "confirmPassword",
          errors: ["As passwords não coincidem"],
        },
      ]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: values.username,
          newPassword: values.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erro ao atualizar password");
      }

      notification.success({
        title: "Sucesso",
        description: "Password atualizada com sucesso",
      });

      form.resetFields();
    } catch (error) {
      notification.error({
        title: "Erro",
        description:
          error instanceof Error
            ? error.message
            : "Não foi possível atualizar a password",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        <Card>
          <Title level={2} className="mb-6 text-center">
            Alterar Password do Admin
          </Title>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            autoComplete="off"
          >
            <Form.Item
              name="username"
              label="Username"
              rules={[
                {
                  required: true,
                  message: "Por favor, insira o username",
                },
              ]}
            >
              <Input placeholder="Username do admin" size="large" />
            </Form.Item>

            <Form.Item
              name="newPassword"
              label="Nova Password"
              rules={[
                {
                  required: true,
                  message: "Por favor, insira a nova password",
                },
                {
                  min: 8,
                  message: "A password deve ter no mínimo 8 caracteres",
                },
              ]}
            >
              <Input.Password
                placeholder="Nova password"
                size="large"
                autoComplete="new-password"
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="Confirmar Password"
              dependencies={["newPassword"]}
              rules={[
                {
                  required: true,
                  message: "Por favor, confirme a password",
                },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("newPassword") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error("As passwords não coincidem")
                    );
                  },
                }),
              ]}
            >
              <Input.Password
                placeholder="Confirmar password"
                size="large"
                autoComplete="new-password"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                loading={loading}
              >
                Alterar Password
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
}
