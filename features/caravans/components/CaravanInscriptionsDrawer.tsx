"use client";

import { useBus } from "@/features/buses/hooks/buses.hooks";
import { useCaravan } from "@/features/caravans/hooks/caravans.hooks";
import { useChapels } from "@/features/chapels/hooks/chapels.hooks";
import { RegistrationForm } from "@/features/registrations/components/RegistrationForm";
import {
  useCountActiveByBus,
  useRegistrationsByBusId,
} from "@/features/registrations/hooks/registrations.hooks";
import {
  OrdinanceType,
  RegistrationWithId,
} from "@/features/registrations/models/registrations.model";
import { Button, Card, Drawer, Spin, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useMemo, useState } from "react";

const ORDINANCE_TYPE_MAP: Record<OrdinanceType, string> = {
  BAPTISTRY: "Batistério",
  INITIATORY: "Iniciatória",
  ENDOWMENT: "Investidura",
  SEALING: "Selamento",
};

interface CaravanInscriptionsDrawerProps {
  open: boolean;
  onClose: () => void;
  caravanId: string;
}

export const CaravanInscriptionsDrawer = ({
  open,
  onClose,
  caravanId,
}: CaravanInscriptionsDrawerProps) => {
  const { caravan, loading: loadingCaravan } = useCaravan(caravanId);
  const { chapels } = useChapels();

  const chapelMap = useMemo(() => {
    const map = new Map<string, string>();
    chapels.forEach((chapel) => {
      map.set(chapel.id, chapel.name);
    });
    return map;
  }, [chapels]);

  if (loadingCaravan) {
    return (
      <Drawer
        title="Inscrições"
        open={open}
        onClose={onClose}
        size="large"
        destroyOnClose
      >
        <div className="flex justify-center py-8">
          <Spin size="large" />
        </div>
      </Drawer>
    );
  }

  if (!caravan) {
    return (
      <Drawer
        title="Inscrições"
        open={open}
        onClose={onClose}
        size="large"
        destroyOnClose
      >
        <p className="text-gray-500">Caravana não encontrada.</p>
      </Drawer>
    );
  }

  return (
    <Drawer
      title={`Inscrições - ${caravan.name}`}
      open={open}
      onClose={onClose}
      size="large"
      destroyOnClose
    >
      <div className="space-y-4">
        {caravan.busIds && caravan.busIds.length > 0 ? (
          caravan.busIds.map((busId) => (
            <BusInscriptionsCard
              key={busId}
              busId={busId}
              caravanId={caravan.id}
              chapelMap={chapelMap}
            />
          ))
        ) : (
          <Card>
            <p className="text-gray-500">
              Esta caravana não tem autocarros atribuídos.
            </p>
          </Card>
        )}
      </div>
    </Drawer>
  );
};

interface BusInscriptionsCardProps {
  busId: string;
  caravanId: string;
  chapelMap: Map<string, string>;
}

const BusInscriptionsCard = ({
  busId,
  caravanId,
  chapelMap,
}: BusInscriptionsCardProps) => {
  const { bus, loading: loadingBus } = useBus(busId);
  const { registrations, loading: loadingRegistrations } =
    useRegistrationsByBusId(busId, caravanId);

  const { count } = useCountActiveByBus(caravanId, busId);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRegistration, setSelectedRegistration] =
    useState<RegistrationWithId | null>(null);

  const handleEdit = (record: RegistrationWithId) => {
    setSelectedRegistration(record);
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setSelectedRegistration(null);
  };

  const handleEditSuccess = () => {
    setDrawerOpen(false);
    setSelectedRegistration(null);
  };

  if (loadingBus || loadingRegistrations) {
    return (
      <Card>
        <Spin />
      </Card>
    );
  }

  if (!bus) {
    return (
      <Card>
        <p className="text-gray-500">Autocarro não encontrado.</p>
      </Card>
    );
  }

  const available = bus.capacity - count;
  const isFull = count >= bus.capacity;

  const columns: ColumnsType<RegistrationWithId> = [
    {
      title: "Nome Completo",
      dataIndex: "fullName",
      key: "fullName",
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
      title: "Status de Pagamento",
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
      title: "Ordenança",
      key: "ordinance",
      render: (_, record) => {
        const ordinanceTypeLabel =
          ORDINANCE_TYPE_MAP[record.ordinanceType] || record.ordinanceType;
        return `${ordinanceTypeLabel} - ${record.ordinanceSlot}`;
      },
    },
    {
      title: "Ações",
      key: "actions",
      render: (_, record) => (
        <Button type="link" onClick={() => handleEdit(record)}>
          Editar
        </Button>
      ),
    },
  ];

  return (
    <>
      <Card
        title={
          <div className="flex items-center justify-between">
            <span>{bus.name}</span>
            <Tag color={isFull ? "red" : "green"}>
              {count}/{bus.capacity} lugares ({available} disponíveis)
            </Tag>
          </div>
        }
      >
        <Table
          columns={columns}
          dataSource={registrations}
          rowKey="id"
          loading={loadingRegistrations}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total: ${total} passageiros`,
          }}
          locale={{
            emptyText: "Nenhum passageiro registrado neste autocarro",
          }}
        />
      </Card>

      <Drawer
        title="Editar Inscrição"
        open={drawerOpen}
        onClose={handleDrawerClose}
        size="large"
        destroyOnClose
      >
        {selectedRegistration && (
          <RegistrationForm
            mode="edit"
            registrationId={selectedRegistration.id}
            initialRegistrationData={selectedRegistration}
            onSuccess={handleEditSuccess}
          />
        )}
      </Drawer>
    </>
  );
};
