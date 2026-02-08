"use client";

import { parseSlotToMinutes } from "@/common/utils/slotTime.utils";
import { useBus } from "@/features/buses/hooks/buses.hooks";
import { useCaravan } from "@/features/caravans/hooks/caravans.hooks";
import { useChapels } from "@/features/chapels/hooks/chapels.hooks";
import type { ChapelWithId } from "@/features/chapels/models/chapels.model";
import { useOrdinances } from "@/features/ordinances/hooks/ordinances.hooks";
import { CancelledRegistrationsList } from "@/features/registrations/components/CancelledRegistrationsList";
import { RegistrationForm } from "@/features/registrations/components/RegistrationForm";
import {
  useActiveRegistrationsByBusId,
  useCancelRegistration,
  useCountActiveByBus,
  useCountCancelledByBus,
  useFilteredRegistrations,
} from "@/features/registrations/hooks/registrations.hooks";
import { RegistrationWithId } from "@/features/registrations/models/registrations.model";
import {
  App,
  Button,
  Card,
  Drawer,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useRouter, useSearchParams } from "next/navigation";
import { CaretLeft, FilePdf, FileXls, List, Plus } from "phosphor-react";
import { useMemo, useState } from "react";
import { WaitlistDrawer } from "./WaitlistDrawer";

const { Title } = Typography;

export const CaravanDistributionView = () => {
  const searchParams = useSearchParams();
  const caravanId = searchParams.get("caravanId");
  const { notification } = App.useApp();
  const { chapels } = useChapels();
  const { ordinances } = useOrdinances();
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [waitlistDrawerOpen, setWaitlistDrawerOpen] = useState(false);
  const router = useRouter();

  const ordinanceIdToNameMap = useMemo(() => {
    const map = new Map<string, string>();
    ordinances.forEach((ordinance) => {
      map.set(ordinance.id, ordinance.name);
    });
    return map;
  }, [ordinances]);

  const { caravan: selectedCaravan, loading: loadingCaravan } = useCaravan(
    caravanId || ""
  );

  const chapelMap = useMemo(() => {
    const map = new Map<string, string>();
    chapels.forEach((chapel) => {
      map.set(chapel.id, chapel.name);
    });
    return map;
  }, [chapels]);

  const { registrations: registrationsWithOrdinances } = useFilteredRegistrations(
    caravanId ?? "",
    { participationStatus: "ACTIVE", withOrdinances: true }
  );

  const sortedSessions = useMemo(() => {
    const seen = new Set<string>();
    const sessions: { ordinanceId: string; slot: string }[] = [];
    registrationsWithOrdinances.forEach((r) => {
      r.ordinances?.forEach((ord) => {
        if (ord.ordinanceId && ord.slot) {
          const key = `${ord.ordinanceId}|${ord.slot}`;
          if (!seen.has(key)) {
            seen.add(key);
            sessions.push({ ordinanceId: ord.ordinanceId, slot: ord.slot });
          }
        }
      });
    });
    sessions.sort((a, b) => {
      const timeA = parseSlotToMinutes(a.slot);
      const timeB = parseSlotToMinutes(b.slot);
      if (timeA !== timeB) return timeA - timeB;
      const nameA = ordinanceIdToNameMap.get(a.ordinanceId) ?? a.ordinanceId;
      const nameB = ordinanceIdToNameMap.get(b.ordinanceId) ?? b.ordinanceId;
      return nameA.localeCompare(nameB, "pt-PT");
    });
    return sessions;
  }, [registrationsWithOrdinances, ordinanceIdToNameMap]);

  const ordinanceExportMatrix = useMemo(() => {
    const participantsBySession = new Map<
      string,
      { fullName: string; gender: string }[]
    >();
    sortedSessions.forEach(({ ordinanceId, slot }) => {
      const key = `${ordinanceId}|${slot}`;
      participantsBySession.set(key, []);
    });
    registrationsWithOrdinances.forEach((r) => {
      r.ordinances?.forEach((ord) => {
        if (ord.ordinanceId && ord.slot) {
          const key = `${ord.ordinanceId}|${ord.slot}`;
          const list = participantsBySession.get(key);
          if (list) {
            list.push({
              fullName: r.fullName || "N/A",
              gender: r.gender || "",
            });
          }
        }
      });
    });

    const headerRow: string[] = [];
    sortedSessions.forEach(({ ordinanceId, slot }) => {
      const label = `${ordinanceIdToNameMap.get(ordinanceId) ?? ordinanceId} ${slot}`;
      headerRow.push(label, "M/F");
    });

    const maxRows = Math.max(
      0,
      ...sortedSessions.map(({ ordinanceId, slot }) => {
        const key = `${ordinanceId}|${slot}`;
        return participantsBySession.get(key)?.length ?? 0;
      })
    );

    const dataRows: string[][] = [];
    for (let i = 0; i < maxRows; i++) {
      const row: string[] = [];
      sortedSessions.forEach(({ ordinanceId, slot }) => {
        const key = `${ordinanceId}|${slot}`;
        const list = participantsBySession.get(key) ?? [];
        const participant = list[i];
        row.push(participant?.fullName ?? "", participant?.gender ?? "");
      });
      dataRows.push(row);
    }

    return [headerRow, ...dataRows];
  }, [registrationsWithOrdinances, sortedSessions, ordinanceIdToNameMap]);

  const [isExportingOrdinances, setIsExportingOrdinances] = useState(false);

  if (!caravanId) {
    return (
      <div className="space-y-4">
        <Title level={4}>Distribuição de Passageiros</Title>
        <Card>
          <p className="text-gray-500">
            Nenhuma viagem selecionada. Por favor, selecione uma viagem da
            lista.
          </p>
        </Card>
      </div>
    );
  }

  const handleCreateRegistration = () => {
    setCreateDrawerOpen(true);
  };

  const handleCreateSuccess = () => {
    setCreateDrawerOpen(false);
  };

  const handleOpenWaitlist = () => {
    setWaitlistDrawerOpen(true);
  };

  const handleCloseWaitlist = () => {
    setWaitlistDrawerOpen(false);
  };

  const handleExportOrdinancesBySession = async () => {
    if (registrationsWithOrdinances.length === 0) {
      notification.warning({
        title: "Sem dados",
        description: "Nenhum participante com ordenanças nesta viagem.",
      });
      return;
    }
    try {
      setIsExportingOrdinances(true);
      const ExcelJS = await import("exceljs");
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Ordenanças por sessão", {
        views: [{ state: "frozen", ySplit: 1 }],
      });
      ordinanceExportMatrix.forEach((row, rowIndex) => {
        sheet.addRow(row);
        if (rowIndex === 0) {
          const headerRow = sheet.getRow(1);
          headerRow.font = { bold: true };
          headerRow.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFE0E0E0" },
          };
        }
      });
      sheet.columns = ordinanceExportMatrix[0]?.map(() => ({ width: 22 })) ?? [];
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const safeName = (selectedCaravan?.name ?? "viagem").replace(/\s+/g, "-");
      link.download = `ordenancas-por-sessao-${safeName}-${new Date().toISOString().split("T")[0]}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
      notification.success({
        title: "Sucesso",
        description: "Excel exportado com sucesso",
      });
    } catch (error) {
      console.error("Error generating ordinances Excel:", error);
      notification.error({
        title: "Erro",
        description:
          "Não foi possível exportar o Excel. Tente novamente.",
      });
    } finally {
      setIsExportingOrdinances(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <Button icon={<CaretLeft size={16} />} onClick={() => router.push("/admin/caravans")}>
          </Button>
          <Title level={4} style={{ margin: 0 }}>
            Inscrições da viagem
          </Title>
        </div>
        {selectedCaravan && (
          <Space>
            <Button
              type="default"
              icon={<FileXls size={16} />}
              onClick={handleExportOrdinancesBySession}
              loading={isExportingOrdinances}
            >
              Exportar para o Templo
            </Button>
            <Button icon={<List size={16} />} onClick={handleOpenWaitlist}>
              Ver Waitlist
            </Button>
            <Button
              type="primary"
              icon={<Plus size={16} />}
              onClick={handleCreateRegistration}
            >
              Criar Registro
            </Button>
          </Space>
        )}
      </div>

      {loadingCaravan && (
        <div className="flex justify-center">
          <Spin size="large" />
        </div>
      )}

      {!loadingCaravan && selectedCaravan && (
        <div className="space-y-8">
          {selectedCaravan.busIds && selectedCaravan.busIds.length > 0 ? (
            selectedCaravan.busIds.map((busId) => (
              <BusDistributionCard
                key={busId}
                busId={busId}
                caravanId={selectedCaravan.id}
                caravanName={selectedCaravan.name}
                chapels={chapels}
                chapelMap={chapelMap}
                ordinanceIdToNameMap={ordinanceIdToNameMap}
              />
            ))
          ) : (
            <Card>
              <p className="text-gray-500">
                Esta viagem não tem autocarros atribuídos.
              </p>
            </Card>
          )}
        </div>
      )}

      {!loadingCaravan && !selectedCaravan && (
        <Card>
          <p className="text-gray-500">Viagem não encontrada.</p>
        </Card>
      )}

      <Drawer
        title="Criar Inscrição"
        open={createDrawerOpen}
        onClose={() => setCreateDrawerOpen(false)}
        size="large"
        destroyOnClose
      >
        {selectedCaravan && (
          <RegistrationForm
            mode="create"
            caravanId={selectedCaravan.id}
            onSuccess={handleCreateSuccess}
          />
        )}
      </Drawer>

      {caravanId && (
        <WaitlistDrawer
          open={waitlistDrawerOpen}
          onClose={handleCloseWaitlist}
          caravanId={caravanId}
          chapelMap={chapelMap}
        />
      )}
    </div>
  );
};

interface BusDistributionCardProps {
  busId: string;
  caravanId: string;
  caravanName: string;
  chapels: ChapelWithId[];
  chapelMap: Map<string, string>;
  ordinanceIdToNameMap: Map<string, string>;
}

const TABLE_LOCALE_PT = {
  filterConfirm: "OK",
  filterReset: "Limpar",
  filterEmptyText: "Sem filtros",
  filterCheckall: "Selecionar todos",
  triggerDesc: "Clique para ordenar descendente",
  triggerAsc: "Clique para ordenar ascendente",
  cancelSort: "Clique para cancelar ordenação",
  emptyText: "Nenhum passageiro registrado neste autocarro",
};

const BusDistributionCard = ({
  busId,
  caravanId,
  caravanName,
  chapels,
  chapelMap,
  ordinanceIdToNameMap,
}: BusDistributionCardProps) => {
  const { notification, modal } = App.useApp();
  const { bus, loading: loadingBus } = useBus(busId);
  const { registrations: activeRegistrations, loading: loadingRegistrations } =
    useActiveRegistrationsByBusId(busId, caravanId);

  const [chapelIdFilter, setChapelIdFilter] = useState<string | undefined>(undefined);
  const [sortField, setSortField] = useState<string | null>("fullName");
  const [sortOrder, setSortOrder] = useState<"ascend" | "descend" | null>("ascend");

  const filteredRegistrations = useMemo(() => {
    let list = activeRegistrations;
    if (chapelIdFilter?.trim()) {
      list = list.filter((r) => r.chapelId === chapelIdFilter);
    }
    return [...list];
  }, [activeRegistrations, chapelIdFilter]);

  const sortedRegistrationsForDisplay = useMemo(() => {
    const list = [...filteredRegistrations];
    if (!sortField || !sortOrder) {
      return list.sort((a, b) =>
        (a.fullName || "").localeCompare(b.fullName || "", "pt-PT")
      );
    }
    const mult = sortOrder === "ascend" ? 1 : -1;
    if (sortField === "fullName") {
      return list.sort(
        (a, b) =>
          mult *
          (a.fullName || "").localeCompare(b.fullName || "", "pt-PT")
      );
    }
    if (sortField === "chapelId") {
      return list.sort(
        (a, b) =>
          mult *
          (chapelMap.get(a.chapelId) || "").localeCompare(
            chapelMap.get(b.chapelId) || "",
            "pt-PT"
          )
      );
    }
    return list;
  }, [filteredRegistrations, sortField, sortOrder, chapelMap]);

  const { count } = useCountActiveByBus(caravanId, busId);
  const { count: cancelledCount } = useCountCancelledByBus(caravanId, busId);
  const { cancelRegistration, isPending: isCancelling } =
    useCancelRegistration();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRegistration, setSelectedRegistration] =
    useState<RegistrationWithId | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [cancelledDrawerOpen, setCancelledDrawerOpen] = useState(false);

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

  const handleCancelParticipation = (registration: RegistrationWithId) => {
    modal.confirm({
      title: "Cancelar Participação",
      content: `Tem certeza que deseja cancelar a participação de ${registration.fullName}? Esta ação liberará o lugar no autocarro.`,
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
          console.error("Error canceling registration:", error);
          const errorMessage =
            error instanceof Error ? error.message : "Erro desconhecido";
          notification.error({
            title: "Erro",
            description: `Não foi possível cancelar a participação: ${errorMessage}`,
          });
        }
      },
    });
  };

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);

      const jsPDF = (await import("jspdf")).default;

      const doc = new jsPDF();
      let yPosition = 20;

      doc.setFontSize(20);
      doc.text("Distribuição de Passageiros", 105, yPosition, {
        align: "center",
      });
      yPosition += 10;

      doc.setFontSize(14);
      doc.text(`Viagem: ${caravanName}`, 10, yPosition);
      yPosition += 8;

      if (bus?.name) {
        doc.text(`Autocarro: ${bus.name}`, 10, yPosition);
        yPosition += 8;
      }

      if (chapelIdFilter && chapelMap.get(chapelIdFilter)) {
        doc.text(`Capela: ${chapelMap.get(chapelIdFilter)}`, 10, yPosition);
        yPosition += 8;
      }

      const exportDate = new Date().toLocaleDateString("pt-PT", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      doc.setFontSize(10);
      doc.text(`Exportado em: ${exportDate}`, 10, yPosition);
      yPosition += 15;

      if (sortedRegistrationsForDisplay.length === 0) {
        doc.setFontSize(12);
        doc.text(
          chapelIdFilter
            ? "Nenhum passageiro desta capela neste autocarro."
            : "Nenhum passageiro registrado neste autocarro.",
          105,
          yPosition,
          {
            align: "center",
          }
        );
      } else {
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");

        const headers = [
          "Capela",
          "Nome Completo",
          "Ordenança 1",
          "Ordenança 2",
          "Ordenança 3",
        ];
        const colWidths = [40, 55, 35, 35, 35];
        const startX = 10;

        headers.forEach((header, i) => {
          const xPos =
            startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
          doc.text(header, xPos, yPosition);
        });

        yPosition += 7;
        doc.setLineWidth(0.5);
        doc.line(10, yPosition, 200, yPosition);
        yPosition += 5;

        doc.setFont("helvetica", "normal");

        sortedRegistrationsForDisplay.forEach((registration) => {
          if (yPosition > 280) {
            doc.addPage();
            yPosition = 20;
          }

          const ordinances = registration.ordinances || [];
          const chapelName = chapelMap.get(registration.chapelId) || registration.chapelId;

          const ordinanceLabels = [
            ordinances[0]
              ? `${ordinanceIdToNameMap.get(ordinances[0].ordinanceId) ||
              ordinances[0].ordinanceId
              } - ${ordinances[0].slot}`
              : "-",
            ordinances[1]
              ? `${ordinanceIdToNameMap.get(ordinances[1].ordinanceId) ||
              ordinances[1].ordinanceId
              } - ${ordinances[1].slot}`
              : "-",
            ordinances[2]
              ? `${ordinanceIdToNameMap.get(ordinances[2].ordinanceId) ||
              ordinances[2].ordinanceId
              } - ${ordinances[2].slot}`
              : "-",
          ];

          const rowData = [
            chapelName,
            registration.fullName || "N/A",
            ordinanceLabels[0],
            ordinanceLabels[1],
            ordinanceLabels[2],
          ];

          rowData.forEach((text, i) => {
            const xPos =
              startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
            doc.text(text || "", xPos, yPosition, {
              maxWidth: colWidths[i],
            });
          });

          yPosition += 7;
        });
      }

      const fileName = `distribuicao-${caravanName.replace(/\s+/g, "-")}-${bus?.name?.replace(/\s+/g, "-") || "autocarro"
        }-${new Date().toISOString().split("T")[0]}.pdf`;
      doc.save(fileName);

      notification.success({
        title: "Sucesso",
        description: "PDF exportado com sucesso",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      notification.error({
        title: "Erro",
        description:
          "Não foi possível exportar o PDF. Certifique-se de que jspdf está instalado.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const buildExportRows = useMemo(() => {
    return sortedRegistrationsForDisplay.map((registration) => {
      const ordinances = registration.ordinances || [];
      const chapelName = chapelMap.get(registration.chapelId) || registration.chapelId;
      const ordinanceLabels = [
        ordinances[0]
          ? `${ordinanceIdToNameMap.get(ordinances[0].ordinanceId) || ordinances[0].ordinanceId} - ${ordinances[0].slot}`
          : "-",
        ordinances[1]
          ? `${ordinanceIdToNameMap.get(ordinances[1].ordinanceId) || ordinances[1].ordinanceId} - ${ordinances[1].slot}`
          : "-",
        ordinances[2]
          ? `${ordinanceIdToNameMap.get(ordinances[2].ordinanceId) || ordinances[2].ordinanceId} - ${ordinances[2].slot}`
          : "-",
      ];
      return [
        chapelName,
        registration.fullName || "N/A",
        ordinanceLabels[0],
        ordinanceLabels[1],
        ordinanceLabels[2],
      ];
    });
  }, [sortedRegistrationsForDisplay, chapelMap, ordinanceIdToNameMap]);

  const handleExportExcel = async () => {
    try {
      setIsExportingExcel(true);
      const ExcelJS = await import("exceljs");
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Passageiros", { views: [{ state: "frozen", ySplit: 1 }] });

      const headers = ["Capela", "Nome Completo", "Ordenança 1", "Ordenança 2", "Ordenança 3"];
      sheet.addRow(headers);
      const headerRow = sheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
      };

      buildExportRows.forEach((row) => sheet.addRow(row));

      sheet.columns = [
        { width: 25 },
        { width: 30 },
        { width: 22 },
        { width: 22 },
        { width: 22 },
      ];

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const fileName = `distribuicao-${caravanName.replace(/\s+/g, "-")}-${bus?.name?.replace(/\s+/g, "-") || "autocarro"}-${new Date().toISOString().split("T")[0]}.xlsx`;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);

      notification.success({
        title: "Sucesso",
        description: "Excel exportado com sucesso",
      });
    } catch (error) {
      console.error("Error generating Excel:", error);
      notification.error({
        title: "Erro",
        description:
          "Não foi possível exportar o Excel. Certifique-se de que exceljs está instalado.",
      });
    } finally {
      setIsExportingExcel(false);
    }
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
      sorter: (a, b) => (a.fullName || "").localeCompare(b.fullName || "", "pt-PT"),
      sortOrder: sortField === "fullName" ? sortOrder : null,
      render: (_, record) => {
        const tags = [];

        // Tag "Criança" (1-10) o "Jovem" (11-17)
        if (record.ageCategory === "CHILD") {
          tags.push(
            <Tag key="crianca" color="cyan">
              Criança
            </Tag>
          );
        }
        if (record.ageCategory === "YOUTH") {
          tags.push(
            <Tag key="jovem" color="blue">
              Jovem
            </Tag>
          );
        }

        // Tag "Primeira vez" si es primera vez
        if (record.isFirstTimeConvert) {
          tags.push(
            <Tag key="primeira-vez" color="green">
              Primeira vez
            </Tag>
          );
        }

        // Tag "Ord. propia" si alguna ordenanza es personal
        if (
          record.ordinances &&
          Array.isArray(record.ordinances) &&
          record.ordinances.some((ord) => ord.isPersonal)
        ) {
          tags.push(
            <Tag key="ord-propria" color="purple">
              Ord. propia
            </Tag>
          );
        }

        // Tag "Oficiante" si es oficiante del templo
        if (record.isOfficiator) {
          tags.push(
            <Tag key="oficiante" color="orange">
              Oficiante
            </Tag>
          );
        }

        return (
          <div className="flex flex-col gap-1 w-40">
            <span className="text-sm font-semibold">{record.fullName}</span>
            {tags.length > 0 && <Space size={"middle"}>{tags}</Space>}
          </div>
        );
      },
    },
    {
      title: "Capela",
      dataIndex: "chapelId",
      key: "chapelId",
      sorter: (a, b) =>
        (chapelMap.get(a.chapelId) || "").localeCompare(
          chapelMap.get(b.chapelId) || "",
          "pt-PT"
        ),
      sortOrder: sortField === "chapelId" ? sortOrder : null,
      render: (_, record) => {
        const chapelName = chapelMap.get(record.chapelId);
        return chapelName || record.chapelId;
      },
    },
    /* {
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
    }, */
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
              const typeLabel =
                ordinanceIdToNameMap.get(ord.ordinanceId) || ord.ordinanceId;
              return `${typeLabel} - ${ord.slot}`;
            })
            .join(", ");
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
            type="default"
            onClick={() => handleEdit(record)}
          >
            Editar
          </Button>
          {record.participationStatus === "ACTIVE" && (
            <Button
              type="default"
              danger
              onClick={() => handleCancelParticipation(record)}
              loading={isCancelling}
            >
              Cancelar
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title={
          <div className="flex items-center justify-between">
            <span>{bus.name}</span>
            <Space>
              {cancelledCount > 0 && (
                <Button
                  type="default"
                  onClick={() => setCancelledDrawerOpen(true)}
                  size="small"
                >
                  Cancelados ({cancelledCount})
                </Button>
              )}
              <Button
                type="default"
                icon={<FilePdf size={16} />}
                onClick={handleExportPDF}
                loading={isExporting}
                size="small"
              >
                Exportar PDF
              </Button>
              <Button
                type="default"
                icon={<FileXls size={16} />}
                onClick={handleExportExcel}
                loading={isExportingExcel}
                size="small"
              >
                Exportar Excel
              </Button>
              <Tag color={isFull ? "red" : "green"}>
                {count}/{bus.capacity} lugares ({available} disponíveis)
              </Tag>
            </Space>
          </div>
        }
      >
        {chapels.length > 0 && (
          <div className="mb-4 flex items-center gap-2">
            <span className="text-gray-600">Filtrar por capela:</span>
            <Select
              placeholder="Todas as capelas"
              allowClear
              value={chapelIdFilter ?? ""}
              onChange={(v) => setChapelIdFilter(v === "" || v === undefined ? undefined : v)}
              options={[
                { value: "", label: "Todas as capelas" },
                ...chapels.map((c) => ({ value: c.id, label: c.name })),
              ]}
              className="min-w-[220px]"
            />
          </div>
        )}
        <Table
          columns={columns}
          dataSource={sortedRegistrationsForDisplay}
          rowKey="id"
          loading={loadingRegistrations}
          onChange={(_pagination, _filters, sorter) => {
            const s = Array.isArray(sorter) ? sorter[0] : sorter;
            const field = (s?.field ?? s?.column?.key) as string | undefined;
            const order = s?.order ?? null;
            if (field != null && (order === "ascend" || order === "descend")) {
              setSortField(field);
              setSortOrder(order);
            } else {
              setSortField(null);
              setSortOrder(null);
            }
          }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total: ${total} passageiros`,
          }}
          locale={{
            ...TABLE_LOCALE_PT,
            emptyText: chapelIdFilter
              ? "Nenhum passageiro desta capela neste autocarro"
              : TABLE_LOCALE_PT.emptyText,
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

      <Drawer
        title="Passageiros Cancelados"
        open={cancelledDrawerOpen}
        onClose={() => setCancelledDrawerOpen(false)}
        size="large"
        destroyOnClose
      >
        <CancelledRegistrationsList
          busId={busId}
          caravanId={caravanId}
          chapelMap={chapelMap}
        />
      </Drawer>
    </div>
  );
};
