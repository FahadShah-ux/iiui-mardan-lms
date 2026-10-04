import type { Metadata } from "next";
import { LoginBody } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Sign In | IIUI Mardan Campus LMS" };

export default function LoginPage() {
  return <LoginBody />;
}
