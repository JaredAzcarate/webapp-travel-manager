"use client";

import { Button, Layout } from "antd";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

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
    <header className="bg-white sticky top-0 z-50 border-b border-gray-200" >
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between p-4">
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
                ? "text-primary font-medium"
                : "text-gray-700 hover:text-primary"
            }`}
          >
            Caravanas
          </Link>
          <Link
            href="/confirm-payment"
            className={`no-underline transition-colors ${
              isActive("/confirm-payment")
                ? "text-primary font-medium"
                : "text-gray-700 hover:text-primary"
            }`}
          >
            Informar pago
          </Link>
        </nav>

        {/* Login Button */}
        <Button
          type="primary"
          onClick={() => router.push("/auth/login")}
          className="bg-primary hover:bg-primary-dark border-none"
        >
          Login
        </Button>
      </div>
    </header>
  );
}

