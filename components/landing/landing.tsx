
"use client";

import * as React from "react";
import Link from "next/link";
import {
  GraduationCap,
  CalendarDays,
  Mail,
  Phone,
  MapPin,
  Clock,
  Cpu,
  Palette,
  HeartHandshake,
  ClipboardList,
  School,
  FileText,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { useMounted } from "@/src/use-mounted";
import { ROLE_HOME, useAuth } from "@/src/auth-client";

const STATS = [
  { value: "8:1", label: "Student-to-Teacher Ratio" },
  { value: "98%", label: "College Acceptance Rate" },
  { value: "45+", label: "Extracurricular Clubs, Fine Arts & Athletic Teams" },
  { value: "100%", label: "Faculty with Advanced Degrees or Specialized Certification" },
];

const DEADLINES = [
  { date: "March 1st", label: "Fall 2026 Priority Admissions Deadline" },
  { date: "April 15th", label: "Financial Aid Application Deadline" },
  { date: "Saturday, October 18th · 10:00 AM", label: "Upcoming Open House" },
];

export function LandingPage() {
  const mounted = useMounted();
  const user = useAuth((s) => s.user);

  const lmsHref = mounted && user ? ROLE_HOME[user.role] ?? "/login" : "/login";
  const lmsLabel = mounted && user ? "Open My Dashboard" : "Visit the LMS";

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-4 md:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#990000] to-[#c1121f] text-white">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-semibold">IIUI Mardan Campus</p>
              <p className="hidden truncate text-[11px] text-muted-foreground sm:block">
                Inquiry-Based Learning Academy
              </p>
            </div>
          </Link>
          <nav className="ml-auto hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
            <a href="#academics" className="transition-colors hover:text-foreground">Academics</a>
            <a href="#admissions" className="transition-colors hover:text-foreground">Admissions</a>
            <a href="#contact" className="transition-colors hover:text-foreground">Visit Campus</a>
          </nav>
          <div className="ml-auto flex items-center gap-1.5 md:ml-0">
            <ThemeToggle />
            <Button asChild size="sm" className="inline-flex">
              <Link href={lmsHref}>{lmsLabel}</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Section 1: Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#990000]/10 via-background to-background">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#c1121f]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-[#990000]/10 blur-3xl" />
        <div className="relative mx-auto w-full max-w-4xl px-4 py-20 text-center md:py-28 md:px-6">
          <Badge className="mb-5 bg-[#990000]/10 text-[#990000] dark:bg-[#c1121f]/15 dark:text-[#ff9999]">
            <School className="h-3.5 w-3.5" /> Now enrolling for Fall 2026
          </Badge>
          <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight tracking-tight md:text-6xl md:leading-tight">
            Empowering Tomorrow&apos;s Innovators Through <span className="text-[#990000] dark:text-[#c1121f]">Inquiry-Based Learning</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground md:text-lg">
            Discover a supportive K-12 community where curiosity meets academic excellence.
            Schedule your private tour today.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <a href="#admissions"><CalendarDays className="h-4 w-4" /> Book a Campus Tour</a>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="#contact">Request Info</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Section 2: Stats & Social Proof */}
      <section className="border-t bg-[#990000] text-white">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-px divide-y divide-white/15 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="px-6 py-8 text-center">
              <p className="text-4xl font-bold md:text-5xl">{s.value}</p>
              <p className="mt-2 text-sm text-white/85">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="border-t border-white/15 bg-white/5">
          <div className="mx-auto max-w-4xl px-4 py-14 text-center md:px-6">
            <svg className="mx-auto mb-4 h-8 w-8 text-white/40" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
            </svg>
            <blockquote className="text-lg font-medium leading-relaxed md:text-xl">
              &ldquo;Switching to this school was the best decision we made for our daughter.
              The teachers genuinely know and care for every student, and the community
              welcomed us with open arms from day one.&rdquo;
            </blockquote>
            <p className="mt-4 text-sm font-semibold tracking-wide text-white/85">
              — Sarah M., Parent of a 7th Grader
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: Feature Highlights */}
      <section id="academics" className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-16 md:py-24 md:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#990000] dark:text-[#c1121f]">Academics & Beyond</p>
          <h2 className="mt-3 text-3xl font-bold md:text-4xl">An Education Built for the Real World</h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            { icon: Cpu, title: "STEM & Innovation", body: "Hands-on coding, robotics, and design thinking integrated into daily coursework from elementary upward. Our state-of-the-art labs encourage active problem-solving." },
            { icon: Palette, title: "Arts & Athletics", body: "Robust visual and performing arts programs alongside competitive athletic leagues fostering creativity, leadership, teamwork, and healthy physical discipline." },
            { icon: HeartHandshake, title: "Whole-Child Development", body: "Dedicated character education, social-emotional learning, mindfulness practices, and personalized academic counseling to ensure every child thrives mentally and socially." },
          ].map((f) => (
            <Card key={f.title} className="border-border/60">
              <CardContent className="flex h-full flex-col p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#990000] to-[#c1121f] text-white">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Section 4: Admissions Pathway & Deadlines */}
      <section id="admissions" className="scroll-mt-20 bg-muted/50">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 md:py-24 md:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#990000] dark:text-[#c1121f]">Admissions</p>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">Your Journey to Joining Our Community</h2>
          </div>
          <div className="mt-12 grid items-start gap-8 lg:grid-cols-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:col-span-3">
              {[
                { icon: ClipboardList, step: "Step 1", title: "Inquire", body: "Fill out our quick online form to receive our digital admissions packet." },
                { icon: CalendarDays, step: "Step 2", title: "Tour", body: "Visit our campus for a personalized private walkthrough or attend an Open House." },
                { icon: FileText, step: "Step 3", title: "Apply", body: "Submit your online application along with student transcripts and recommendations." },
                { icon: CheckCircle2, step: "Step 4", title: "Enroll", body: "Finalize your registration and join us for orientation and family welcome events!" },
              ].map((s) => (
                <Card key={s.title} className="border-border/60">
                  <CardContent className="p-6">
                    <div className="mb-3 flex items-center gap-2">
                      <Badge className="bg-[#990000]/10 text-[#990000] dark:bg-[#c1121f]/15 dark:text-[#ff9999]">{s.step}</Badge>
                      <s.icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold">{s.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card className="lg:col-span-2">
              <CardContent className="p-6">
                <h3 className="text-base font-semibold">Upcoming Deadlines & Notices</h3>
                <div className="mt-4 space-y-3">
                  {DEADLINES.map((d) => (
                    <div key={d.label} className="flex items-start gap-3 rounded-lg border p-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#990000]/10 text-[#990000] dark:bg-[#c1121f]/15 dark:text-[#ff9999]">
                        <CalendarDays className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-snug">{d.date}</p>
                        <p className="text-xs text-muted-foreground">{d.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button asChild className="mt-6 w-full">
                  <a href="#contact">Book a Campus Tour</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Section 5: Footer & Practical Information */}
      <footer id="contact" className="scroll-mt-20 border-t bg-[#990000] text-white">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 md:grid-cols-2 md:px-6 lg:grid-cols-3">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
                <GraduationCap className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold">IIUI Mardan Campus</p>
            </div>
            <ul className="mt-5 space-y-3 text-sm text-white/85">
              <li className="flex items-start gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-white/60" /> (555) 123-4567
              </li>
              <li className="flex items-start gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-white/60" /> admissions@ourschool.edu
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-white/60" /> 100 Learning Way, Education City, ST 12345
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-white/60" /> Monday – Friday, 8:00 AM – 4:00 PM
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold">Important Links</p>
            <ul className="mt-5 space-y-3 text-sm text-white/85">
              <li><span className="cursor-default">Tuition & Financial Aid Details</span></li>
              <li><span className="cursor-default">School Calendar & Term Dates</span></li>
              <li><span className="cursor-default">Privacy Policy & Terms of Service</span></li>
              <li>
                <Link href="/login" className="inline-flex items-center gap-1.5 font-medium text-white underline-offset-4 hover:underline">
                  Parent Portal Login <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </li>
            </ul>
          </div>
          <div className="md:col-span-2 lg:col-span-1">
            <p className="text-sm font-semibold">Get Started</p>
            <p className="mt-3 text-sm text-white/85">
              Explore the Learning Management System — announcements, assignments, lectures, and more.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-5 w-full bg-white text-[#990000] hover:bg-white/90 sm:w-auto"
            >
              <Link href={lmsHref}>
                <GraduationCap className="h-4 w-4" /> {lmsLabel}
              </Link>
            </Button>
          </div>
        </div>
        <div className="border-t border-white/15 py-5 text-center text-xs text-white/60">
          © {new Date().getFullYear()} Islamic International University Islamabad - Mardan Campus. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

