"use client";

import { AppFooter } from "@/common/components/AppFooter";
import { PublicHeader } from "@/common/components/PublicHeader";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  const pathname = usePathname();

  // Public routes only (no header/footer on admin dashboard)
  const isPublicRoute = pathname && !pathname.startsWith("/admin");

  return (
    <div className="min-h-screen flex flex-col">
      {isPublicRoute && <PublicHeader />}
      <div className="flex-1 p-4 md:p-0">
        {children}
      </div>
      {isPublicRoute && <AppFooter />}
    </div>
  );
}

