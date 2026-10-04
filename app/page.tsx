
import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing";

export const metadata: Metadata = {
  title: "IIUI School & Campus, Mardan | Welcome",
  description:
    "Academic excellence built on character and connected learning. Pre-School to undergraduate degree study on one campus, with timetables, attendance and results published to every LMS account.",
};

export default function Home() {
  return <LandingPage />;
}

