"use client";

import { PublicContent } from "@/common/components/PublicContent";
import { toDate } from "@/common/utils/timestamp.utils";
import { useCaravan } from "@/features/caravans/hooks/caravans.hooks";
import {
  useCancelRegistration,
  useMarkPaymentAsPaid,
  useRegistrationsByPhone,
} from "@/features/registrations/hooks/registrations.hooks";
import { RegistrationWithId } from "@/features/registrations/models/registrations.model";
import { notifyChapelOnPayment } from "@/features/registrations/utils/notifications";
import {
  Alert,
  App,
  Button,
  Card,
  Form,
  Input,
  Spin,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle, XCircle } from "phosphor-react";
import { useState } from "react";


const { Title, Paragraph } = Typography;

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

interface FormValues {
  phone: string;
}

export default function ConfirmPaymentPage() {
  const { notification, modal } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const [phone, setPhone] = useState<string>("");

  const { registrations, loading } = useRegistrationsByPhone(phone);
  const { markPaymentAsPaid, isPending: isMarkingPaid } =
    useMarkPaymentAsPaid();
  const { cancelRegistration, isPending: isCancelling } =
    useCancelRegistration();

  const handleSubmit = (values: FormValues) => {
    setPhone(values.phone);
  };

  const handleMarkAsPaid = async (registration: RegistrationWithId) => {
    try {
      await markPaymentAsPaid(registration.id);
      await notifyChapelOnPayment(registration);
      notification.success({
        title: "Sucesso",
        description: "Pagamento marcado como realizado com sucesso",
      });
    } catch (error) {
      notification.error({
        title: "Erro",
        description: "Não foi possível marcar o pagamento",
      });
    }
  };

  const handleCancelParticipation = (registration: RegistrationWithId) => {
    modal.confirm({
      title: "Cancelar participação",
      content: (
        <div>
          <CaravanNameCell
            caravanId={registration.caravanId}
            message="Tem certeza que deseja cancelar a sua participação na viagem"
          />
        </div>
      ),
      okText: "Sim, cancelar",
      okType: "danger",
      cancelText: "Não",
      onOk: async () => {
        try {
          await cancelRegistration(registration.id);
          notification.success({
            title: "Sucesso",
            description: "Participação cancelada com sucesso",
          });
        } catch (error) {
          notification.error({
            title: "Erro",
            description: "Não foi possível cancelar a participação",
          });
        }
      },
    });
  };

  const columns: ColumnsType<RegistrationWithId> = [
    {
      title: "Viagem",
      key: "viagemName",
      render: (_, record) => {
        return <CaravanNameCell caravanId={record.caravanId} />;
      },
    },
    {
      title: "Nome do participante",
      key: "fullName",
      dataIndex: "fullName",
    },
    {
      title: "Estado de Pagamento",
      key: "paymentStatus",
      render: (_, record) => {
        const colorMap: Record<string, string> = {
          PENDING: "orange",
          PAID: "green",
          FREE: "blue",
          CANCELLED: "red",
        };
        const labelMap: Record<string, string> = {
          PENDING: "Pendente",
          PAID: "Pago",
          FREE: "Grátis",
          CANCELLED: "Cancelado",
        };
        return (
          <Tag color={colorMap[record.paymentStatus] || "default"}>
            {labelMap[record.paymentStatus] || record.paymentStatus}
          </Tag>
        );
      },
    },
    {
      title: "Data de Registro",
      key: "createdAt",
      render: (_, record) => {
        const date = toDate(record.createdAt);
        return date ? dayjs(date).format("DD/MM/YYYY") : "-";
      },
    },
    {
      title: "Estado de Participação",
      key: "participationStatus",
      render: (_, record) => {
        return (
          <Tag
            color={record.participationStatus === "ACTIVE" ? "green" : "red"}
          >
            {record.participationStatus === "ACTIVE" ? "Ativa" : "Cancelada"}
          </Tag>
        );
      },
    },
    {
      title: "Ações",
      key: "actions",
      render: (_, record) => {
        const canMarkAsPaid =
          record.paymentStatus !== "FREE" &&
          record.paymentStatus !== "PAID" &&
          record.participationStatus === "ACTIVE";

        const canCancel = record.participationStatus === "ACTIVE";

        return (
          <div className="flex flex-col gap-2">
            {canMarkAsPaid && (
              <Button
                type="primary"
                size="small"
                icon={<CheckCircle size={16} />}
                onClick={() => handleMarkAsPaid(record)}
                loading={isMarkingPaid}
                block
              >
                Já paguei
              </Button>
            )}
            {record.paymentStatus === "PAID" && (
              <Tag color="green" className="w-full text-center">Já pago</Tag>
            )}
            {canCancel && (
              <Button
                danger
                size="small"
                icon={<XCircle size={16} />}
                onClick={() => handleCancelParticipation(record)}
                loading={isCancelling}
                block
              >
                Não vou assistir
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <PublicContent>
      <AnimatePresence>
        <motion.div
          key="header-section"
          initial={sectionAnimation.initial}
          animate={sectionAnimation.animate}
          exit={sectionAnimation.exit}
          transition={sectionTransition(0)}
        >
          <Title level={3} className="mb-6">
            Verificar inscrição
          </Title>
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        <motion.div
          key="form-section"
          initial={sectionAnimation.initial}
          animate={sectionAnimation.animate}
          exit={sectionAnimation.exit}
          transition={sectionTransition(0.1)}
          className="bg-white p-4 rounded-2xl flex flex-col gap-4"
        >
          {!phone && (
            <motion.div
              key="alert-section"
              initial={sectionAnimation.initial}
              animate={sectionAnimation.animate}
              exit={sectionAnimation.exit}
              transition={sectionTransition(0.2)}
            >
              <Alert
                showIcon={true}
                type="info"
                description="Por favor, introduza o número de telefone do participante ou do responsável legal (se a inscrição foi feita para um menor de 18 anos) para verificar a sua inscrição."
              />
            </motion.div>
          )}
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            className="mb-6"
          >
            <div className="flex flex-col sm:flex-row gap-4">
              <Form.Item
                name="phone"
                label="Número de Telefone"
                className="flex-1"
                rules={[
                  {
                    required: true,
                    message: "Por favor, insira o número de telefone",
                  },
                  {
                    pattern: /^\d{1,9}$/,
                    message: "O número deve conter apenas dígitos (máximo 9)",
                  },
                ]}
              >
                <Input
                  placeholder="Ex: 912345678"
                  size="large"
                  maxLength={9}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    form.setFieldsValue({ phone: value });
                  }}
                />
              </Form.Item>
              <Form.Item label=" " className="sm:pt-8">
                <Button type="primary" htmlType="submit" size="large" block>
                  Buscar
                </Button>
              </Form.Item>
            </div>
          </Form>


          <AnimatePresence mode="wait">
            {phone && (
              <motion.div
                key={`results-${phone}`}
                initial={sectionAnimation.initial}
                animate={sectionAnimation.animate}
                exit={sectionAnimation.exit}
                transition={sectionTransition(0.2)}
              >
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Spin size="large" />
                  </div>
                ) : registrations.length === 0 ? (
                  <Card>
                    <p className="text-gray-500 text-center">
                      Nenhuma inscrição encontrada para este número de telefone.
                    </p>
                  </Card>
                ) : (
                  <Table
                    columns={columns}
                    dataSource={registrations}
                    rowKey="id"
                    scroll={{ x: true }}
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      showTotal: (total) => `Total: ${total} inscrições`,
                      responsive: true,
                    }}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </PublicContent>
  );
}

interface CaravanNameCellProps {
  caravanId: string;
  message?: string;
}

const CaravanNameCell = ({ caravanId, message }: CaravanNameCellProps) => {
  const { caravan, loading } = useCaravan(caravanId);

  if (loading) {
    return <Spin size="small" />;
  }

  const caravanName = caravan?.name || caravanId;

  if (message) {
    return (
      <span>
        {message} {caravanName}? Esta ação liberará o seu lugar no autocarro.
      </span>
    );
  }

  return <span>{caravanName}</span>;
};
