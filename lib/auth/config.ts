import { adminRepository } from "@/features/auth/repositories/admin.repository";
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

        const admin = await adminRepository.getByUsername(
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
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.username = token.username as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
});
