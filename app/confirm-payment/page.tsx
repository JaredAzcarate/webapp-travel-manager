"use client";

import { useCaravan } from "@/features/caravans/hooks/caravans.hooks";
import { useChapels } from "@/features/chapels/hooks/chapels.hooks";
import { useOrdinances } from "@/features/ordinances/hooks/ordinances.hooks";
import {
  useCancelRegistration,
  useMarkPaymentAsPaid,
  useRegistrationsByPhone,
} from "@/features/registrations/hooks/registrations.hooks";
import { RegistrationWithId } from "@/features/registrations/models/registrations.model";
import { notifyChapelOnPayment } from "@/features/registrations/utils/notifications";
import {
  App,
  Button,
  Card,
  Form,
  Input,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { CheckCircle, XCircle } from "phosphor-react";
import { useMemo, useState } from "react";

const { Title } = Typography;

interface FormValues {
  phone: string;
}

export default function ConfirmPaymentPage() {
  const { notification, modal } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const [phone, setPhone] = useState<string>("");

  const { registrations, loading } = useRegistrationsByPhone(phone);
  const { chapels } = useChapels();
  const { ordinances } = useOrdinances();
  const { markPaymentAsPaid, isPending: isMarkingPaid } =
    useMarkPaymentAsPaid();
  const { cancelRegistration, isPending: isCancelling } =
    useCancelRegistration();

  const chapelMap = useMemo(() => {
    const map = new Map<string, string>();
    chapels.forEach((chapel) => {
      map.set(chapel.id, chapel.name);
    });
    return map;
  }, [chapels]);

  const ordinanceIdToNameMap = useMemo(() => {
    const map = new Map<string, string>();
    ordinances.forEach((o) => {
      map.set(o.id, o.name);
    });
    return map;
  }, [ordinances]);

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
            message="Tem certeza que deseja cancelar a sua participação na caravana"
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
      title: "Caravana",
      key: "caravanName",
      render: (_, record) => {
        return <CaravanNameCell caravanId={record.caravanId} />;
      },
    },
    {
      title: "Capela",
      key: "chapelId",
      render: (_, record) => {
        const chapelName = chapelMap.get(record.chapelId);
        return chapelName || record.chapelId;
      },
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
      title: "Ordenança",
      key: "ordinance",
      render: (_, record) => {
        if (
          record.ordinances &&
          Array.isArray(record.ordinances) &&
          record.ordinances.length > 0
        ) {
          return record.ordinances
            .map((ord) => {
              const name =
                ordinanceIdToNameMap.get(ord.ordinanceId) || ord.ordinanceId;
              return `${name} - ${ord.slot}`;
            })
            .join(", ");
        }
        return "-";
      },
    },
    {
      title: "Data de Registro",
      key: "createdAt",
      render: (_, record) => {
        if (record.createdAt && "toDate" in record.createdAt) {
          return dayjs(record.createdAt.toDate()).format("DD/MM/YYYY");
        }
        return "-";
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
          <Space>
            {canMarkAsPaid && (
              <Button
                type="primary"
                size="small"
                icon={<CheckCircle size={16} />}
                onClick={() => handleMarkAsPaid(record)}
                loading={isMarkingPaid}
              >
                Já paguei
              </Button>
            )}
            {record.paymentStatus === "PAID" && (
              <Tag color="green">Já pago</Tag>
            )}
            {canCancel && (
              <Button
                danger
                size="small"
                icon={<XCircle size={16} />}
                onClick={() => handleCancelParticipation(record)}
                loading={isCancelling}
              >
                Não vou assistir
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <Card>
          <Title level={2} className="mb-6">
            Confirmar Pagamento ou Verificar Inscrições
          </Title>

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
                ]}
              >
                <Input placeholder="Ex: +351912345678" size="large" />
              </Form.Item>
              <Form.Item label=" " className="sm:pt-8">
                <Button type="primary" htmlType="submit" size="large" block>
                  Buscar
                </Button>
              </Form.Item>
            </div>
          </Form>

          {phone && (
            <>
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
            </>
          )}
        </Card>
      </div>
    </div>
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
