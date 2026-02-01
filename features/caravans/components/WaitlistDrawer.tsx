"use client";

import { useBus, useBuses } from "@/features/buses/hooks/buses.hooks";
import { useCaravan } from "@/features/caravans/hooks/caravans.hooks";
import {
  useCountActiveByBus,
  usePromoteFromWaitlist,
  useWaitlistByCaravanId,
} from "@/features/registrations/hooks/registrations.hooks";
import { RegistrationWithId } from "@/features/registrations/models/registrations.model";
import { App, Button, Drawer, Spin, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { Check } from "phosphor-react";

const { Title } = Typography;

interface WaitlistDrawerProps {
  open: boolean;
  onClose: () => void;
  caravanId: string;
  chapelMap: Map<string, string>;
}

export const WaitlistDrawer = ({
  open,
  onClose,
  caravanId,
  chapelMap,
}: WaitlistDrawerProps) => {
  const { notification } = App.useApp();
  const { waitlist, loading } = useWaitlistByCaravanId(caravanId);
  const { caravan, loading: loadingCaravan } = useCaravan(caravanId);
  const { buses } = useBuses();
  const {
    promoteFromWaitlist,
    isPending: isPromoting,
    isSuccess: promoted,
    error: promoteError,
  } = usePromoteFromWaitlist();

  const handlePromote = async (registration: RegistrationWithId) => {
    try {
      await promoteFromWaitlist(registration.id);
      notification.success({
        title: "Sucesso",
        description: `${registration.fullName} foi promovido da lista de espera`,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";
      notification.error({
        title: "Erro",
        description: `Não foi possível promover: ${errorMessage}`,
      });
    }
  };

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
      title: "Autocarro",
      key: "busId",
      render: (_, record) => {
        return <BusName busId={record.busId} />;
      },
    },
    {
      title: "Data de Inscrição",
      key: "createdAt",
      render: (_, record) => {
        if (!record.createdAt) return "-";
        const date =
          "toDate" in record.createdAt
            ? record.createdAt.toDate()
            : new Date(record.createdAt);
        return dayjs(date).format("DD/MM/YYYY HH:mm");
      },
    },
    {
      title: "Ações",
      key: "actions",
      render: (_, record) => {
        return (
          <PromoteButton
            registration={record}
            onPromote={handlePromote}
            isPromoting={isPromoting}
          />
        );
      },
    },
  ];

  return (
    <Drawer
      title="Lista de Espera"
      open={open}
      onClose={onClose}
      size="large"
      placement="right"
    >
      {loading || loadingCaravan ? (
        <div className="flex justify-center py-8">
          <Spin size="large" />
        </div>
      ) : (
        <>
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <div className="text-sm font-medium text-gray-700 mb-2">
              Vagas Disponíveis na Viagem
            </div>
            <div className="flex gap-4 flex-wrap">
              {caravan?.busIds.map((busId) => {
                const bus = buses.find((b) => b.id === busId);
                if (!bus) return null;
                return (
                  <BusAvailableSpotsCard
                    key={busId}
                    busId={busId}
                    busName={bus.name}
                    caravanId={caravanId}
                  />
                );
              })}
            </div>
          </div>

          <Table
            columns={columns}
            dataSource={waitlist || []}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total: ${total} em lista de espera`,
            }}
            locale={{
              emptyText: "Nenhuma pessoa em lista de espera para esta viagem",
            }}
          />
        </>
      )}
    </Drawer>
  );
};

const BusName = ({ busId }: { busId: string }) => {
  const { bus, loading } = useBus(busId);

  if (loading) {
    return <Spin size="small" />;
  }

  return <span>{bus?.name || busId}</span>;
};

const BusAvailableSpotsCard = ({
  busId,
  busName,
  caravanId,
}: {
  busId: string;
  busName: string;
  caravanId: string;
}) => {
  const { count } = useCountActiveByBus(caravanId, busId);
  const { buses } = useBuses();
  const bus = buses.find((b) => b.id === busId);

  if (!bus) return null;

  const available = bus.capacity - count;
  return (
    <div className="flex items-center gap-2">
      <span className="font-medium">{busName}:</span>
      <Tag color={available > 0 ? "green" : "red"}>
        {available > 0 ? `${available} vagas disponíveis` : "Cheio"}
      </Tag>
    </div>
  );
};

const PromoteButton = ({
  registration,
  onPromote,
  isPromoting,
}: {
  registration: RegistrationWithId;
  onPromote: (registration: RegistrationWithId) => void;
  isPromoting: boolean;
}) => {
  const { buses } = useBuses();
  const { count } = useCountActiveByBus(
    registration.caravanId,
    registration.busId
  );
  const bus = buses.find((b) => b.id === registration.busId);

  if (!bus) return null;

  const available = bus.capacity - count;
  const canPromote = available > 0;

  return (
    <Button
      type="primary"
      size="small"
      icon={<Check size={16} />}
      onClick={() => onPromote(registration)}
      disabled={!canPromote}
      loading={isPromoting}
    >
      Promover
    </Button>
  );
};
