import "server-only";
import { getServerSession, type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { redirect } from "next/navigation";
import { cache } from "react";

export function demoEnabled() {
  return (
    process.env.NODE_ENV === "development" && process.env.DEMO_MODE === "true"
  );
}
export function authConfigured() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.ALLOWED_EMAIL &&
    process.env.NEXTAUTH_SECRET &&
    process.env.NEXTAUTH_URL,
  );
}
export function allowedEmail(email?: string | null) {
  return Boolean(
    email &&
    process.env.ALLOWED_EMAIL &&
    email.toLowerCase() === process.env.ALLOWED_EMAIL.trim().toLowerCase(),
  );
}
export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      authorization: {
        params: { prompt: "select_account", scope: "openid email profile" },
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: { signIn: "/login", error: "/login" },
  callbacks: {
    async signIn({ account, profile }) {
      return (
        authConfigured() &&
        account?.provider === "google" &&
        (profile as { email_verified?: boolean })?.email_verified === true &&
        allowedEmail(profile?.email)
      );
    },
    async session({ session, token }) {
      if (session.user) session.user.email = token.email;
      return session;
    },
  },
};
// Also called at the data boundary, not only the route layout.
export const requireUser = cache(async () => {
  if (demoEnabled()) return { email: "demo@localhost", demo: true };
  if (!authConfigured()) redirect("/login");
  const session = await getServerSession(authOptions);
  if (!session?.user || !allowedEmail(session.user.email)) redirect("/login");
  return { email: session.user.email!, demo: false };
});
