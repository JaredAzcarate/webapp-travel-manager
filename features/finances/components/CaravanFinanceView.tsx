"use client";

import type { ChapelFinanceRow } from "@/common/utils/caravanFinancial.utils";
import { toDate } from "@/common/utils/timestamp.utils";
import { formatEuroAmount } from "@/common/utils/tripPrice.utils";
import { useCaravans } from "@/features/caravans/hooks/caravans.hooks";
import type { CaravanWithId } from "@/features/caravans/models/caravans.model";
import { ChapelTransferDrawer } from "@/features/finances/components/ChapelTransferDrawer";
import {
  useCaravanFinanceSummary,
  useCloseCaravanFinances,
} from "@/features/finances/hooks/finances.hooks";
import {
  App,
  Button,
  Popconfirm,
  Select,
  Spin,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock } from "phosphor-react";
import { useEffect, useMemo, useState } from "react";

const { Text } = Typography;

function getDepartureTime(caravan: CaravanWithId): number {
  return toDate(caravan.departureAt)?.getTime() ?? 0;
}

export function CaravanFinanceView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { notification } = App.useApp();
  const caravanId = searchParams.get("caravanId") ?? "";
  const { caravans, loading: loadingCaravans } = useCaravans();
  const { summary, loading: loadingSummary } = useCaravanFinanceSummary(caravanId);
  const { closeFinances, isPending: isClosing } = useCloseCaravanFinances();
  const [selectedRow, setSelectedRow] = useState<ChapelFinanceRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const sortedCaravans = useMemo(
    () =>
      [...caravans].sort(
        (a, b) => getDepartureTime(b) - getDepartureTime(a)
      ),
    [caravans]
  );

  useEffect(() => {
    if (loadingCaravans || sortedCaravans.length === 0 || caravanId) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("caravanId", sortedCaravans[0].id);
    router.replace(`/admin/finances?${params.toString()}`);
  }, [caravanId, loadingCaravans, router, searchParams, sortedCaravans]);

  const handleCaravanChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("caravanId", value);
    params.delete("view");
    router.push(`/admin/finances?${params.toString()}`);
  };

  const handleRowClick = (row: ChapelFinanceRow) => {
    setSelectedRow(row);
    setDrawerOpen(true);
  };

  const handleCloseFinances = () => {
    if (!caravanId) return;
    closeFinances(caravanId, {
      onSuccess: () => {
        notification.success({
          title: "Sucesso",
          description: "O acompanhamento desta viagem foi finalizado",
        });
      },
      onError: (error) => {
        notification.error({
          title: "Erro",
          description:
            error instanceof Error
              ? error.message
              : "Não foi possível finalizar o acompanhamento",
        });
      },
    });
  };

  const columns: ColumnsType<ChapelFinanceRow> = [
    {
      title: "Ala",
      dataIndex: "chapelName",
      key: "chapelName",
      fixed: "left",
      width: 180,
    },
    {
      title: "Adultos",
      dataIndex: "adults",
      key: "adults",
      align: "center",
      width: 90,
    },
    {
      title: "Jovens",
      dataIndex: "youth",
      key: "youth",
      align: "center",
      width: 90,
    },
    {
      title: "Crianças",
      dataIndex: "children",
      key: "children",
      align: "center",
      width: 90,
    },
    {
      title: "Primeira vez",
      dataIndex: "firstTimeConvert",
      key: "firstTimeConvert",
      align: "center",
      width: 110,
    },
    {
      title: "Total por pagar",
      dataIndex: "totalDue",
      key: "totalDue",
      align: "right",
      width: 130,
      render: (value: number) => formatEuroAmount(value),
    },
    {
      title: "Total pago",
      dataIndex: "totalPaid",
      key: "totalPaid",
      align: "right",
      width: 120,
      render: (value: number) => formatEuroAmount(value),
    },
    {
      title: "Saldo",
      dataIndex: "balance",
      key: "balance",
      align: "right",
      width: 110,
      render: (value: number) => (
        <Text className={value > 0 ? "text-orange-600" : "text-green-600"}>
          {formatEuroAmount(value)}
        </Text>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <Text strong>Viagem:</Text>
          <Select
            className="min-w-[260px]"
            placeholder="Selecione uma viagem"
            loading={loadingCaravans}
            value={caravanId || undefined}
            onChange={handleCaravanChange}
            options={sortedCaravans.map((caravan) => ({
              label: caravan.name,
              value: caravan.id,
            }))}
          />
          {summary && (
            <Tag color={summary.financialStatus === "OPEN" ? "blue" : "default"}>
              {summary.financialStatus === "OPEN"
                ? "Em acompanhamento"
                : "Acompanhamento finalizado"}
            </Tag>
          )}
        </div>

        {summary?.financialStatus === "OPEN" && caravanId && (
          <Popconfirm
            title="Finalizar o acompanhamento desta viagem?"
            description="Esta viagem deixará de aparecer nos saldos pendentes da visão geral. Os registos de transferências mantêm-se. Pode reverter editando a viagem."
            okText="Finalizar"
            cancelText="Cancelar"
            onConfirm={handleCloseFinances}
          >
            <Button icon={<Lock size={16} />} loading={isClosing}>
              Finalizar acompanhamento
            </Button>
          </Popconfirm>
        )}
      </div>

      {!caravanId && (
        <div className="py-12 text-center text-gray-500">
          Selecione uma viagem para ver o estado financeiro das alas.
        </div>
      )}

      {caravanId && loadingSummary && (
        <div className="flex justify-center py-12">
          <Spin size="large" />
        </div>
      )}

      {caravanId && summary && !loadingSummary && (
        <>
          <Table
            columns={columns}
            dataSource={summary.rows}
            rowKey="chapelId"
            scroll={{ x: 900 }}
            pagination={false}
            size="middle"
            childrenColumnName="_nestedRows"
            onRow={(record) => ({
              onClick: () => handleRowClick(record),
              className: "cursor-pointer hover:bg-gray-50",
            })}
            summary={() => (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0}>
                    <Text strong>Total</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="center">
                    <Text strong>{summary.totals.adults}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} align="center">
                    <Text strong>{summary.totals.youth}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3} align="center">
                    <Text strong>{summary.totals.children}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4} align="center">
                    <Text strong>{summary.totals.firstTimeConvert}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={5} align="right">
                    <Text strong>{formatEuroAmount(summary.totals.totalDue)}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={6} align="right">
                    <Text strong>{formatEuroAmount(summary.totals.totalPaid)}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={7} align="right">
                    <Text
                      strong
                      className={
                        summary.totals.balance > 0
                          ? "text-orange-600"
                          : "text-green-600"
                      }
                    >
                      {formatEuroAmount(summary.totals.balance)}
                    </Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            )}
          />

          <Text type="secondary" className="text-sm">
            Clique numa ala para registar transferências à estaca.
          </Text>
        </>
      )}

      <ChapelTransferDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedRow(null);
        }}
        caravanId={caravanId}
        row={selectedRow}
      />
    </div>
  );
}
