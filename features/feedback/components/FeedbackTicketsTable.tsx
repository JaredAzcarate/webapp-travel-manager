"use client";

import { isDevelopment } from "@/common/utils/env.utils";
import { toDate } from "@/common/utils/timestamp.utils";
import type {
  FeedbackTicketStatus,
  FeedbackTicketWithId,
} from "@/features/feedback/models/feedbackTickets.model";
import {
  useDeleteFeedbackTicket,
  useFeedbackTicketsList,
  useUpdateFeedbackTicket,
} from "@/features/feedback/hooks/feedbackTickets.hooks";
import { App, Button, Input, Select, Space, Table, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { useMemo, useState } from "react";

const { Paragraph } = Typography;

export function FeedbackTicketsTable() {
  const { notification, modal } = App.useApp();
  const { data: tickets = [], isLoading, error, refetch } = useFeedbackTicketsList();
  const { mutateAsync: updateTicket, isPending: updating } =
    useUpdateFeedbackTicket();
  const { mutateAsync: deleteTicket, isPending: deleting } =
    useDeleteFeedbackTicket();
  const showDevActions = isDevelopment();
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});

  const handleDeleteTicket = (row: FeedbackTicketWithId) => {
    modal.confirm({
      title: "Eliminar feedback (dev)",
      content:
        "Eliminar permanentemente este feedback? Esta ação não pode ser desfeita.",
      okText: "Sim, eliminar",
      okType: "danger",
      cancelText: "Não",
      onOk: async () => {
        try {
          await deleteTicket(row.id);
          notification.success({ title: "Feedback eliminado" });
        } catch (e) {
          notification.error({
            title: "Erro",
            description: e instanceof Error ? e.message : "Falha ao eliminar",
          });
        }
      },
    });
  };

  const columns = useMemo(
    () => [
      {
        title: "Data",
        key: "createdAt",
        width: 160,
        render: (_: unknown, row: FeedbackTicketWithId) => {
          const d = toDate(row.createdAt as Parameters<typeof toDate>[0]);
          return d ? dayjs(d).format("DD/MM/YYYY HH:mm") : "—";
        },
      },
      {
        title: "Tipo",
        dataIndex: "type",
        width: 120,
        render: (t: string) =>
          t === "ERROR" ? (
            <Tag color="red">Erro</Tag>
          ) : (
            <Tag color="blue">Sugestão</Tag>
          ),
      },
      {
        title: "Estado",
        key: "status",
        width: 130,
        render: (_: unknown, row: FeedbackTicketWithId) => (
          <Select
            value={row.status}
            style={{ width: 120 }}
            disabled={updating}
            options={[
              { value: "OPEN", label: "Aberto" },
              { value: "ARCHIVED", label: "Arquivado" },
            ]}
            onChange={async (value: "OPEN" | "ARCHIVED") => {
              try {
                await updateTicket({ id: row.id, status: value });
                notification.success({ title: "Estado atualizado" });
              } catch (e) {
                notification.error({
                  title: "Erro",
                  description: e instanceof Error ? e.message : "Falha",
                });
              }
            }}
          />
        ),
      },
      {
        title: "Mensagem",
        dataIndex: "message",
        render: (text: string) => (
          <Paragraph className="!mb-0 whitespace-pre-wrap max-w-md">
            {text}
          </Paragraph>
        ),
      },
      {
        title: "Página",
        dataIndex: "pageUrl",
        width: 200,
        ellipsis: true,
        render: (url: string | undefined) =>
          url ? (
            <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary">
              {url}
            </a>
          ) : (
            "—"
          ),
      },
      {
        title: "Notas (interno)",
        key: "notes",
        width: 280,
        render: (_: unknown, row: FeedbackTicketWithId) => (
          <Space.Compact className="w-full">
            <Input.TextArea
              rows={2}
              placeholder="Notas para a equipa…"
              value={notesDraft[row.id] ?? row.notes ?? ""}
              onChange={(e) =>
                setNotesDraft((prev) => ({ ...prev, [row.id]: e.target.value }))
              }
            />
            <Button
              type="primary"
              loading={updating}
              onClick={async () => {
                try {
                  await updateTicket({
                    id: row.id,
                    notes: notesDraft[row.id] ?? row.notes ?? "",
                  });
                  notification.success({ title: "Notas guardadas" });
                } catch (e) {
                  notification.error({
                    title: "Erro",
                    description: e instanceof Error ? e.message : "Falha",
                  });
                }
              }}
            >
              Guardar
            </Button>
          </Space.Compact>
        ),
      },
      ...(showDevActions
        ? [
            {
              title: "Ações",
              key: "actions",
              width: 120,
              render: (_: unknown, row: FeedbackTicketWithId) => (
                <Button
                  danger
                  loading={deleting}
                  onClick={() => handleDeleteTicket(row)}
                >
                  Eliminar
                </Button>
              ),
            },
          ]
        : []),
    ],
    [notesDraft, notification, updateTicket, updating, showDevActions, deleting]
  );

  if (error) {
    return (
      <div className="text-red-600">
        {error instanceof Error ? error.message : "Erro ao carregar"}
        <Button className="ml-2" onClick={() => refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <Table<FeedbackTicketWithId>
      rowKey="id"
      loading={isLoading}
      dataSource={tickets}
      columns={columns}
      scroll={{ x: 1100 }}
      pagination={{ pageSize: 20 }}
    />
  );
}
