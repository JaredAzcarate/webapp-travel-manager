"use client";

import { formatEuroAmount, roundEuroAmount } from "@/common/utils/tripPrice.utils";
import { toDate } from "@/common/utils/timestamp.utils";
import type { ChapelFinanceRow } from "@/common/utils/caravanFinancial.utils";
import {
  useChapelTransfers,
  useCreateChapelTransfer,
  useDeleteChapelTransfer,
} from "@/features/finances/hooks/finances.hooks";
import {
  App,
  Button,
  DatePicker,
  Drawer,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Table,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs, { type Dayjs } from "dayjs";
import { Plus, Trash } from "phosphor-react";
import { useEffect, useMemo } from "react";

const { Text } = Typography;

interface TransferFormValues {
  amount: number;
  transferredAt: Dayjs;
  notes?: string;
}

interface ChapelTransferDrawerProps {
  open: boolean;
  onClose: () => void;
  caravanId: string;
  row: ChapelFinanceRow | null;
}

export function ChapelTransferDrawer({
  open,
  onClose,
  caravanId,
  row,
}: ChapelTransferDrawerProps) {
  const { notification } = App.useApp();
  const [form] = Form.useForm<TransferFormValues>();

  const chapelId = row?.chapelId ?? "";
  const { transfers, loading } = useChapelTransfers(caravanId, chapelId);
  const { createTransferAsync, isPending: isCreating } =
    useCreateChapelTransfer();
  const { deleteTransfer, isPending: isDeleting } = useDeleteChapelTransfer();

  const totalPaid = useMemo(
    () =>
      roundEuroAmount(
        transfers.reduce((sum, transfer) => sum + transfer.amount, 0)
      ),
    [transfers]
  );

  const balance = useMemo(() => {
    if (!row) return 0;
    return roundEuroAmount(row.totalDue - totalPaid);
  }, [row, totalPaid]);

  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldsValue({ transferredAt: dayjs() });
    }
  }, [open, form, row?.chapelId]);

  const handleSubmit = async (values: TransferFormValues) => {
    if (!row) return;

    try {
      await createTransferAsync({
        caravanId,
        chapelId: row.chapelId,
        amount: values.amount,
        transferredAt: values.transferredAt.toISOString(),
        ...(values.notes?.trim() ? { notes: values.notes.trim() } : {}),
      });
      notification.success({
        title: "Sucesso",
        description: "Transferência registada com sucesso",
      });
      form.resetFields();
      form.setFieldsValue({ transferredAt: dayjs() });
    } catch (error) {
      notification.error({
        title: "Erro",
        description:
          error instanceof Error
            ? error.message
            : "Não foi possível registar a transferência",
      });
    }
  };

  const columns: ColumnsType<(typeof transfers)[number]> = [
    {
      title: "Data",
      dataIndex: "transferredAt",
      key: "transferredAt",
      render: (value) => {
        const date = toDate(value);
        return date ? dayjs(date).format("DD/MM/YYYY") : "-";
      },
    },
    {
      title: "Montante",
      dataIndex: "amount",
      key: "amount",
      render: (value: number) => formatEuroAmount(value),
    },
    {
      title: "Notas",
      dataIndex: "notes",
      key: "notes",
      render: (value?: string) => value || "-",
    },
    {
      title: "Ações",
      key: "actions",
      width: 80,
      render: (_, record) => (
        <Popconfirm
          title="Eliminar transferência?"
          description="Esta ação não pode ser desfeita."
          okText="Eliminar"
          cancelText="Cancelar"
          onConfirm={() =>
            deleteTransfer({
              id: record.id,
              caravanId,
              chapelId: row!.chapelId,
            })
          }
        >
          <Button
            type="text"
            danger
            icon={<Trash size={16} />}
            loading={isDeleting}
          />
        </Popconfirm>
      ),
    },
  ];

  return (
    <Drawer
      title={row ? `Transferências — ${row.chapelName}` : "Transferências"}
      open={open}
      onClose={onClose}
      size={520}
      destroyOnHidden
    >
      {row && (
        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-3 gap-4 p-5 bg-gray-50 rounded-lg">
            <div className="flex flex-col gap-1">
              <Text type="secondary" className="text-xs">
                Total por pagar
              </Text>
              <Text strong className="text-base">
                {formatEuroAmount(row.totalDue)}
              </Text>
            </div>
            <div className="flex flex-col gap-1">
              <Text type="secondary" className="text-xs">
                Total pago
              </Text>
              <Text strong className="text-base">
                {formatEuroAmount(totalPaid)}
              </Text>
            </div>
            <div className="flex flex-col gap-1">
              <Text type="secondary" className="text-xs">
                Saldo
              </Text>
              <Text
                strong
                className={`text-base ${balance > 0 ? "text-orange-600" : "text-green-600"}`}
              >
                {formatEuroAmount(balance)}
              </Text>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <Text strong className="text-base">
              Registar transferência
            </Text>

            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              className="flex flex-col gap-2"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                <Form.Item
                  name="amount"
                  label="Montante (€)"
                  className="mb-2"
                  rules={[
                    { required: true, message: "Insira o montante" },
                    {
                      type: "number",
                      min: 0.01,
                      message: "O montante deve ser superior a zero",
                    },
                  ]}
                >
                  <InputNumber
                    min={0.01}
                    step={0.01}
                    precision={2}
                    className="w-full!"
                    suffix="€"
                  />
                </Form.Item>

                <Form.Item
                  name="transferredAt"
                  label="Data da transferência"
                  className="mb-2"
                  rules={[{ required: true, message: "Selecione a data" }]}
                >
                  <DatePicker
                    format="DD/MM/YYYY"
                    className="w-full"
                    placeholder="Selecione a data"
                  />
                </Form.Item>
              </div>

              <Form.Item name="notes" label="Notas (opcional)" className="mb-4">
                <Input.TextArea rows={3} placeholder="Observações..." />
              </Form.Item>

              <Button
                type="primary"
                htmlType="submit"
                icon={<Plus size={16} />}
                loading={isCreating}
                className="self-start"
              >
                Registar transferência
              </Button>
            </Form>
          </div>

          <div className="flex flex-col gap-4 border-t border-gray-200 pt-6">
            <Text strong className="text-base">
              Histórico de transferências
            </Text>
            <Table
              columns={columns}
              dataSource={transfers}
              rowKey="id"
              loading={loading}
              pagination={false}
              size="small"
              locale={{ emptyText: "Nenhuma transferência registada" }}
            />
          </div>
        </div>
      )}
    </Drawer>
  );
}
