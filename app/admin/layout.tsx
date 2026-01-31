"use client";

import { AdminSidebar } from "@/common/components/AdminSidebar";
import { useSession } from "@/features/auth/hooks/auth.hooks";
import { Layout } from "antd";
import { Content } from "antd/es/layout/layout";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useSession();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Layout>
      <AdminSidebar />
      <Content>
        {children}
      </Content>
    </Layout>
  );
}
