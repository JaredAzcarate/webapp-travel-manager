"use client";

import { AdminOnlyGuard } from "@/common/components/AdminOnlyGuard";
import { CaravanFinanceView } from "@/features/finances/components/CaravanFinanceView";
import { FinanceOverviewView } from "@/features/finances/components/FinanceOverviewView";
import { Segmented, Typography } from "antd";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

const { Title } = Typography;

function FinancesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = searchParams.get("view") === "overview" ? "overview" : "caravan";

  const handleViewChange = (value: string | number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "overview") {
      params.set("view", "overview");
    } else {
      params.delete("view");
    }
    router.push(`/admin/finances?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Title level={2} className="text-xl sm:text-2xl mb-0!">
          Finanças
        </Title>
        <Segmented
          value={view}
          onChange={handleViewChange}
          className="[&_.ant-segmented-item-selected]:bg-primary! [&_.ant-segmented-item-selected]:text-white!"
          options={[
            { label: "Por viagem", value: "caravan" },
            { label: "Visão geral", value: "overview" },
          ]}
        />
      </div>

      {view === "overview" ? <FinanceOverviewView /> : <CaravanFinanceView />}
    </div>
  );
}

export default function FinancesPage() {
  return (
    <AdminOnlyGuard>
      <div className="p-4 sm:p-6">
        <Suspense fallback={<div>Carregando...</div>}>
          <FinancesContent />
        </Suspense>
      </div>
    </AdminOnlyGuard>
  );
}
