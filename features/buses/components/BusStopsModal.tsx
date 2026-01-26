"use client";

import { useBusStopsByBusId } from "@/features/buses/hooks/busStops.hooks";
import { BusStopWithId } from "@/features/buses/models/busStops.model";
import { useChapels } from "@/features/chapels/hooks/chapels.hooks";
import { Drawer, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { useMemo } from "react";

interface BusStopsModalProps {
  busId: string;
  open: boolean;
  onClose: () => void;
}

export const BusStopsModal = ({ busId, open, onClose }: BusStopsModalProps) => {
  const { busStops, loading, error } = useBusStopsByBusId(
    open && busId ? busId : ""
  );
  const { chapels } = useChapels();

  const chapelMap = useMemo(() => {
    const map: Record<string, string> = {};
    chapels.forEach((chapel) => {
      map[chapel.id] = chapel.name;
    });
    return map;
  }, [chapels]);

  const columns: ColumnsType<BusStopWithId> = [
    {
      title: "Ordem",
      dataIndex: "order",
      key: "order",
      width: 80,
      render: (order: number) => <Tag color="blue">{order}</Tag>,
    },
    {
      title: "Unidade",
      key: "chapel",
      render: (_, record) => chapelMap[record.chapelId] || record.chapelId,
    },
    {
      title: "Hora de saída",
      key: "pickupTime",
      render: (_, record) => {
        if (record.pickupTime && "toDate" in record.pickupTime) {
          return dayjs(record.pickupTime.toDate()).format("HH:mm");
        }
        return "-";
      },
    },
  ];

  return (
    <Drawer
      title="Paragens do Autocarro"
      placement="right"
      onClose={onClose}
      open={open}
      size={600}
      key={busId}
    >
      {error && (
        <div className="text-red-500 mb-4">
          Erro ao carregar paragens: {error}
        </div>
      )}
      <Table
        columns={columns}
        dataSource={busStops}
        rowKey="id"
        loading={loading}
        pagination={false}
        locale={{
          emptyText: "Nenhuma paragem configurada para este autocarro",
        }}
      />
    </Drawer>
  );
};
