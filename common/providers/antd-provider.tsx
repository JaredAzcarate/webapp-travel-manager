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
          colorPrimary: "#007da5",
          colorInfoBg: "oklch(96.7% 0.003 264.542)",
          colorInfoBorder: "none",
          colorWarningBorder: "none",
        },
        components: {
          Form: {
            itemMarginBottom: 0,
          },
          Alert: {
            colorInfo: "#007da5",
          },
        },
      }}
    >
      <App>{children}</App>
    </ConfigProvider>
  );
}
