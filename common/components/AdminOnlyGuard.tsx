"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";

/**
 * Redirects secretaries away from admin-only screens (config, managers, etc.).
 */
export function AdminOnlyGuard({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }
    if (session?.user?.role === "SECRETARY") {
      router.replace("/admin/caravans");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[40vh] p-6">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  if (session?.user?.role === "SECRETARY") {
    return null;
  }

  return <>{children}</>;
}
