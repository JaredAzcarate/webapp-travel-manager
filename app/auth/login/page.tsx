"use client";

import { Button, Form, Input } from "antd";
import { Content } from "antd/es/layout/layout";
import Paragraph from "antd/es/typography/Paragraph";
import Title from "antd/es/typography/Title";
import { AnimatePresence, motion } from "motion/react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface LoginFormValues {
  username: string;
  password: string;
}

const sectionAnimation = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

function sectionTransition(delay = 0) {
  return {
    duration: 0.3,
    delay,
    ease: [0.4, 0, 0.2, 1] as const,
  };
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
    <Content className="h-screen flex items-center justify-center">
      <AnimatePresence>
        <motion.div
          key="login-form"
          initial={sectionAnimation.initial}
          animate={sectionAnimation.animate}
          exit={sectionAnimation.exit}
          transition={sectionTransition(0)}
          className="max-w-md rounded-2xl bg-white p-8 mx-auto space-y-4"
        >
          <div className="flex flex-col gap-2">
            <Title level={3}>Login Admin</Title>
            <Paragraph>
              Entre com suas credenciais para acessar o painel administrativo
            </Paragraph>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            className="flex flex-col gap-4"
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

            <Form.Item>
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
        </motion.div>
      </AnimatePresence>
    </Content>
  );
}

