"use client";

import { formatEuroAmount } from "@/common/utils/tripPrice.utils";
import { useFinanceOverview } from "@/features/finances/hooks/finances.hooks";
import { Spin, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useRouter, useSearchParams } from "next/navigation";

const { Text } = Typography;

export function FinanceOverviewView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { overview, loading } = useFinanceOverview();

  const columns: ColumnsType<(typeof overview)[number]> = [
    {
      title: "Ala",
      dataIndex: "chapelName",
      key: "chapelName",
    },
    {
      title: "Saldo a favor",
      dataIndex: "creditBalance",
      key: "creditBalance",
      align: "right",
      width: 140,
      render: (value: number) => (
        <Text
          className={value > 0 ? "text-green-600 font-medium" : "text-gray-500"}
        >
          {formatEuroAmount(value)}
        </Text>
      ),
    },
    {
      title: "Saldo pendente",
      dataIndex: "pendingBalance",
      key: "pendingBalance",
      align: "right",
      width: 140,
      render: (value: number) => (
        <Text
          className={
            value > 0 ? "text-orange-600 font-medium" : "text-gray-500"
          }
        >
          {formatEuroAmount(value)}
        </Text>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Text type="secondary">
        Saldo acumulado por ala em viagens com finanças em seguimento. O saldo a
        favor é a caixa da unidade e pode usar-se em qualquer viagem. Clique numa
        viagem para ver o detalhe.
      </Text>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spin size="large" />
        </div>
      ) : (
        <Table
          columns={columns}
          dataSource={overview}
          rowKey="chapelId"
          pagination={false}
          expandable={{
            expandedRowRender: (record) => (
              <div className="flex flex-col gap-2 py-1">
                {record.caravans.length === 0 ? (
                  <Text type="secondary">Sem viagens em seguimento</Text>
                ) : (
                  record.caravans.map((caravan) => (
                    <div
                      key={caravan.caravanId}
                      className="flex items-center justify-between gap-4 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
                      onClick={() => {
                        const params = new URLSearchParams(
                          searchParams.toString()
                        );
                        params.set("caravanId", caravan.caravanId);
                        params.delete("view");
                        router.push(`/admin/finances?${params.toString()}`);
                      }}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Text className="truncate">{caravan.caravanName}</Text>
                        <Tag color="blue">Em seguimento</Tag>
                      </div>
                      <div className="flex items-center gap-6 shrink-0">
                        <div className="flex flex-col items-end w-[120px]">
                          <Text type="secondary" className="text-xs">
                            Pendente
                          </Text>
                          <Text
                            className={
                              caravan.pendingBalance > 0
                                ? "text-orange-600"
                                : "text-gray-500"
                            }
                          >
                            {formatEuroAmount(caravan.pendingBalance)}
                          </Text>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ),
          }}
          locale={{ emptyText: "Nenhuma ala encontrada" }}
        />
      )}
    </div>
  );
}
