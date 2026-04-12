"use client";

import { useSubmitPublicFeedback } from "@/features/feedback/hooks/feedbackTickets.hooks";
import { App, Button, Form, Input, Modal, Radio, Space } from "antd";
import { usePathname } from "next/navigation";
import { ChatCircle } from "phosphor-react";
import { useState } from "react";

const { TextArea } = Input;

export function PublicFeedbackFab() {
  const pathname = usePathname();
  const { notification } = App.useApp();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<{ type: "ERROR" | "SUGGESTION"; message: string }>();
  const { mutateAsync, isPending } = useSubmitPublicFeedback();

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await mutateAsync({
        type: values.type,
        message: values.message,
        pageUrl:
          typeof window !== "undefined"
            ? `${window.location.origin}${pathname || ""}`
            : pathname || undefined,
      });
      notification.success({
        title: "Enviado",
        description: "Obrigado. A sua mensagem foi registada.",
      });
      form.resetFields();
      setOpen(false);
    } catch (e) {
      if (e instanceof Error && e.message !== "Validation failed") {
        notification.error({
          title: "Erro",
          description: e.message,
        });
      }
    }
  };

  return (
    <>
      <div className="fixed bottom-5 right-5 z-40 md:bottom-6 md:right-6">
        <Button
          type="primary"
          size="large"
          className="shadow-lg"
          icon={<ChatCircle size={22} weight="duotone" className="inline" />}
          onClick={() => setOpen(true)}
        >
          Erro ou sugestão
        </Button>
      </div>

      <Modal
        title={
          <Space>
            Reportar erro ou sugerir alteração
          </Space>
        }
        open={open}
        onCancel={() => {
          setOpen(false);
          form.resetFields();
        }}
        footer={[
          <Button key="cancel" onClick={() => setOpen(false)}>
            Cancelar
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={isPending}
            onClick={handleSubmit}
          >
            Enviar
          </Button>,
        ]}
        destroyOnHidden
        width={520}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ type: "SUGGESTION" as const }}
          className="mt-2"
        >
          <Form.Item name="type" label="Tipo">
            <Radio.Group>
              <Radio value="ERROR">Reportar erro</Radio>
              <Radio value="SUGGESTION">Sugerir alteração</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item
            name="message"
            label="Descrição"
            rules={[
              { required: true, message: "Por favor, descreva o problema ou a sugestão" },
              { max: 4000, message: "Máximo de 4000 caracteres" },
            ]}
          >
            <TextArea
              rows={5}
              placeholder="Descreva o que aconteceu ou a sua ideia…"
              showCount
              maxLength={4000}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
