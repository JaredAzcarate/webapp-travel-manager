"use client";

import { signOut, useSession as useNextAuthSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export function useSession() {
  const { data: session, status } = useNextAuthSession();

  return {
    session,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
  };
}

export function useSignOut() {
  const router = useRouter();

  const signOutUser = async () => {
    await signOut({ redirect: false });
    router.push("/auth/login");
    router.refresh();
  };

  return { signOut: signOutUser };
}
