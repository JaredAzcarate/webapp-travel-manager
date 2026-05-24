import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      role: "ADMIN" | "SECRETARY";
      chapelId?: string;
    };
  }

  interface User {
    id: string;
    username: string;
    role?: "ADMIN" | "SECRETARY";
    chapelId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    username?: string;
    role?: "ADMIN" | "SECRETARY";
    chapelId?: string;
  }
}
