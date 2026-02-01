"use client";

import { PrivacyPolicyModal } from "@/common/components/PrivacyPolicyModal";
import { Button } from "antd";
import { useState } from "react";

export function AppFooter() {
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const year = new Date().getFullYear();

  return (
    <>
      <footer className="mt-auto border-t border-gray-200 bg-white py-4 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 text-sm text-gray-600">
          <Button
            type="link"
            onClick={() => setPrivacyModalOpen(true)}
            className="p-0 h-auto font-normal text-gray-600 hover:text-gray-900"
            style={{ padding: 0, height: "auto" }}
          >
            Política de Privacidade
          </Button>
          <span className="hidden sm:inline">·</span>
          <span>Viagens ao Templo | Estaca Porto Norte</span>
        </div>
      </footer>
      <PrivacyPolicyModal
        open={privacyModalOpen}
        onClose={() => setPrivacyModalOpen(false)}
      />
    </>
  );
}
