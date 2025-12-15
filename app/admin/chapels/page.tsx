"use client";

import { ChapelsList } from "@/features/chapels/components/ChapelsList";
import { Typography } from "antd";

const { Title } = Typography;

export default function ChapelsPage() {
  return (
    <div className="p-6">
      <Title level={2}>Gestão de Capelas</Title>

      <div className="mt-8">
        <ChapelsList />
      </div>
    </div>
  );
}
