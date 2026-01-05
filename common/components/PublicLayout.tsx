"use client";

import { PublicHeader } from "@/common/components/PublicHeader";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  const pathname = usePathname();

  // Determine if we should show the header (public routes only)
  const shouldShowHeader = pathname && !pathname.startsWith("/admin");

  return (
    <>
      {shouldShowHeader && <PublicHeader />}
      {children}
    </>
  );
}

