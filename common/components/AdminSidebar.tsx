"use client";

import { useSignOut } from "@/features/auth/hooks/auth.hooks";
import { Button, Drawer, Layout, Menu } from "antd";
import { usePathname, useRouter } from "next/navigation";
import { List, SignOut, X } from "phosphor-react";
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";

const { Sider } = Layout;

interface MenuItem {
  key: string;
  label: string;
  path?: string;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    key: "caravans",
    label: "Viagens",
    path: "/admin/caravans",
  },
  {
    key: "configuracoes",
    label: "Configurações",
    children: [
      {
        key: "chapels",
        label: "Capelas",
        path: "/admin/chapels",
      },
      {
        key: "buses",
        label: "Autocarros",
        path: "/admin/buses",
      },
      {
        key: "ordinances",
        label: "Ordenanças",
        path: "/admin/ordinances",
      },
      {
        key: "managers",
        label: "Gestores",
        path: "/admin/managers",
      },
    ],
  },
];

// Flatten all menu items (including subitems) for path lookup
const getAllMenuItems = (items: MenuItem[]): MenuItem[] => {
  const result: MenuItem[] = [];
  items.forEach((item) => {
    if (item.path) {
      result.push(item);
    }
    if (item.children) {
      result.push(...getAllMenuItems(item.children));
    }
  });
  return result;
};

const allMenuItems = getAllMenuItems(menuItems);


export const AdminSidebar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { signOut } = useSignOut();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openKeys, setOpenKeys] = useState<string[]>([]);

  const selectedKey = useMemo(() => {
    const item = allMenuItems.find((item) => pathname?.startsWith(item.path || ""));
    return item?.key || "";
  }, [pathname]);

  // Calculate default openKeys - auto-open configuracoes if subitem is selected
  const defaultOpenKeys = useMemo(() => {
    if (selectedKey && ["chapels", "buses", "ordinances", "managers"].includes(selectedKey)) {
      return ["configuracoes"];
    }
    return [];
  }, [selectedKey]);

  // Initialize openKeys with defaultOpenKeys if empty
  const computedOpenKeys = openKeys.length > 0 || defaultOpenKeys.length === 0
    ? openKeys
    : defaultOpenKeys;

  const handleMenuClick = ({ key }: { key: string }) => {
    const item = allMenuItems.find((item) => item.key === key);
    if (item && item.path) {
      router.push(item.path);
      setMobileMenuOpen(false);
    }
  };

  // Convert menuItems to Ant Design Menu items format
  const menuItemsForAntd = useMemo(() => {
    return menuItems.map((item) => {
      if (item.children) {
        return {
          key: item.key,
          label: item.label,
          children: item.children.map((child) => ({
            key: child.key,
            label: child.label,
          })),
        };
      }
      return {
        key: item.key,
        label: item.label,
      };
    });
  }, []);

  const handleSignOut = () => {
    signOut();
    setMobileMenuOpen(false);
  };

  const handleCloseMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>

      {/* Mobile Hamburger Button - Rendered via portal to body */}
      {typeof window !== "undefined" &&
        createPortal(
          <div className="md:hidden fixed top-4 right-4 z-50">
            <Button
              type="primary"
              icon={<List size={20} className="text-white" />}
              onClick={() => setMobileMenuOpen(true)}
            />
          </div>
          ,
          document.body
        )}

      {/* Desktop Sidebar */}
      <Sider
        className="hidden md:block"
        theme="light"
      >
        <div className="flex flex-col h-full min-h-screen justify-between p-2 gap-10">
          {/* Logo */}
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3 border-b border-gray-200 py-2">
              <div className="bg-primary p-1.5 rounded-md">
                <svg
                  className="w-7 h-7 fill-white"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M19.75 15v5.75h-5.409v-3.637A2.343 2.343 0 0 0 12 14.772a2.343 2.343 0 0 0-2.341 2.341v3.637H4.25V15h-.056l6.223-3.007c.208-.1.358-.29.407-.516L12 6.045l1.176 5.432a.748.748 0 0 0 .407.516L19.806 15h-.056zm-5.185-4.198l-1.832-8.461c-.171-.788-1.295-.788-1.466 0l-1.832 8.461-7.761 3.75a.75.75 0 1 0 .652 1.351l.424-.205V21.5c0 .414.336.75.75.75h17a.75.75 0 0 0 .75-.75v-5.802l.424.205a.75.75 0 1 0 .652-1.351l-7.761-3.75z"></path>
                </svg>
              </div>
              <div className="flex flex-col">
                <p className="text-sm font-semibold">Viagens ao Templo</p>
                <p className="text-xs text-gray-400">Estaca Porto Norte</p>
              </div>
            </div>
            {/* Menu Items */}
            <Menu
              mode="inline"
              selectedKeys={[selectedKey]}
              openKeys={computedOpenKeys}
              onOpenChange={setOpenKeys}
              items={menuItemsForAntd}
              onClick={handleMenuClick}
            />
          </div>


          {/* Sign Out Button */}
          <Button type="primary" onClick={handleSignOut}>
            <SignOut size={20} className="text-white" />
            Fechar sessão
          </Button>
        </div>
      </Sider>

      {/* Mobile Menu Drawer */}
      <Drawer
        title="Menu"
        placement="left"
        onClose={handleCloseMobileMenu}
        open={mobileMenuOpen}
        closeIcon={<X size={20} />}
      >
        <div className="flex flex-col h-full justify-between gap-10">
          {/* Logo */}
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <div className="bg-primary p-1.5 rounded-md">
                <svg
                  className="w-7 h-7 fill-white"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M19.75 15v5.75h-5.409v-3.637A2.343 2.343 0 0 0 12 14.772a2.343 2.343 0 0 0-2.341 2.341v3.637H4.25V15h-.056l6.223-3.007c.208-.1.358-.29.407-.516L12 6.045l1.176 5.432a.748.748 0 0 0 .407.516L19.806 15h-.056zm-5.185-4.198l-1.832-8.461c-.171-.788-1.295-.788-1.466 0l-1.832 8.461-7.761 3.75a.75.75 0 1 0 .652 1.351l.424-.205V21.5c0 .414.336.75.75.75h17a.75.75 0 0 0 .75-.75v-5.802l.424.205a.75.75 0 1 0 .652-1.351l-7.761-3.75z"></path>
                </svg>
              </div>
              <div className="flex flex-col">
                <p className="text-sm font-semibold">Viagens ao Templo</p>
                <p className="text-xs text-gray-400">Estaca Porto Norte</p>
              </div>
            </div>
            {/* Menu Items */}
            <Menu
              mode="inline"
              selectedKeys={[selectedKey]}
              openKeys={computedOpenKeys}
              onOpenChange={setOpenKeys}
              items={menuItemsForAntd}
              onClick={handleMenuClick}
            />
          </div>


          {/* Sign Out Button */}
          <Button type="primary" onClick={handleSignOut}>
            <SignOut size={20} className="text-white" />
            Fechar sessão
          </Button>
        </div>
      </Drawer>
    </>
  );
};
