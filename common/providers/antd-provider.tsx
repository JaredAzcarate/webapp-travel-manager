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
        },
      }}
    >
      <App>{children}</App>
    </ConfigProvider>
  );
}
