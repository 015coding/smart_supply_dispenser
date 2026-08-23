import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";

const authConfig = {
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  secret: process.env.AUTH_SECRET,
  pages: { signIn: "/admin/login" },
  providers: [
    Credentials({
      name: "Admin credentials",
      credentials: {
        username: { label: "ชื่อผู้ใช้", type: "text" },
        password: { label: "รหัสผ่าน", type: "password" }
      },
      async authorize(credentials) {
        const username = process.env.ADMIN_USERNAME;
        const passwordHash = process.env.ADMIN_PASSWORD_HASH;
        const inputUsername = typeof credentials?.username === "string" ? credentials.username : "";
        const inputPassword = typeof credentials?.password === "string" ? credentials.password : "";
        if (!username || !passwordHash || inputUsername !== username || !inputPassword) return null;
        const valid = await compare(inputPassword, passwordHash);
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
} satisfies NextAuthConfig;

export const { handlers, auth } = NextAuth(authConfig);
