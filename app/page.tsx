"use client";

import { useRoles } from "@/common/hooks/roles.hooks";
import { useCreateUser } from "@/features/auth/hooks/user.hooks";
import { Button, Form, Input, notification, Select } from "antd";
import { useEffect } from "react";

interface FormValues {
  name: string;
  email: string;
  roleId: string;
}

export default function CreateUserAdmin() {
  const { roles, loading, error } = useRoles();
  const {
    createUser,
    isPending,
    isSuccess,
    error: createUserError,
  } = useCreateUser();
  const [form] = Form.useForm<FormValues>();

  // Set default role when roles are loaded
  useEffect(() => {
    if (roles.length > 0 && !form.getFieldValue("roleId")) {
      form.setFieldsValue({ roleId: roles[0].id });
    }
  }, [roles, form]);

  // Handle mutation success
  useEffect(() => {
    if (isSuccess) {
      notification.success({
        title: "Sucesso",
        description: "O utilizador foi criado com sucesso",
      });
      form.resetFields();
      if (roles.length > 0) {
        form.setFieldsValue({ roleId: roles[0].id });
      }
    }
  }, [isSuccess, form, roles]);

  // Handle mutation error
  useEffect(() => {
    if (createUserError) {
      const errorMessage =
        createUserError instanceof Error
          ? createUserError.message
          : "Erro desconhecido";
      notification.error({
        title: "Erro",
        description: `Não foi possível criar o utilizador: ${errorMessage}`,
      });
    }
  }, [createUserError]);

  const handleSubmit = (values: FormValues) => {
    createUser({
      name: values.name,
      email: values.email,
      roleId: values.roleId,
    });
  };

  if (loading) {
    return (
      <div style={{ padding: 20 }}>
        <p>Cargando roles...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Create User (Admin only)</h1>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        style={{ maxWidth: 320 }}
      >
        <Form.Item
          name="name"
          label="Nome Completo"
          rules={[
            { required: true, message: "Por favor, insira o nome completo" },
          ]}
        >
          <Input placeholder="João Silva" />
        </Form.Item>

        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: "Por favor, insira o email" },
            { type: "email", message: "Por favor, insira um email válido" },
          ]}
        >
          <Input placeholder="joao.silva@example.com" />
        </Form.Item>

        <Form.Item
          name="roleId"
          label="Função"
          rules={[
            { required: true, message: "Por favor, selecione uma função" },
          ]}
        >
          <Select
            placeholder="Selecione uma função"
            disabled={loading || roles.length === 0}
            loading={loading}
          >
            {roles.map((role) => (
              <Select.Option key={role.id} value={role.id}>
                {role.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={isPending} block>
            {isPending ? "A criar..." : "Criar Utilizador"}
          </Button>
        </Form.Item>
      </Form>

      {error && (
        <p style={{ marginTop: 10 }}>❌ Erro ao carregar os roles: {error}</p>
      )}
    </div>
  );
}
