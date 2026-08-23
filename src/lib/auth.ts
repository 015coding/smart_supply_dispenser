import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  secret: process.env.AUTH_SECRET,
  pages: { signIn: "/admin/login" },
  providers: [
    CredentialsProvider({
      name: "Admin credentials",
      credentials: {
        username: { label: "ชื่อผู้ใช้", type: "text" },
        password: { label: "รหัสผ่าน", type: "password" }
      },
      async authorize(credentials) {
        const username = process.env.ADMIN_USERNAME;
        const passwordHash = process.env.ADMIN_PASSWORD_HASH;
        if (!username || !passwordHash || credentials?.username !== username || !credentials.password) return null;
        const valid = await compare(credentials.password, passwordHash);
        return valid ? { id: "global-admin", name: username, role: "global_admin" } : null;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = user.role;
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.role = String(token.role ?? "global_admin");
      return session;
    }
  }
};
