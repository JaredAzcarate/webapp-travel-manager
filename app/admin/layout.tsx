"use client";

import { AdminSidebar } from "@/common/components/AdminSidebar";
import { useSession } from "@/features/auth/hooks/auth.hooks";
import { Layout } from "antd";
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
      router.push("/login");
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
    <Layout style={{ minHeight: "100vh" }}>
      <AdminSidebar />
      <Layout style={{ marginLeft: 200 }}>
        <Layout.Content
          style={{ margin: "24px 16px", padding: 24, minHeight: 280 }}
        >
          {children}
        </Layout.Content>
      </Layout>
    </Layout>
  );
}
