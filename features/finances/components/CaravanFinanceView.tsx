"use client";

import type { ChapelFinanceRow } from "@/common/utils/caravanFinancial.utils";
import {
  computeRegistrationTripAmount,
  getActiveParticipantCount,
  pendingFromBalance,
} from "@/common/utils/caravanFinancial.utils";
import { toDate } from "@/common/utils/timestamp.utils";
import {
  formatEuroAmount,
  resolveCaravanPricing,
  roundEuroAmount,
} from "@/common/utils/tripPrice.utils";
import { useCaravans } from "@/features/caravans/hooks/caravans.hooks";
import type { CaravanWithId } from "@/features/caravans/models/caravans.model";
import { ChapelTransferDrawer } from "@/features/finances/components/ChapelTransferDrawer";
import {
  useCaravanFinanceSummary,
  useCloseCaravanFinances,
  useFinanceOverview,
  useReopenCaravanFinances,
} from "@/features/finances/hooks/finances.hooks";
import type { ChapelTransferWithId } from "@/features/finances/models/chapelTransfers.model";
import { registrationRepository } from "@/features/registrations/repositories/registrations.repository";
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
import dayjs from "dayjs";
import { useRouter, useSearchParams } from "next/navigation";
import { DownloadSimple, Lock, LockOpen } from "phosphor-react";
import { useEffect, useMemo, useState } from "react";

const { Text } = Typography;

function getDepartureTime(caravan: CaravanWithId): number {
  return toDate(caravan.departureAt)?.getTime() ?? 0;
}

function sanitizeFileName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function CaravanFinanceView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { notification } = App.useApp();
  const caravanId = searchParams.get("caravanId") ?? "";
  const { caravans, loading: loadingCaravans } = useCaravans();
  const { summary, loading: loadingSummary } = useCaravanFinanceSummary(caravanId);
  const { overview } = useFinanceOverview();
  const { closeFinances, isPending: isClosing } = useCloseCaravanFinances();
  const { reopenFinances, isPending: isReopening } = useReopenCaravanFinances();
  const [selectedRow, setSelectedRow] = useState<ChapelFinanceRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [exportingChapelId, setExportingChapelId] = useState<string | null>(null);

  const selectedCaravan = useMemo(
    () => caravans.find((caravan) => caravan.id === caravanId),
    [caravans, caravanId]
  );

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

  const handleReopenFinances = () => {
    if (!caravanId) return;
    reopenFinances(caravanId, {
      onSuccess: () => {
        notification.success({
          title: "Sucesso",
          description:
            "O acompanhamento desta viagem foi reaberto e voltará a aparecer na visão geral",
        });
      },
      onError: (error) => {
        notification.error({
          title: "Erro",
          description:
            error instanceof Error
              ? error.message
              : "Não foi possível reabrir o acompanhamento",
        });
      },
    });
  };

  const handleExportChapelPdf = async (row: ChapelFinanceRow) => {
    if (!caravanId || !selectedCaravan || getActiveParticipantCount(row) === 0) {
      return;
    }

    try {
      setExportingChapelId(row.chapelId);

      const [registrations, transfersResponse] = await Promise.all([
        registrationRepository.getFiltered(caravanId, {
          chapelId: row.chapelId,
          participationStatus: "ACTIVE",
        }),
        fetch(
          `/api/finances/transfers?caravanId=${encodeURIComponent(caravanId)}&chapelId=${encodeURIComponent(row.chapelId)}`
        ),
      ]);

      if (!transfersResponse.ok) {
        const result = await transfersResponse.json().catch(() => ({}));
        throw new Error(result.message || "Erro ao buscar transferências");
      }

      const transfersPayload = await transfersResponse.json();
      const transfers = (transfersPayload.transfers ??
        []) as ChapelTransferWithId[];

      const pricing = resolveCaravanPricing(selectedCaravan);
      const lines = registrations
        .map((registration) => ({
          fullName: registration.fullName || "N/A",
          phone: registration.phone || "N/A",
          amount: computeRegistrationTripAmount(registration, pricing),
        }))
        .sort((a, b) => a.fullName.localeCompare(b.fullName, "pt"));

      const totalDue = roundEuroAmount(
        lines.reduce((sum, line) => sum + line.amount, 0)
      );
      const totalPaid = roundEuroAmount(
        transfers.reduce((sum, transfer) => sum + transfer.amount, 0)
      );
      const balance = roundEuroAmount(totalDue - totalPaid);
      const pendingBalance = pendingFromBalance(balance);
      const chapelCreditBalance =
        overview.find((item) => item.chapelId === row.chapelId)?.creditBalance ??
        0;

      const paymentLines = [...transfers].sort((a, b) => {
        const aTime = toDate(a.transferredAt)?.getTime() ?? 0;
        const bTime = toDate(b.transferredAt)?.getTime() ?? 0;
        return aTime - bTime;
      });

      const jsPDF = (await import("jspdf")).default;
      const doc = new jsPDF();
      let yPosition = 20;

      const ensureSpace = (needed = 20) => {
        if (yPosition + needed > 280) {
          doc.addPage();
          yPosition = 20;
        }
      };

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("Resumo financeiro", 105, yPosition, { align: "center" });
      yPosition += 10;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(`Viagem: ${selectedCaravan.name}`, 14, yPosition);
      yPosition += 7;
      doc.text(`Ala: ${row.chapelName}`, 14, yPosition);
      yPosition += 7;
      doc.text(
        `Emitida em: ${new Date().toLocaleDateString("pt-PT", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}`,
        14,
        yPosition
      );
      yPosition += 14;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("1. Participantes", 14, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      const participantHeaders = ["Nome completo", "Telefone", "Valor a pagar"];
      const participantWidths = [90, 45, 40];
      const startX = 14;

      participantHeaders.forEach((header, index) => {
        const xPos =
          startX + participantWidths.slice(0, index).reduce((a, b) => a + b, 0);
        doc.text(header, xPos, yPosition);
      });
      yPosition += 3;
      doc.setLineWidth(0.4);
      doc.line(14, yPosition, 196, yPosition);
      yPosition += 6;

      doc.setFont("helvetica", "normal");

      if (lines.length === 0) {
        doc.text("Nenhum participante ativo encontrado.", 14, yPosition);
        yPosition += 8;
      } else {
        for (const line of lines) {
          ensureSpace(10);
          const rowData = [
            line.fullName,
            line.phone,
            formatEuroAmount(line.amount),
          ];
          rowData.forEach((text, index) => {
            const xPos =
              startX +
              participantWidths.slice(0, index).reduce((a, b) => a + b, 0);
            doc.text(text, xPos, yPosition, {
              maxWidth: participantWidths[index] - 2,
            });
          });
          yPosition += 7;
        }
      }

      yPosition += 2;
      doc.setLineWidth(0.4);
      doc.line(14, yPosition, 196, yPosition);
      yPosition += 8;
      doc.setFont("helvetica", "bold");
      doc.text(`Total a pagar: ${formatEuroAmount(totalDue)}`, 14, yPosition);
      yPosition += 14;

      ensureSpace(40);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("2. Pagamentos efetuados", 14, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      const paymentHeaders = ["Data", "Montante", "Notas"];
      const paymentWidths = [35, 40, 100];

      paymentHeaders.forEach((header, index) => {
        const xPos =
          startX + paymentWidths.slice(0, index).reduce((a, b) => a + b, 0);
        doc.text(header, xPos, yPosition);
      });
      yPosition += 3;
      doc.line(14, yPosition, 196, yPosition);
      yPosition += 6;

      doc.setFont("helvetica", "normal");

      if (paymentLines.length === 0) {
        doc.text("Nenhum pagamento registado.", 14, yPosition);
        yPosition += 8;
      } else {
        for (const transfer of paymentLines) {
          ensureSpace(10);
          const transferDate = toDate(transfer.transferredAt);
          const rowData = [
            transferDate ? dayjs(transferDate).format("DD/MM/YYYY") : "-",
            formatEuroAmount(transfer.amount),
            transfer.notes?.trim() || "-",
          ];
          rowData.forEach((text, index) => {
            const xPos =
              startX + paymentWidths.slice(0, index).reduce((a, b) => a + b, 0);
            doc.text(text, xPos, yPosition, {
              maxWidth: paymentWidths[index] - 2,
            });
          });
          yPosition += 7;
        }
      }

      yPosition += 2;
      doc.line(14, yPosition, 196, yPosition);
      yPosition += 8;
      doc.setFont("helvetica", "bold");
      doc.text(`Total pago: ${formatEuroAmount(totalPaid)}`, 14, yPosition);
      yPosition += 14;

      ensureSpace(40);
      doc.setFontSize(12);
      doc.text("3. Resumo", 14, yPosition);
      yPosition += 10;

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(`Total a pagar: ${formatEuroAmount(totalDue)}`, 14, yPosition);
      yPosition += 7;
      doc.text(`Total pago: ${formatEuroAmount(totalPaid)}`, 14, yPosition);
      yPosition += 7;
      doc.setFont("helvetica", "bold");
      doc.text(
        `Saldo pendente: ${formatEuroAmount(pendingBalance)}`,
        14,
        yPosition
      );
      yPosition += 7;
      if (chapelCreditBalance > 0) {
        doc.text(
          `Saldo a favor (unidade): ${formatEuroAmount(chapelCreditBalance)}`,
          14,
          yPosition
        );
      }

      const fileName = `resumo-financeiro-${sanitizeFileName(selectedCaravan.name)}-${sanitizeFileName(row.chapelName)}-${new Date().toISOString().split("T")[0]}.pdf`;
      doc.save(fileName);

      notification.success({
        title: "Sucesso",
        description: "Resumo financeiro PDF exportado com sucesso",
      });
    } catch (error) {
      console.error("Error generating chapel finance PDF:", error);
      notification.error({
        title: "Erro",
        description:
          error instanceof Error
            ? error.message
            : "Não foi possível exportar o PDF",
      });
    } finally {
      setExportingChapelId(null);
    }
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
      render: (value: number) => {
        const pending = pendingFromBalance(value);
        return (
          <Text
            className={pending > 0 ? "text-orange-600" : "text-gray-500"}
          >
            {formatEuroAmount(pending)}
          </Text>
        );
      },
    },
    {
      title: "",
      key: "actions",
      width: 56,
      fixed: "right",
      render: (_, record) => {
        const hasParticipants = getActiveParticipantCount(record) > 0;
        return (
          <Button
            type="text"
            icon={<DownloadSimple size={18} />}
            disabled={!hasParticipants}
            loading={exportingChapelId === record.chapelId}
            aria-label={`Descarregar PDF de ${record.chapelName}`}
            onClick={(event) => {
              event.stopPropagation();
              void handleExportChapelPdf(record);
            }}
          />
        );
      },
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
            description="Esta viagem deixará de aparecer nos saldos pendentes da visão geral. Os registos de transferências mantêm-se. Pode reabrir o acompanhamento a partir desta página."
            okText="Finalizar"
            cancelText="Cancelar"
            onConfirm={handleCloseFinances}
          >
            <Button icon={<Lock size={16} />} loading={isClosing}>
              Finalizar acompanhamento
            </Button>
          </Popconfirm>
        )}

        {summary?.financialStatus === "CLOSED" && caravanId && (
          <Popconfirm
            title="Reabrir o acompanhamento desta viagem?"
            description="Esta viagem voltará a aparecer nos saldos pendentes da visão geral. Os registos de transferências mantêm-se."
            okText="Reabrir"
            cancelText="Cancelar"
            onConfirm={handleReopenFinances}
          >
            <Button icon={<LockOpen size={16} />} loading={isReopening}>
              Reabrir acompanhamento
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
            scroll={{ x: 980 }}
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
                        summary.totals.pendingBalance > 0
                          ? "text-orange-600"
                          : "text-gray-500"
                      }
                    >
                      {formatEuroAmount(summary.totals.pendingBalance)}
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={8} />
                </Table.Summary.Row>
              </Table.Summary>
            )}
          />

          <Text type="secondary" className="text-sm">
            Clique numa ala para registar transferências à estaca. Use o ícone de
            descarga para obter o detalhe dos participantes.
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
