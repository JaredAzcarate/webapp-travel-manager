import { AntdProvider } from "@/common/providers/antd-provider";
import { QueryProvider } from "@/common/providers/query-provider";
import { SessionProvider } from "@/providers/session-provider";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Agendamentos do Templo",
  description: "Sistema de gestão de caravanas ao templo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt">
      <body className={inter.className}>
        <SessionProvider>
          <QueryProvider>
            <AntdProvider>{children}</AntdProvider>
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
