import NextAuth from "next-auth";
import { authOptions, authConfigured } from "@/lib/auth";
import type { NextRequest } from "next/server";
const handler = NextAuth(authOptions);
async function protectedHandler(
  request: NextRequest,
  context: { params: Promise<{ nextauth: string[] }> },
) {
  if (!authConfigured())
    return Response.json(
      { error: "Authentication is not configured" },
      { status: 503 },
    );
  return handler(request, context);
}
export { protectedHandler as GET, protectedHandler as POST };
