"use client";

import { useBus } from "@/features/buses/hooks/buses.hooks";
import { CaravanForm } from "@/features/caravans/components/CaravanForm";
import { PaymentStatusDrawer } from "@/features/caravans/components/PaymentStatusDrawer";
import {
  useCaravan,
  useCaravans,
  useDeleteCaravan,
} from "@/features/caravans/hooks/caravans.hooks";
import { CaravanWithId } from "@/features/caravans/models/caravans.model";
import { useCountActiveByBus } from "@/features/registrations/hooks/registrations.hooks";
import { toDate } from "@/common/utils/timestamp.utils";
import { App, Button, Drawer, Space, Spin, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash } from "phosphor-react";
import { useState } from "react";

const { Title } = Typography;

interface CaravanOccupationProps {
  caravan: CaravanWithId;
}

const CaravanOccupation = ({ caravan }: CaravanOccupationProps) => {
  const busIds = caravan.busIds || [];

  if (busIds.length === 0) {
    return <span className="text-gray-400">Sem autocarros</span>;
  }

  return (
    <div className="space-y-1">
      {busIds.map((busId) => (
        <BusOccupation key={busId} busId={busId} caravanId={caravan.id} />
      ))}
    </div>
  );
};

interface BusOccupationProps {
  busId: string;
  caravanId: string;
}

const BusOccupation = ({ busId, caravanId }: BusOccupationProps) => {
  const { bus, loading: loadingBus } = useBus(busId);
  const { count, loading: loadingCount } = useCountActiveByBus(
    caravanId,
    busId
  );

  if (loadingBus || loadingCount || !bus) {
    return <span className="text-gray-400">-</span>;
  }

  const available = bus.capacity - count;
  const isFull = count >= bus.capacity;
  const isAlmostFull = available <= 3 && available > 0;

  const color = isFull ? "red" : isAlmostFull ? "orange" : "green";

  return (
    <div className="text-sm">
      <Tag color={color}>
        {bus.name}: {available} disponíveis
      </Tag>
    </div>
  );
};

export const CaravansList = () => {
  const router = useRouter();
  const { notification, modal } = App.useApp();
  const { caravans, loading } = useCaravans();
  const { deleteCaravan, isPending: isDeleting } = useDeleteCaravan();

  const [paymentDrawerOpen, setPaymentDrawerOpen] = useState(false);
  const [selectedCaravanForPayment, setSelectedCaravanForPayment] = useState<
    string | null
  >(null);

  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [selectedCaravanForEdit, setSelectedCaravanForEdit] = useState<
    string | null
  >(null);

  const handleViewPaymentStatus = (caravanId: string) => {
    setSelectedCaravanForPayment(caravanId);
    setPaymentDrawerOpen(true);
  };

  const handleClosePaymentDrawer = () => {
    setPaymentDrawerOpen(false);
    setSelectedCaravanForPayment(null);
  };

  const handleEdit = (caravanId: string) => {
    setSelectedCaravanForEdit(caravanId);
    setEditDrawerOpen(true);
  };

  const handleCloseEditDrawer = () => {
    setEditDrawerOpen(false);
    setSelectedCaravanForEdit(null);
  };

  const handleEditSuccess = () => {
    setEditDrawerOpen(false);
    setSelectedCaravanForEdit(null);
  };

  const handleDelete = (caravan: CaravanWithId) => {
    modal.confirm({
      title: "Eliminar Caravana",
      content: `Tem certeza que deseja eliminar a caravana "${caravan.name}"?`,
      okText: "Eliminar",
      okType: "danger",
      cancelText: "Cancelar",
      onOk: () => {
        deleteCaravan(caravan.id);
        notification.success({
          title: "Sucesso",
          description: "A caravana foi eliminada com sucesso",
        });
      },
    });
  };

  const columns: ColumnsType<CaravanWithId> = [
    {
      title: "Status",
      key: "isActive",
      render: (_, record) => {
        const now = new Date();
        const formOpenAt = toDate(record.formOpenAt);
        const formCloseAt = toDate(record.formCloseAt);

        let isActive = false;
        if (formOpenAt && formCloseAt) {
          isActive = now >= formOpenAt && now <= formCloseAt;
        }

        return (
          <Tag color={isActive ? "green" : "default"}>
            {isActive ? "Ativa" : "Inativa"}
          </Tag>
        );
      },
    },
    {
      title: "Nome da Caravana",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Partida",
      key: "departureAt",
      render: (_, record) => {
        const date = toDate(record.departureAt);
        return date ? dayjs(date).format("DD/MM/YYYY HH:mm") : "-";
      },
    },
    {
      title: "Regresso",
      key: "returnAt",
      render: (_, record) => {
        const date = toDate(record.returnAt);
        return date ? dayjs(date).format("DD/MM/YYYY HH:mm") : "-";
      },
    },
    {
      title: "Vagas disponíveis",
      key: "occupation",
      render: (_, record) => {
        return <CaravanOccupation caravan={record} />;
      },
    },
    {
      title: "Ações",
      key: "actions",
      render: (_, record) => (
        <Space size={"large"} className="w-82">
          <Button
            type="primary"
            onClick={() =>
              router.push(`/admin/caravans/distribution?caravanId=${record.id}`)
            }
          >
            Ver inscrições
          </Button>
          <Button
            type="primary"
            onClick={() => handleViewPaymentStatus(record.id)}
          >
            Ver pagamentos
          </Button>
          <Button
            type="link"
            icon={<Pencil size={16} />}
            onClick={() => handleEdit(record.id)}
          />
          <Button
            type="link"
            danger
            icon={<Trash size={16} />}
            onClick={() => handleDelete(record)}
            loading={isDeleting}
          />
        </Space>
      ),
    },
  ];

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <Title level={4} style={{ margin: 0 }}>
          Lista de Caravanas
        </Title>
        <Button
          type="primary"
          icon={<Plus size={16} />}
          onClick={() => router.push("/admin/caravans/new")}
        >
          Nova Caravana
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={caravans}
        rowKey="id"
        loading={loading}
        scroll={{ x: true }}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total: ${total} caravanas`,
          responsive: true,
        }}
        locale={{
          emptyText: "Nenhuma caravana criada ainda",
        }}
      />

      {selectedCaravanForPayment && (
        <PaymentStatusDrawer
          open={paymentDrawerOpen}
          onClose={handleClosePaymentDrawer}
          caravanId={selectedCaravanForPayment}
        />
      )}

      {selectedCaravanForEdit && (
        <EditCaravanDrawer
          open={editDrawerOpen}
          onClose={handleCloseEditDrawer}
          caravanId={selectedCaravanForEdit}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
};

interface EditCaravanDrawerProps {
  open: boolean;
  onClose: () => void;
  caravanId: string;
  onSuccess: () => void;
}

const EditCaravanDrawer = ({
  open,
  onClose,
  caravanId,
  onSuccess,
}: EditCaravanDrawerProps) => {
  const { caravan, loading } = useCaravan(caravanId);

  return (
    <Drawer
      title="Editar Caravana"
      open={open}
      onClose={onClose}
      size="large"
      destroyOnClose
    >
      {loading ? (
        <div className="flex justify-center py-8">
          <Spin size="large" />
        </div>
      ) : caravan ? (
        <CaravanForm
          mode="edit"
          caravanId={caravan.id}
          initialCaravanData={caravan}
          onSuccess={onSuccess}
        />
      ) : (
        <p className="text-gray-500">Caravana não encontrada.</p>
      )}
    </Drawer>
  );
};
