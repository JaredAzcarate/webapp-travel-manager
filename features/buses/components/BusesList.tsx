"use client";

import { BusStopsModal } from "@/features/buses/components/BusStopsModal";
import { useBuses, useDeleteBus } from "@/features/buses/hooks/buses.hooks";
import { useBusStops } from "@/features/buses/hooks/busStops.hooks";
import { BusWithId } from "@/features/buses/models/buses.model";
import { App, Button, Space, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { MapPin, Pencil, Plus, Trash } from "phosphor-react";
import { useMemo, useState } from "react";

const { Title } = Typography;

interface BusTableData extends BusWithId {
  stopsCount: number;
}

export const BusesList = () => {
  const router = useRouter();
  const { notification, modal } = App.useApp();
  const { buses, loading: loadingBuses } = useBuses();
  const { busStops, loading: loadingStops } = useBusStops();
  const { deleteBus, isPending: isDeleting } = useDeleteBus();
  const [selectedBusId, setSelectedBusId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const stopsByBusId = useMemo(() => {
    const grouped: Record<string, number> = {};
    busStops.forEach((stop) => {
      grouped[stop.busId] = (grouped[stop.busId] || 0) + 1;
    });
    return grouped;
  }, [busStops]);

  const tableData: BusTableData[] = useMemo(() => {
    return buses.map((bus) => ({
      ...bus,
      stopsCount: stopsByBusId[bus.id] || 0,
    }));
  }, [buses, stopsByBusId]);

  const handleDelete = (bus: BusWithId) => {
    modal.confirm({
      title: "Eliminar Autocarro",
      content: `Tem certeza que deseja eliminar o autocarro "${bus.name}"?`,
      okText: "Eliminar",
      okType: "danger",
      cancelText: "Cancelar",
      onOk: () => {
        deleteBus(bus.id);
        notification.success({
          title: "Sucesso",
          description: "O autocarro foi eliminado com sucesso",
        });
      },
    });
  };

  const handleViewStops = (busId: string) => {
    setSelectedBusId(busId);
    setIsModalOpen(true);
  };

  const columns: ColumnsType<BusTableData> = [
    {
      title: "Nome",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Capacidade",
      dataIndex: "capacity",
      key: "capacity",
      render: (capacity: number) => `${capacity} lugares`,
    },
    {
      title: "Número de Paradas",
      key: "stopsCount",
      render: (_, record) => (
        <Tag color={record.stopsCount > 0 ? "blue" : "default"}>
          {record.stopsCount} {record.stopsCount === 1 ? "parada" : "paradas"}
        </Tag>
      ),
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
            icon={<MapPin size={16} />}
            onClick={() => handleViewStops(record.id)}
            disabled={record.stopsCount === 0}
          >
            Ver Paradas
          </Button>
          <Button
            type="link"
            icon={<Pencil size={16} />}
            onClick={() => router.push(`/admin/buses/edit/${record.id}`)}
          >
            Editar
          </Button>
          <Button
            type="link"
            danger
            icon={<Trash size={16} />}
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
          Lista de Autocarros
        </Title>
        <Button
          type="primary"
          icon={<Plus size={16} />}
          onClick={() => router.push("/admin/buses/new")}
        >
          Novo Autocarro
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={tableData}
        rowKey="id"
        loading={loadingBuses || loadingStops}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total: ${total} autocarros`,
        }}
        locale={{
          emptyText: "Nenhum autocarro criado ainda",
        }}
      />

      {selectedBusId && (
        <BusStopsModal
          busId={selectedBusId}
          open={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedBusId(null);
          }}
        />
      )}
    </>
  );
};
