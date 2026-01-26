"use client";

import { PublicContent } from "@/common/components/PublicContent";
import { App, Button, Card, Form, Input, Typography } from "antd";
import { motion } from "motion/react";
import { useState } from "react";

const { Title, Paragraph } = Typography;

const pageAnimation = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const },
};

const cardAnimation = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const, delay: 0.1 },
};

interface FormValues {
  phone: string;
  fullName: string;
}

export default function GdprRequestPage() {
  const { notification } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const response = await fetch("/api/gdpr/send-uuid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: values.phone,
          fullName: values.fullName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erro ao solicitar acesso aos dados");
      }

      notification.success({
        title: "Solicitação enviada",
        description:
          "Se os seus dados foram encontrados, receberá um link por WhatsApp para aceder aos seus dados.",
        duration: 4.5,
      });

      form.resetFields();
    } catch (error) {
      notification.error({
        title: "Erro",
        description:
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao solicitar acesso aos dados",
        duration: 4.5,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicContent>
      <motion.div {...pageAnimation}>
        <Title level={2}>Solicitar Acesso aos Meus Dados</Title>
        <Paragraph>
          Para aceder aos seus dados pessoais, por favor, preencha o formulário
          abaixo. Se os seus dados forem encontrados, receberá um link por
          WhatsApp para aceder aos seus dados.
        </Paragraph>

        <motion.div {...cardAnimation}>
          <Card className="mt-6">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            className="flex flex-col gap-4"
          >
            <Form.Item
              name="phone"
              label="Número de Telefone"
              rules={[
                { required: true, message: "Por favor, insira o número de telefone" },
                {
                  pattern: /^\+?[1-9]\d{1,14}$/,
                  message: "Por favor, insira um número de telefone válido",
                },
              ]}
            >
              <Input
                placeholder="+351XXXXXXXXX"
                size="large"
                autoComplete="tel"
              />
            </Form.Item>

            <Form.Item
              name="fullName"
              label="Nome Completo"
              rules={[
                { required: true, message: "Por favor, insira o nome completo" },
                {
                  min: 3,
                  message: "O nome deve ter no mínimo 3 caracteres",
                },
              ]}
            >
              <Input
                placeholder="Nome completo como registado"
                size="large"
                autoComplete="name"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={loading}
                block
              >
                Solicitar Acesso
              </Button>
            </Form.Item>
          </Form>
          </Card>
        </motion.div>
      </motion.div>
    </PublicContent>
  );
}
