import { adminRepositoryServer } from "@/features/auth/repositories/admin.repository.server";
import { comparePassword } from "@/lib/auth/password.utils";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const admin = await adminRepositoryServer.getByUsername(
          credentials.username as string
        );

        if (!admin) {
          return null;
        }

        const isValid = await comparePassword(
          credentials.password as string,
          admin.password
        );

        if (!isValid) {
          return null;
        }

        return {
          id: admin.id,
          username: admin.username,
          role: admin.role ?? "ADMIN",
          chapelId: admin.chapelId,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.username = user.username;
        token.sub = user.id;
        token.role = (user as { role?: string }).role;
        token.chapelId = (user as { chapelId?: string }).chapelId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.username = token.username as string;
        session.user.role =
          (token.role as "ADMIN" | "SECRETARY" | undefined) ?? "ADMIN";
        session.user.chapelId = token.chapelId as string | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
});
