
import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing";

export const metadata: Metadata = {
  title: "IIUI Mardan Campus | Welcome",
  description: "A supportive K-12 community where curiosity meets academic excellence. Book a campus tour today.",
};

export default function Home() {
  return <LandingPage />;
}

