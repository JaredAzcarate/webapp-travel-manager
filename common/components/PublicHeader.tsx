"use client";

import { useSession, useSignOut } from "@/features/auth/hooks/auth.hooks";
import { Button, Drawer } from "antd";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { List, X } from "phosphor-react";
import { useState } from "react";

export function PublicHeader() {
  const pathname = usePathname();
  const { isAuthenticated } = useSession();
  const { signOut } = useSignOut();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname?.startsWith(path);
  };

  const handleCloseMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-white sticky top-0 z-50 border-b border-gray-200 p-4" >
      <div className="max-w-5xl mx-auto h-full flex items-center justify-between">

        {/* Logo/Title */}
        <div className="flex items-center gap-3">
        <div className="bg-primary/10 p-1.5 rounded-md">
          <svg
                className="w-7 h-7"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M19.75 15v5.75h-5.409v-3.637A2.343 2.343 0 0 0 12 14.772a2.343 2.343 0 0 0-2.341 2.341v3.637H4.25V15h-.056l6.223-3.007c.208-.1.358-.29.407-.516L12 6.045l1.176 5.432a.748.748 0 0 0 .407.516L19.806 15h-.056zm-5.185-4.198l-1.832-8.461c-.171-.788-1.295-.788-1.466 0l-1.832 8.461-7.761 3.75a.75.75 0 1 0 .652 1.351l.424-.205V21.5c0 .414.336.75.75.75h17a.75.75 0 0 0 .75-.75v-5.802l.424.205a.75.75 0 1 0 .652-1.351l-7.761-3.75z"></path>
              </svg>
        </div>
        <div className="flex flex-col">
        <p className="text-base font-semibold">Viagens ao Templo</p>
        <p className="text-xs text-gray-500">Estaca Porto Norte</p>

        </div>
        </div>

        {/* Desktop Navigation and Auth - Hidden on mobile */}
        <div className="hidden md:flex items-center gap-6">
          {/* Navigation - Desktop */}
          <nav className="flex items-center gap-6">
            <Link
              href="/"
              className={`no-underline transition-colors ${
                isActive("/")
                  ? "text-primary font-medium"
                  : "text-gray-700 hover:text-primary"
              }`}
            >
              Lista de caravanas
            </Link>
            <Link
              href="/confirm-payment"
              className={`no-underline transition-colors ${
                isActive("/confirm-payment")
                  ? "text-primary font-medium"
                  : "text-gray-700 hover:text-primary"
              }`}
            >
              Verificar inscrição
            </Link>
          </nav>

          {/* Auth Buttons - Desktop */}
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Button
                type="primary"
                href="/admin/caravans"
                className="bg-primary hover:bg-primary-dark border-none"
              >
                Painel de administração
              </Button>
              <Button
                onClick={signOut}
                className="border-gray-300"
              >
                Logout
              </Button>
            </div>
          ) : (
            <Button
              type="primary"
              href="/auth/login"
              className="bg-primary hover:bg-primary-dark border-none"
            >
              Login
            </Button>
          )}
        </div>

        {/* Mobile Menu Button - Only visible on mobile */}
        <div className="flex md:hidden">
          <Button
            type="text"
            icon={<List size={24} />}
            onClick={() => setMobileMenuOpen(true)}
          />
        </div>

        {/* Mobile Menu Drawer */}
        <Drawer
          title="Menu"
          placement="right"
          onClose={handleCloseMobileMenu}
          open={mobileMenuOpen}
          closeIcon={<X size={20} />}
        >
          <nav className="flex flex-col gap-4">
            <Link
              href="/"
              onClick={handleLinkClick}
              className={`no-underline py-2 px-4 rounded transition-colors ${
                isActive("/")
                  ? "text-primary font-medium bg-primary/10"
                  : "text-gray-700 hover:text-primary hover:bg-gray-50"
              }`}
            >
              Lista de caravanas
            </Link>
            <Link
              href="/confirm-payment"
              onClick={handleLinkClick}
              className={`no-underline py-2 px-4 rounded transition-colors ${
                isActive("/confirm-payment")
                  ? "text-primary font-medium bg-primary/10"
                  : "text-gray-700 hover:text-primary hover:bg-gray-50"
              }`}
            >
              Verificar inscrição
            </Link>

            <div className="border-t border-gray-200 pt-4 mt-4">
              {isAuthenticated ? (
                <div className="flex flex-col gap-3">
                  <Button
                    type="primary"
                    href="/admin/caravans"
                    className="bg-primary hover:bg-primary-dark border-none"
                    onClick={handleLinkClick}
                    block
                  >
                    Painel de administração
                  </Button>
                  <Button
                    onClick={() => {
                      signOut();
                      handleCloseMobileMenu();
                    }}
                    className="border-gray-300"
                    block
                  >
                    Logout
                  </Button>
                </div>
              ) : (
                <Button
                  type="primary"
                  href="/auth/login"
                  className="bg-primary hover:bg-primary-dark border-none"
                  onClick={handleLinkClick}
                  block
                >
                  Login
                </Button>
              )}
            </div>
          </nav>
        </Drawer>
      </div>
    </header>
  );
}

