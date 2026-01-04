"use client";

import { useActiveCaravans } from "@/features/caravans/hooks/caravans.hooks";
import { Alert, Card, Spin } from "antd";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PublicRegistrationPage() {
  const router = useRouter();
  const { caravans, loading } = useActiveCaravans();

  useEffect(() => {
    if (!loading && caravans.length > 0) {
      router.replace(`/registration/${caravans[0].id}`);
    } else if (!loading && caravans.length === 0) {
      router.replace("/");
    }
  }, [loading, caravans, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <Alert
            message="Redirecionando..."
            description="A redirecionar para a página de inscrição."
            type="info"
            showIcon
          />
        </Card>
      </div>
    </div>
  );
}
