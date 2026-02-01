"use client";

import { useCaravan } from "@/features/caravans/hooks/caravans.hooks";
import { useChapels } from "@/features/chapels/hooks/chapels.hooks";
import {
  useFilteredRegistrations,
  useUpdateRegistration,
} from "@/features/registrations/hooks/registrations.hooks";
import {
  PaymentStatus,
  RegistrationWithId,
} from "@/features/registrations/models/registrations.model";
import {
  App,
  Button,
  Drawer,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { Timestamp } from "firebase/firestore";
import { FilePdf, Receipt } from "phosphor-react";
import { useMemo, useState } from "react";

const { Title } = Typography;

interface PaymentStatusDrawerProps {
  open: boolean;
  onClose: () => void;
  caravanId: string;
}

export const PaymentStatusDrawer = ({
  open,
  onClose,
  caravanId,
}: PaymentStatusDrawerProps) => {
  const { notification } = App.useApp();
  const { chapels } = useChapels();
  const { updateRegistration, isPending: isUpdating } = useUpdateRegistration();
  const { caravan } = useCaravan(caravanId);

  const [filterChapelId, setFilterChapelId] = useState<string | undefined>();
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<
    PaymentStatus | undefined
  >();
  const [isExporting, setIsExporting] = useState(false);

  const { registrations: filteredRegistrations, loading } =
    useFilteredRegistrations(caravanId, {
      chapelId: filterChapelId,
      paymentStatus: filterPaymentStatus,
    });

  const chapelMap = useMemo(() => {
    const map = new Map<string, string>();
    chapels.forEach((chapel) => {
      map.set(chapel.id, chapel.name);
    });
    return map;
  }, [chapels]);

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);

      const jsPDF = (await import("jspdf")).default;

      const doc = new jsPDF();
      let yPosition = 20;

      doc.setFontSize(20);
      doc.text("Status de Pagamentos", 105, yPosition, { align: "center" });
      yPosition += 10;

      if (caravan?.name) {
        doc.setFontSize(14);
        doc.text(`Viagem: ${caravan.name}`, 10, yPosition);
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

      if (filteredRegistrations.length === 0) {
        doc.setFontSize(12);
        doc.text("Nenhum registro encontrado.", 105, yPosition, {
          align: "center",
        });
      } else {
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");

        const headers = ["Nome", "Telefone", "Capela", "Status"];
        const colWidths = [60, 40, 50, 40];
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

        filteredRegistrations.forEach((registration) => {
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

          const rowData = [
            registration.fullName || "N/A",
            registration.phone || "N/A",
            chapelName,
            statusLabel,
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

      const fileName = `status-pagamentos-${caravan?.name || caravanId}-${new Date().toISOString().split("T")[0]
        }.pdf`;
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

  const handleMarkAsPaid = (registration: RegistrationWithId) => {
    updateRegistration(registration.id, {
      paymentStatus: "PAID",
      paymentConfirmedAt: Timestamp.now(),
    });
    notification.success({
      title: "Sucesso",
      description: `O pagamento de ${registration.fullName} foi marcado como pago`,
    });
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
      title: "Ação",
      key: "action",
      render: (_, record) => {
        if (record.paymentStatus === "PENDING") {
          return (
            <Button
              type="primary"
              size="small"
              onClick={() => handleMarkAsPaid(record)}
              loading={isUpdating}
            >
              Marcar como Pagado
            </Button>
          );
        }
        return null;
      },
    },
  ];

  return (
    <Drawer
      title={
        <span className="flex items-center gap-2">
          <Receipt size={20} />
          Status de Pagos
        </span>
      }
      open={open}
      onClose={onClose}
      size="large"
      destroyOnClose
    >
      {loading ? (
        <div className="flex justify-center py-8">
          <Spin size="large" />
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-4">
            <Space wrap>
              <Select
                placeholder="Filtrar por Capela"
                allowClear
                style={{ width: 200 }}
                value={filterChapelId}
                onChange={setFilterChapelId}
                options={chapels.map((chapel) => ({
                  label: chapel.name,
                  value: chapel.id,
                }))}
              />
              <Select
                placeholder="Filtrar por Status"
                allowClear
                style={{ width: 200 }}
                value={filterPaymentStatus}
                onChange={setFilterPaymentStatus}
                options={[
                  { label: "Pendente", value: "PENDING" },
                  { label: "Pago", value: "PAID" },
                  { label: "Grátis", value: "FREE" },
                  { label: "Cancelado", value: "CANCELLED" },
                ]}
              />
              <Button
                type="primary"
                icon={<FilePdf size={16} />}
                onClick={handleExportPDF}
                loading={isExporting}
              >
                Exportar PDF
              </Button>
            </Space>
          </div>
          <Table
            columns={columns}
            dataSource={filteredRegistrations}
            rowKey="id"
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total) => `Total: ${total} registros`,
            }}
            locale={{
              emptyText: "Nenhum registro encontrado para esta viagem",
            }}
          />
        </>
      )}
    </Drawer>
  );
};
