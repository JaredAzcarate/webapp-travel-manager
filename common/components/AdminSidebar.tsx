"use client";

import { useSignOut } from "@/features/auth/hooks/auth.hooks";
import { Layout, Menu } from "antd";
import { usePathname, useRouter } from "next/navigation";
import { Buildings, Bus, Scroll, SignOut, Truck, Users } from "phosphor-react";
import { useMemo } from "react";

const { Sider } = Layout;

interface MenuItem {
  key: string;
  label: string;
  path: string;
  icon: React.ReactNode;
}

const menuItems: MenuItem[] = [
  {
    key: "chapels",
    label: "Capelas",
    path: "/admin/chapels",
    icon: <Buildings size={20} />,
  },
  {
    key: "caravans",
    label: "Caravanas",
    path: "/admin/caravans",
    icon: <Bus size={20} />,
  },
  {
    key: "buses",
    label: "Autocarros",
    path: "/admin/buses",
    icon: <Truck size={20} />,
  },
  {
    key: "ordinances",
    label: "Ordenanças",
    path: "/admin/ordinances",
    icon: <Scroll size={20} />,
  },
  {
    key: "managers",
    label: "Gestores",
    path: "/admin/managers",
    icon: <Users size={20} />,
  },
];

export const AdminSidebar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { signOut } = useSignOut();

  const selectedKey = useMemo(() => {
    const item = menuItems.find((item) => pathname?.startsWith(item.path));
    return item?.key || "";
  }, [pathname]);

  const handleMenuClick = ({ key }: { key: string }) => {
    const item = menuItems.find((item) => item.key === key);
    if (item) {
      router.push(item.path);
    }
  };

  const handleSignOut = () => {
    signOut();
  };

  return (
    <Sider
      width={200}
      style={{
        overflow: "auto",
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div className="p-4 text-white text-lg font-semibold">
        Gestão do Templo
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[selectedKey]}
        items={menuItems.map((item) => ({
          key: item.key,
          label: item.label,
          icon: item.icon,
        }))}
        onClick={handleMenuClick}
        style={{ flex: 1 }}
      />
      <div
        className="p-4 border-t border-gray-700 cursor-pointer hover:bg-gray-700 transition-colors"
        onClick={handleSignOut}
      >
        <div className="flex items-center gap-3 text-white">
          <SignOut size={20} />
          <span>Sair</span>
        </div>
      </div>
    </Sider>
  );
};
