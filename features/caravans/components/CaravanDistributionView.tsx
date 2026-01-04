"use client";

import { ORDINANCE_NAMES } from "@/common/constants/ordinances";
import { useBus } from "@/features/buses/hooks/buses.hooks";
import { useCaravan } from "@/features/caravans/hooks/caravans.hooks";
import { useChapels } from "@/features/chapels/hooks/chapels.hooks";
import { CancelledRegistrationsList } from "@/features/registrations/components/CancelledRegistrationsList";
import { RegistrationForm } from "@/features/registrations/components/RegistrationForm";
import {
  useActiveRegistrationsByBusId,
  useCancelRegistration,
  useCountActiveByBus,
  useCountCancelledByBus,
} from "@/features/registrations/hooks/registrations.hooks";
import {
  OrdinanceType,
  RegistrationWithId,
} from "@/features/registrations/models/registrations.model";
import {
  App,
  Button,
  Card,
  Drawer,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useSearchParams } from "next/navigation";
import { FilePdf, List, Pencil, Plus, XCircle } from "phosphor-react";
import { useMemo, useState } from "react";
import { WaitlistDrawer } from "./WaitlistDrawer";

const { Title } = Typography;

export const CaravanDistributionView = () => {
  const searchParams = useSearchParams();
  const caravanId = searchParams.get("caravanId");
  const { chapels, loading: loadingChapels } = useChapels();

  const ordinanceTypeToNameMap = useMemo(() => {
    const map = new Map<OrdinanceType, string>();
    Object.entries(ORDINANCE_NAMES).forEach(([type, name]) => {
      map.set(type as OrdinanceType, name);
    });
    return map;
  }, []);

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

  if (!caravanId) {
    return (
      <div className="space-y-4">
        <Title level={4}>Distribuição de Passageiros</Title>
        <Card>
          <p className="text-gray-500">
            Nenhuma caravana selecionada. Por favor, selecione uma caravana da
            lista.
          </p>
        </Card>
      </div>
    );
  }

  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [waitlistDrawerOpen, setWaitlistDrawerOpen] = useState(false);

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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Title level={4} style={{ margin: 0 }}>
          Distribuição de Passageiros
        </Title>
        {selectedCaravan && (
          <Space>
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
                chapelMap={chapelMap}
                loadingChapels={loadingChapels}
                ordinanceTypeToNameMap={ordinanceTypeToNameMap}
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
      )}

      {!loadingCaravan && !selectedCaravan && (
        <Card>
          <p className="text-gray-500">Caravana não encontrada.</p>
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
  chapelMap: Map<string, string>;
  loadingChapels: boolean;
  ordinanceTypeToNameMap: Map<OrdinanceType, string>;
}

const BusDistributionCard = ({
  busId,
  caravanId,
  caravanName,
  chapelMap,
  loadingChapels,
  ordinanceTypeToNameMap,
}: BusDistributionCardProps) => {
  const { notification, modal } = App.useApp();
  const { bus, loading: loadingBus } = useBus(busId);
  const { registrations: activeRegistrations, loading: loadingRegistrations } =
    useActiveRegistrationsByBusId(busId, caravanId);

  const { count } = useCountActiveByBus(caravanId, busId);
  const { count: cancelledCount } = useCountCancelledByBus(caravanId, busId);
  const { cancelRegistration, isPending: isCancelling } =
    useCancelRegistration();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRegistration, setSelectedRegistration] =
    useState<RegistrationWithId | null>(null);
  const [isExporting, setIsExporting] = useState(false);
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
      doc.text(`Caravana: ${caravanName}`, 10, yPosition);
      yPosition += 8;

      if (bus?.name) {
        doc.text(`Autocarro: ${bus.name}`, 10, yPosition);
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

      if (activeRegistrations.length === 0) {
        doc.setFontSize(12);
        doc.text(
          "Nenhum passageiro registrado neste autocarro.",
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
          "Nome Completo",
          "Ordenança 1",
          "Ordenança 2",
          "Ordenança 3",
        ];
        const colWidths = [60, 45, 45, 45];
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

        activeRegistrations.forEach((registration) => {
          if (yPosition > 280) {
            doc.addPage();
            yPosition = 20;
          }

          const ordinances = registration.ordinances || [];

          const ordinanceLabels = [
            ordinances[0]
              ? `${
                  ordinanceTypeToNameMap.get(ordinances[0].type) ||
                  ordinances[0].type
                } - ${ordinances[0].slot}`
              : "-",
            ordinances[1]
              ? `${
                  ordinanceTypeToNameMap.get(ordinances[1].type) ||
                  ordinances[1].type
                } - ${ordinances[1].slot}`
              : "-",
            ordinances[2]
              ? `${
                  ordinanceTypeToNameMap.get(ordinances[2].type) ||
                  ordinances[2].type
                } - ${ordinances[2].slot}`
              : "-",
          ];

          const rowData = [
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

      const fileName = `distribuicao-${caravanName.replace(/\s+/g, "-")}-${
        bus?.name?.replace(/\s+/g, "-") || "autocarro"
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
      render: (_, record) => {
        const tags = [];

        // Tag "Jovem" si es menor de edad
        if (!record.isAdult) {
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

        return (
          <div className="flex items-center gap-2">
            <span>{record.fullName}</span>
            {tags.length > 0 && <Space size={4}>{tags}</Space>}
          </div>
        );
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
        if (
          record.ordinances &&
          Array.isArray(record.ordinances) &&
          record.ordinances.length > 0
        ) {
          return record.ordinances
            .map((ord) => {
              const typeLabel =
                ordinanceTypeToNameMap.get(ord.type) || ord.type;
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
            type="link"
            icon={<Pencil size={16} />}
            onClick={() => handleEdit(record)}
          >
            Editar
          </Button>
          {record.participationStatus === "ACTIVE" && (
            <Button
              type="link"
              danger
              icon={<XCircle size={16} />}
              onClick={() => handleCancelParticipation(record)}
              loading={isCancelling}
            >
              Cancelar Participação
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
              <Tag color={isFull ? "red" : "green"}>
                {count}/{bus.capacity} lugares ({available} disponíveis)
              </Tag>
            </Space>
          </div>
        }
      >
        <Table
          columns={columns}
          dataSource={activeRegistrations}
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
