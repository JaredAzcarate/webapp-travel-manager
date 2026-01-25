"use client";

import { ReactNode } from "react";

interface PublicContentProps {
  children: ReactNode;
}

export function PublicContent({ children }: PublicContentProps) {
  return (
    <div className="max-w-5xl mx-auto py-10 flex flex-col gap-6">
      {children}
    </div>
  );
}
