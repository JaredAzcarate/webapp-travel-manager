"use client";

import { Button, Layout } from "antd";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";

const { Header } = Layout;

export function PublicHeader() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname?.startsWith(path);
  };

  return (
    <Header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between px-4">
        {/* Logo/Title */}
        <Link href="/" className="text-xl font-bold text-gray-900 no-underline">
          Agendamentos do Templo
        </Link>

        {/* Navigation - Desktop */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className={`no-underline transition-colors ${
              isActive("/")
                ? "text-[#007da5] font-medium"
                : "text-gray-700 hover:text-[#007da5]"
            }`}
          >
            Caravanas
          </Link>
          <Link
            href="/confirm-payment"
            className={`no-underline transition-colors ${
              isActive("/confirm-payment")
                ? "text-[#007da5] font-medium"
                : "text-gray-700 hover:text-[#007da5]"
            }`}
          >
            Informar pago
          </Link>
        </nav>

        {/* Login Button */}
        <Button
          type="primary"
          onClick={() => router.push("/auth/login")}
          className="bg-[#007da5] hover:bg-[#006a8a] border-none"
        >
          Login
        </Button>
      </div>
    </Header>
  );
}

