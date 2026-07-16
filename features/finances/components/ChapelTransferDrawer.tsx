"use client";

import {
  canDeleteChapelTransfer,
  pendingFromBalance,
  type ChapelFinanceRow,
} from "@/common/utils/caravanFinancial.utils";
import { toDate } from "@/common/utils/timestamp.utils";
import { formatEuroAmount, roundEuroAmount } from "@/common/utils/tripPrice.utils";
import {
  useChapelTransfers,
  useCreateChapelTransfer,
  useDeleteChapelTransfer,
  useFinanceOverview,
} from "@/features/finances/hooks/finances.hooks";
import {
  Alert,
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
import { useEffect, useMemo, useState } from "react";

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
  const [creditSuggestionDismissed, setCreditSuggestionDismissed] =
    useState(false);
  const [creditAppliedAmount, setCreditAppliedAmount] = useState(0);

  const chapelId = row?.chapelId ?? "";
  const { transfers, loading } = useChapelTransfers(caravanId, chapelId);
  const { overview } = useFinanceOverview();
  const { createTransferAsync, isPending: isCreating } =
    useCreateChapelTransfer();
  const { deleteTransferAsync, isPending: isDeleting } =
    useDeleteChapelTransfer();

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

  const pendingBalance = pendingFromBalance(balance);

  const chapelCreditBalance = useMemo(() => {
    if (!row) return 0;
    const chapelOverview = overview.find((item) => item.chapelId === row.chapelId);
    return roundEuroAmount(Math.max(chapelOverview?.creditBalance ?? 0, 0));
  }, [overview, row]);

  const displayedCreditBalance = useMemo(
    () =>
      roundEuroAmount(Math.max(chapelCreditBalance - creditAppliedAmount, 0)),
    [chapelCreditBalance, creditAppliedAmount]
  );

  const suggestedAmount = useMemo(() => {
    if (pendingBalance <= 0 || chapelCreditBalance <= 0) return 0;
    return roundEuroAmount(Math.min(pendingBalance, chapelCreditBalance));
  }, [pendingBalance, chapelCreditBalance]);

  const showCreditSuggestion =
    suggestedAmount > 0 && !creditSuggestionDismissed;

  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldsValue({ transferredAt: dayjs() });
      setCreditSuggestionDismissed(false);
      setCreditAppliedAmount(0);
    }
  }, [open, form, row?.chapelId]);

  const handleUseCreditSuggestion = () => {
    form.setFieldsValue({ amount: suggestedAmount });
    setCreditAppliedAmount(suggestedAmount);
    setCreditSuggestionDismissed(true);
  };

  const handleSubmit = async (values: TransferFormValues) => {
    if (!row) return;

    const creditToApply =
      creditAppliedAmount > 0
        ? roundEuroAmount(Math.min(values.amount, creditAppliedAmount))
        : 0;

    try {
      await createTransferAsync({
        caravanId,
        chapelId: row.chapelId,
        amount: values.amount,
        transferredAt: values.transferredAt.toISOString(),
        ...(values.notes?.trim() ? { notes: values.notes.trim() } : {}),
        ...(creditToApply > 0 ? { applyCreditAmount: creditToApply } : {}),
      });
      notification.success({
        title: "Sucesso",
        description: "Transferência registada com sucesso",
      });
      form.resetFields();
      form.setFieldsValue({ transferredAt: dayjs() });
      setCreditAppliedAmount(0);
      setCreditSuggestionDismissed(false);
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
      render: (_, record) => {
        if (!canDeleteChapelTransfer(record)) {
          return (
            <Text type="secondary" className="text-xs">
              Em uso
            </Text>
          );
        }

        return (
          <Popconfirm
            title="Eliminar transferência?"
            description="Se este pagamento gerou saldo a favor já utilizado noutra viagem, a eliminação será bloqueada."
            okText="Eliminar"
            cancelText="Cancelar"
            onConfirm={async () => {
              try {
                await deleteTransferAsync({
                  id: record.id,
                  caravanId,
                  chapelId: row!.chapelId,
                });
              } catch (error) {
                notification.error({
                  title: "Não foi possível eliminar",
                  description:
                    error instanceof Error
                      ? error.message
                      : "Erro ao eliminar transferência",
                });
              }
            }}
          >
            <Button
              type="text"
              danger
              icon={<Trash size={16} />}
              loading={isDeleting}
            />
          </Popconfirm>
        );
      },
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
          <div className="grid grid-cols-2 gap-4 p-5 bg-gray-50 rounded-lg">
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
                className={`text-base ${
                  pendingBalance > 0 ? "text-orange-600" : "text-gray-500"
                }`}
              >
                {formatEuroAmount(pendingBalance)}
              </Text>
            </div>
            <div className="flex flex-col gap-1">
              <Text type="secondary" className="text-xs">
                Saldo a favor
              </Text>
              <Text
                strong
                className={`text-base ${
                  displayedCreditBalance > 0
                    ? "text-green-600"
                    : "text-gray-500"
                }`}
              >
                {formatEuroAmount(displayedCreditBalance)}
              </Text>
              {creditAppliedAmount > 0 && (
                <Text type="secondary" className="text-xs">
                  A usar {formatEuroAmount(creditAppliedAmount)} do saldo a
                  favor
                </Text>
              )}
            </div>
          </div>

          {showCreditSuggestion && (
            <Alert
              type="info"
              showIcon
              title="Saldo a favor disponível"
              description={
                <div className="flex flex-col gap-3">
                  <Text>
                    A unidade tem {formatEuroAmount(chapelCreditBalance)} a
                    favor. Queres usar {formatEuroAmount(suggestedAmount)} desse
                    saldo para saldar o pendente desta viagem?
                  </Text>
                  <Button
                    type="primary"
                    size="small"
                    className="self-start"
                    onClick={handleUseCreditSuggestion}
                  >
                    Sim, preencher o montante
                  </Button>
                </div>
              }
            />
          )}

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
