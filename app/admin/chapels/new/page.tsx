"use client";

import { ChapelForm } from "@/features/chapels/components/ChapelForm";
import { Typography } from "antd";

const { Title } = Typography;

export default function NewChapelPage() {
  return (
    <div className="p-6">
      <Title level={2}>Criar Nova Capela</Title>

      <div className="mt-6">
        <ChapelForm mode="create" />
      </div>
    </div>
  );
}

