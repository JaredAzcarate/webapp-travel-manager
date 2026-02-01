import { PublicLayout } from "@/common/components/PublicLayout";
import { AntdProvider } from "@/common/providers/antd-provider";
import { QueryProvider } from "@/common/providers/query-provider";
import { SessionProvider } from "@/providers/session-provider";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Inscrições Viagens ao Templo — Estaca Porto Norte",
  description: "Sistema de gestão de caravanas ao templo da Estaca Porto Norte",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt">
      <body className={`${inter.className} bg-gray-100`}>
        <SessionProvider>
          <QueryProvider>
            <AntdProvider>
              <PublicLayout>{children}</PublicLayout>
            </AntdProvider>
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
