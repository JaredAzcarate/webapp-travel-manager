"use client";

import { useBuses } from "@/features/buses/hooks/buses.hooks";
import { useCaravans } from "@/features/caravans/hooks/caravans.hooks";
import { useChapels } from "@/features/chapels/hooks/chapels.hooks";
import {
  useDeleteRegistration,
  useRegistrations,
} from "@/features/registrations/hooks/registrations.hooks";
import { RegistrationWithId } from "@/features/registrations/models/registrations.model";
import { App, Button, Space, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

const { Title } = Typography;

export const RegistrationsList = () => {
  const router = useRouter();
  const { notification, modal } = App.useApp();
  const { registrations, loading: loadingRegistrations } = useRegistrations();
  const { deleteRegistration, isPending: isDeleting } = useDeleteRegistration();
  const { caravans } = useCaravans();
  const { chapels } = useChapels();
  const { buses } = useBuses();

  const caravanMap = useMemo(() => {
    const map: Record<string, string> = {};
    caravans.forEach((caravan) => {
      map[caravan.id] = caravan.name;
    });
    return map;
  }, [caravans]);

  const chapelMap = useMemo(() => {
    const map: Record<string, string> = {};
    chapels.forEach((chapel) => {
      map[chapel.id] = chapel.name;
    });
    return map;
  }, [chapels]);

  const busMap = useMemo(() => {
    const map: Record<string, string> = {};
    buses.forEach((bus) => {
      map[bus.id] = bus.name;
    });
    return map;
  }, [buses]);

  const handleDelete = (registration: RegistrationWithId) => {
    modal.confirm({
      title: "Eliminar Inscrição",
      content: `Tem certeza que deseja eliminar a inscrição de "${registration.fullName}"?`,
      okText: "Eliminar",
      okType: "danger",
      cancelText: "Cancelar",
      onOk: () => {
        deleteRegistration(registration.id);
        notification.success({
          title: "Sucesso",
          description: "A inscrição foi eliminada com sucesso",
        });
      },
    });
  };

  const columns: ColumnsType<RegistrationWithId> = [
    {
      title: "Nome",
      dataIndex: "fullName",
      key: "fullName",
    },
    {
      title: "Telefone",
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: "Caravana",
      key: "caravan",
      render: (_, record) => caravanMap[record.caravanId] || record.caravanId,
    },
    {
      title: "Capela",
      key: "chapel",
      render: (_, record) => chapelMap[record.chapelId] || record.chapelId,
    },
    {
      title: "Autocarro",
      key: "bus",
      render: (_, record) => busMap[record.busId] || record.busId,
    },
    {
      title: "Status Pagamento",
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
      title: "Status Participação",
      key: "participationStatus",
      render: (_, record) => {
        const color = record.participationStatus === "ACTIVE" ? "green" : "red";
        const label =
          record.participationStatus === "ACTIVE" ? "Ativa" : "Cancelada";
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: "Data de Criação",
      key: "createdAt",
      render: (_, record) => {
        const timestamp = record.createdAt;
        if (timestamp && "toDate" in timestamp) {
          return dayjs(timestamp.toDate()).format("DD/MM/YYYY HH:mm");
        }
        return "-";
      },
    },
    {
      title: "Ações",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            onClick={() =>
              router.push(`/admin/registrations/edit/${record.id}`)
            }
          >
            Editar
          </Button>
          <Button
            type="link"
            danger
            onClick={() => handleDelete(record)}
            loading={isDeleting}
          >
            Eliminar
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <Title level={4} style={{ margin: 0 }}>
          Lista de Inscrições
        </Title>
        <Button
          type="primary"
          onClick={() => router.push("/admin/registrations/new")}
        >
          Nova Inscrição
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={registrations}
        rowKey="id"
        loading={loadingRegistrations}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total: ${total} inscrições`,
        }}
        locale={{
          emptyText: "Nenhuma inscrição criada ainda",
        }}
      />
    </>
  );
};

