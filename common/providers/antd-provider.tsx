"use client";

import { App, ConfigProvider } from "antd";
import dayjs from "dayjs";
import "dayjs/locale/pt";
import { ReactNode } from "react";

dayjs.locale("pt");

interface AntdProviderProps {
  children: ReactNode;
}

export function AntdProvider({ children }: AntdProviderProps) {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorLink: "rgba(0,0,0,0.88)",
          colorLinkHover: "#007da5",
          colorPrimary: "#007da5",
          colorInfoBg: "oklch(96.7% 0.003 264.542)",
          colorInfoBorder: "none",
          colorWarningBorder: "none",
        },
        components: {
          Menu: {
            itemSelectedBg: "rgba(0,0,0,0.04)",
            activeBarBorderWidth: 0,
          },
          Typography: {
            titleMarginBottom: 0,
          },
          Form: {
            itemMarginBottom: 0,
          },
          Alert: {
            colorInfo: "#007da5",
          },
          Tag: {
            colorPrimaryBg: "#007da5",
            colorPrimary: "#007da5",
          },
          Button: {
            colorLink: "#007da5",
            colorLinkHover: "#007da5",
          },
          Card: {
            colorBgElevated: "#f0f0f0",
            borderRadiusLG: 24,
          },
        },
      }}
    >
      <App>{children}</App>
    </ConfigProvider>
  );
}
