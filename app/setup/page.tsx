"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SetupAdminPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to managers page
    router.replace("/admin/managers");
  }, [router]);

  return null;
}
