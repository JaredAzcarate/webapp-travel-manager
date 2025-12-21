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
import { useMemo, useState } from "react";

const { Title } = Typography;

const ORDINANCE_TYPE_MAP: Record<OrdinanceType, string> = {
  BAPTISTRY: "Batistério",
  INITIATORY: "Iniciatória",
  ENDOWMENT: "Investidura",
  SEALING: "Selamento",
};

export const CaravanDistributionView = () => {
  const searchParams = useSearchParams();
  const caravanId = searchParams.get("caravanId");
  const { chapels, loading: loadingChapels } = useChapels();

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

  return (
    <div className="space-y-4">
      <Title level={4}>Distribuição de Passageiros</Title>

      {loadingCaravan && (
        <div className="flex justify-center">
          <Spin size="large" />
        </div>
      )}

      {!loadingCaravan && selectedCaravan && (
        <div className="space-y-4">
          {selectedCaravan.busIds && selectedCaravan.busIds.length > 0 ? (
            selectedCaravan.busIds.map((busId) => (
              <BusDistributionCard
                key={busId}
                busId={busId}
                caravanId={selectedCaravan.id}
                caravanName={selectedCaravan.name}
                chapelMap={chapelMap}
                loadingChapels={loadingChapels}
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
    </div>
  );
};

interface BusDistributionCardProps {
  busId: string;
  caravanId: string;
  caravanName: string;
  chapelMap: Map<string, string>;
  loadingChapels: boolean;
}

const BusDistributionCard = ({
  busId,
  caravanId,
  caravanName,
  chapelMap,
  loadingChapels,
}: BusDistributionCardProps) => {
  const { notification } = App.useApp();
  const { bus, loading: loadingBus } = useBus(busId);
  const { registrations, loading: loadingRegistrations } =
    useRegistrationsByBusId(busId, caravanId);

  const { count } = useCountActiveByBus(caravanId, busId);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRegistration, setSelectedRegistration] =
    useState<RegistrationWithId | null>(null);
  const [isExporting, setIsExporting] = useState(false);

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

      if (registrations.length === 0) {
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
          "Capela",
          "Status de Pagamento",
          "Ordenança",
        ];
        const colWidths = [60, 50, 40, 50];
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

        registrations.forEach((registration) => {
          if (yPosition > 280) {
            doc.addPage();
            yPosition = 20;
          }

          const chapelName =
            chapelMap.get(registration.chapelId) || registration.chapelId;

          const statusMap: Record<string, string> = {
            PENDING: "Pendente",
            PAID: "Pago",
            FREE: "Grátis",
            CANCELLED: "Cancelado",
          };

          const statusLabel =
            statusMap[registration.paymentStatus] || registration.paymentStatus;

          const ordinanceTypeLabel =
            ORDINANCE_TYPE_MAP[registration.ordinanceType] ||
            registration.ordinanceType;
          const ordinanceLabel = `${ordinanceTypeLabel} - ${registration.ordinanceSlot}`;

          const rowData = [
            registration.fullName || "N/A",
            chapelName,
            statusLabel,
            ordinanceLabel,
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
            <Space>
              <Button
                type="default"
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
