"use client";
import { signIn, signOut } from "next-auth/react";
import { LogOut, ArrowRight } from "lucide-react";
export function LoginButton() {
  return (
    <button
      className="button primary"
      onClick={() => void signIn("google", { callbackUrl: "/" })}
    >
      Googleでログイン <ArrowRight size={17} />
    </button>
  );
}
export function LogoutButton() {
  return (
    <button
      className="button"
      onClick={() => void signOut({ callbackUrl: "/login" })}
    >
      <LogOut size={16} />
      ログアウト
    </button>
  );
}
