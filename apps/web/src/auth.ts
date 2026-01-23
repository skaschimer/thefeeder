import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/src/lib/prisma";
import { Role } from "@prisma/client";
import { logger } from "@/src/lib/logger";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const rawEmail = credentials?.email as string | undefined;
          const rawPassword = credentials?.password as string | undefined;
          const email = rawEmail?.trim();
          const password = rawPassword?.trim();
          if (!email || !password) {
            logger.warn("Login attempt with missing credentials");
            return null;
          }

          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user) {
            logger.warn("Login attempt: user not found");
            return null;
          }

          const bcrypt = await import("bcryptjs");
          const isValid = await bcrypt.compare(password, user.passwordHash);

          if (!isValid) {
            logger.warn("Login attempt: invalid password");
            return null;
          }

          logger.info("Login successful");
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error) {
          logger.error("Auth authorize error", error instanceof Error ? error : new Error(String(error)));
          return null;
        }
      },
    }),
  ],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const nextUrl = new URL(request.url);
      const isAdminPage = nextUrl.pathname.startsWith("/admin");
      
      if (isAdminPage && nextUrl.pathname !== "/admin/login") {
        if (isLoggedIn && auth.user?.role === Role.admin) {
          return true;
        }
        return false;
      }
      return true;
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.role = token.role as Role;
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string | null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/admin/login",
  },
  session: {
    strategy: "jwt",
  },
  trustHost: true,
});

