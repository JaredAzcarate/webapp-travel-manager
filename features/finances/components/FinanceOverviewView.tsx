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
      title: "Saldo pendente",
      dataIndex: "openBalance",
      key: "openBalance",
      align: "right",
      render: (value: number) => (
        <Text className={value > 0 ? "text-orange-600 font-medium" : "text-green-600"}>
          {formatEuroAmount(value)}
        </Text>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Text type="secondary">
        Saldo acumulado por ala em viagens com finanças em seguimento. Clique numa
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
                        const params = new URLSearchParams(searchParams.toString());
                        params.set("caravanId", caravan.caravanId);
                        params.delete("view");
                        router.push(`/admin/finances?${params.toString()}`);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Text>{caravan.caravanName}</Text>
                        <Tag color="blue">Em seguimento</Tag>
                      </div>
                      <Text
                        className={
                          caravan.balance > 0 ? "text-orange-600" : "text-green-600"
                        }
                      >
                        {formatEuroAmount(caravan.balance)}
                      </Text>
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
