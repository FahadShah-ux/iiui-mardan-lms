"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Quote,
  Rss,
  Target,
  Users,
  Scale,
  Search,
  Share2,
  HeartHandshake,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LandingHeader } from "@/components/landing/landing-header";
import { MediaPlaceholder, PortraitPlaceholder } from "@/components/landing/media-placeholder";
import { SectionHeading, SectionTag } from "@/components/landing/section-heading";
import { AdmissionEnquiryForm } from "@/components/landing/admission-enquiry-form";
import { useMounted } from "@/src/use-mounted";
import { ROLE_HOME, useAuth } from "@/src/auth-client";

/**
 * Landing page.
 *
 * Content describes IIUI School / Mardan Campus from pre-school through to
 * undergraduate degree study. Image slots use geometric panels rather than
 * photography; see components/landing/media-placeholder.tsx for the rationale
 * and for how to swap in real images later.
 *
 * This is the only file that needs "use client": it reads the session so the
 * LMS call-to-action can be personalised.
 */

const PILLARS = [
  {
    icon: Target,
    title: "Our Vision",
    body: "Academic rigour and moral grounding, held together in every subject we teach.",
  },
  {
    icon: Scale,
    title: "Integrity",
    body: "Honesty in work, respect in conduct, responsibility in life.",
  },
  {
    icon: Search,
    title: "Inquiry",
    body: "Questions valued as highly as answers, from the first classroom onward.",
  },
  {
    icon: HeartHandshake,
    title: "Inclusion",
    body: "Support plans so no learner is left behind, at any stage of the pathway.",
  },
];

const LEADERS = [
  {
    name: "Dr. Ayesha Malik",
    role: "Principal",
    quote: "A school is judged by the character of the people it sends into the world.",
  },
  {
    name: "Mr. Imran Qureshi",
    role: "Academic Director",
    quote: "Rigour and curiosity should sit in the same classroom, not compete for it.",
  },
  {
    name: "Ms. Hina Raza",
    role: "Head of Digital Learning",
    quote: "Technology should make learning visible to students, parents and teachers alike.",
  },
];

const PROGRAMMES = [
  {
    tag: "AGES 3–5",
    title: "Pre-School",
    body: "Play-based foundations in language, number and social confidence, in a safe and warm environment.",
  },
  {
    tag: "GRADES 1–5",
    title: "Primary",
    body: "Literacy and numeracy established alongside the habits of careful, independent work.",
  },
  {
    tag: "GRADES 6–12",
    title: "Secondary",
    body: "Subject specialisation begins, with assessments and study skills that carry into college.",
  },
];

const COLLEGE_PROGRAMMES = [
  {
    tag: "GRADES 11–12",
    title: "Intermediate",
    body: "Pre-university preparation with subject choice, laboratory work and examination readiness.",
  },
  {
    tag: "FA / FSC / ICS",
    title: "Undergraduate",
    body: "Two-year intermediate programmes across arts, science and computer studies.",
  },
  {
    tag: "BS / BA / BCOM",
    title: "Degree Programmes",
    body: "Undergraduate degrees with coursework, assessment and progress tracking through the LMS.",
  },
];

const TESTIMONIALS = [
  {
    name: "Sana Iqbal",
    relation: "Parent, Grade 4",
    body: "My daughter reads more at home now than she ever did before joining. The teachers notice what she needs.",
  },
  {
    name: "Tariq Mahmood",
    relation: "Parent, Grade 9",
    body: "The attendance board and the timetable app mean I am no longer guessing what is happening in school.",
  },
  {
    name: "Mahnoor Sheikh",
    relation: "Alumna, BS Computer Science",
    body: "I still use the study habits the school built. The digital learning side prepared me for university.",
  },
];

const EVENTS = [
  {
    badges: ["OPEN DAY", "ON LMS"],
    title: "Open Day",
    date: "Saturday 18 October · 10:00 AM",
    body: "Tour the campus, meet teaching staff and see the digital learning platform in use.",
  },
  {
    badges: ["CALENDAR", "ON LMS"],
    title: "Calendar Update",
    date: "Term dates published",
    body: "Assessment weeks, parent-teacher meetings and holidays are now published to every LMS account.",
  },
  {
    badges: ["NOTICE"],
    title: "Registration Notice",
    date: "Registrations close 30 November",
    body: "Admissions for the spring intake close at 5:00 PM. Early enquiries are reviewed first.",
  },
];

const QUICK_LINKS = [
  { href: "#mission", label: "Home" },
  { href: "#leadership", label: "About Us" },
  { href: "#academics", label: "Academics" },
  { href: "#admissions", label: "Admissions" },
  { href: "#news", label: "News & Events" },
];

export function LandingPage() {
  const mounted = useMounted();
  const user = useAuth((s) => s.user);

  const lmsHref = mounted && user ? ROLE_HOME[user.role] ?? "/login" : "/login";
  const lmsLabel = mounted && user ? "Open My Dashboard" : "Access LMS Portal";

  return (
    <div className="flex min-h-screen flex-col bg-[#F9FAFB] dark:bg-background">
      <LandingHeader lmsHref={lmsHref} />

      <main className="flex-1">
        {/* 1 — Hero */}
        <section className="relative">
          <MediaPlaceholder tone="gradient" ratio="" className="absolute inset-0" />
          <div className="relative mx-auto w-full max-w-6xl px-4 py-24 md:px-6 md:py-32">
            <SectionTag tone="dark">WELCOME TO IIUI SCHOOL</SectionTag>
            <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight text-white md:text-6xl">
              Academic excellence, built on character and{" "}
              <span className="text-white underline decoration-4 underline-offset-8 decoration-[#c1121f]">
                connected learning.
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-base text-white/80 md:text-lg">
              Pre-School through Secondary, continuing into Intermediate and undergraduate
              degree study. Every classroom, timetable, assignment and attendance record lives
              in one place, visible to students, teachers and families.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="bg-[#990000] hover:bg-[#7a0000]">
                <a href="#admissions">
                  Admit Your Child <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-[#0F172A] bg-transparent text-[#0F172A] hover:bg-[#0F172A]/5"
              >
                <Link href={lmsHref}>{lmsLabel}</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* 2 — Our Mission */}
        <section id="mission" className="scroll-mt-20 bg-white py-16 md:py-24 dark:bg-card">
          <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
            <SectionHeading
              tag="Our Mission"
              title={
                <>
                  Educating the whole student — mind, character and{" "}
                  <span className="text-[#990000] dark:text-[#c1121f]">community</span>.
                </>
              }
            />
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {PILLARS.map((p) => (
                <div
                  key={p.title}
                  className="rounded-md border border-border bg-[#F9FAFB] p-6 dark:bg-background"
                >
                  <p.icon className="h-6 w-6 text-[#990000] dark:text-[#c1121f]" />
                  <h3 className="mt-4 font-semibold">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3 — Campus media divider */}
        <MediaPlaceholder tone="slate" ratio="aspect-[6/1] md:aspect-[12/1]">
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="px-6 text-center text-sm font-medium uppercase tracking-[0.3em] text-white/70">
              IIUI School · Mardan Campus
            </p>
          </div>
        </MediaPlaceholder>

        {/* 4 — Leadership */}
        <section id="leadership" className="scroll-mt-20 py-16 md:py-24">
          <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
            <SectionHeading tag="Leadership" title="The people behind the classroom" />
            <div className="relative mt-12">
              <MediaPlaceholder
                tone="slate"
                ratio="aspect-[16/7]"
                className="absolute inset-0 !rounded-md"
              />
              <div className="relative grid gap-5 p-4 md:grid-cols-3 md:p-8">
                {LEADERS.map((l) => (
                  <div
                    key={l.name}
                    className="overflow-hidden rounded-md bg-white shadow-lg dark:bg-card"
                  >
                    <PortraitPlaceholder name={l.name} tone="crimson" />
                    <div className="p-5">
                      <p className="font-semibold">{l.name}</p>
                      <p className="text-xs uppercase tracking-wider text-[#990000] dark:text-[#c1121f]">
                        {l.role}
                      </p>
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        &ldquo;{l.quote}&rdquo;
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-10 text-center">
              <Button asChild className="bg-[#990000] hover:bg-[#7a0000]">
                <a href="#academics">
                  View all teachers <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* 5 — Academics & Programmes */}
        <section
          id="academics"
          className="scroll-mt-20 bg-white py-16 md:py-24 dark:bg-card"
        >
          <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
            <SectionHeading
              tag="Academics & Programs"
              title="A structured path from first words to final boards"
            />

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {PROGRAMMES.map((p) => (
                <div
                  key={p.title}
                  className="flex flex-col overflow-hidden rounded-md border border-border bg-card"
                >
                  <div className="flex aspect-[3/2] items-center justify-center">
                    <span className="text-5xl font-bold text-[#990000]/25 dark:text-[#c1121f]/30">
                      {p.tag.replace(/[^0-9–-]/g, "")}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <SectionTag>{p.tag}</SectionTag>
                    <h3 className="mt-3 text-lg font-semibold">{p.title}</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                      {p.body}
                    </p>
                    <a
                      href="#admissions"
                      className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#990000] hover:underline dark:text-[#c1121f]"
                    >
                      Learn More <ArrowRight className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-16 grid gap-6 md:grid-cols-3">
              {COLLEGE_PROGRAMMES.map((p) => (
                <div
                  key={p.title}
                  className="flex flex-col rounded-md border border-border bg-card p-6"
                >
                  <SectionTag>{p.tag}</SectionTag>
                  <h3 className="mt-3 text-lg font-semibold">{p.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {p.body}
                  </p>
                  <a
                    href="#admissions"
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#990000] hover:underline dark:text-[#c1121f]"
                  >
                    Learn More <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6 — Testimonials & Community */}
        <section id="community" className="scroll-mt-20 py-16 md:py-24">
          <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
            <SectionHeading tag="Parents & Alumnae" title="What our community says" />
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {TESTIMONIALS.map((t, i) => (
                <figure
                  key={t.name}
                  className={
                    i === 1
                      ? "rounded-md border-2 border-[#990000] bg-white p-6 dark:bg-card"
                      : "rounded-md border border-border bg-white p-6 dark:bg-card"
                  }
                >
                  <Quote className="h-8 w-8 text-[#990000] dark:text-[#c1121f]" />
                  <blockquote className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    {t.body}
                  </blockquote>
                  <figcaption className="mt-5 text-sm">
                    <span className="font-semibold">{t.name}</span>
                    <span className="block text-xs text-muted-foreground">{t.relation}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* 7 — Admissions */}
        <section
          id="admissions"
          className="scroll-mt-20 border-y border-border bg-white py-16 md:py-24 dark:bg-card"
        >
          <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
              <div>
                <SectionHeading
                  tag="Admissions"
                  title="Admit your child to IIUI School"
                  align="left"
                />
                <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
                  Submit an enquiry and our admissions team will respond within two working
                  days. Enquiries for the spring intake are reviewed in the order received.
                </p>
                <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-[#990000]" />
                    Pre-School to undergraduate degree study on one campus
                  </li>
                  <li className="flex items-start gap-2">
                    <Users className="mt-0.5 h-4 w-4 shrink-0 text-[#990000]" />
                    Small teaching groups with named class teachers
                  </li>
                  <li className="flex items-start gap-2">
                    <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-[#990000]" />
                    Timetables, attendance and results published to every LMS account
                  </li>
                </ul>
              </div>
              <AdmissionEnquiryForm />
            </div>
          </div>
        </section>

        {/* 8 — News, Events & Notices */}
        <section id="news" className="scroll-mt-20 py-16 md:py-24">
          <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
            <SectionHeading tag="News, Events & Notices" title="What's happening on campus" />
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {EVENTS.map((e) => (
                <article
                  key={e.title}
                  className="flex flex-col rounded-md border border-border bg-white p-6 dark:bg-card"
                >
                  <div className="flex flex-wrap gap-2">
                    {e.badges.map((b) => (
                      <SectionTag key={b}>{b}</SectionTag>
                    ))}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{e.title}</h3>
                  <p className="mt-1 text-xs font-medium uppercase tracking-wider text-[#990000] dark:text-[#c1121f]">
                    {e.date}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{e.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* 9 — Footer */}
      <footer className="bg-[#1E293B] text-white">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 md:grid-cols-2 md:px-6 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center bg-[#990000]">
                <span aria-hidden className="flex gap-[3px]">
                  <span className="block h-4 w-[3px] bg-white" />
                  <span className="block h-4 w-[3px] bg-white" />
                </span>
              </span>
              <span className="font-bold">IIUI School</span>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-white/70">
              Academic excellence, built on character and connected learning.
            </p>
            {/* lucide-react 1.x removed brand icons, so these use neutral
                glyphs with the platform names as accessible labels. Replace
                with real brand marks once accounts exist. */}
            <div className="mt-5 flex gap-2">
              {[
                { Icon: Share2, label: "Facebook" },
                { Icon: MessageCircle, label: "Instagram" },
                { Icon: Users, label: "LinkedIn" },
                { Icon: Rss, label: "YouTube" },
              ].map(({ Icon, label }) => (
                <span
                  key={label}
                  role="img"
                  aria-label={label}
                  title={label}
                  className="flex h-9 w-9 items-center justify-center rounded-md bg-white/10 text-white/80"
                >
                  <Icon className="h-4 w-4" />
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="font-semibold">Quick Links</p>
            <ul className="mt-5 space-y-3 text-sm text-white/70">
              {QUICK_LINKS.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="transition-colors hover:text-white">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-semibold">LMS Portal</p>
            <ul className="mt-5 space-y-3 text-sm text-white/70">
              <li>
                <Link href={lmsHref} className="transition-colors hover:text-white">
                  Student portal
                </Link>
              </li>
              <li>
                <Link href="/login" className="transition-colors hover:text-white">
                  Teacher portal
                </Link>
              </li>
              {/* No PARENT role exists in this system, so this is contact
                  information rather than a portal link that cannot work. */}
              <li className="text-white/50">
                Parent updates are sent via the class teacher
              </li>
            </ul>
            <Button
              asChild
              size="sm"
              className="mt-5 bg-[#990000] hover:bg-[#7a0000]"
            >
              <Link href={lmsHref}>
                Open LMS <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          <div>
            <p className="font-semibold">Contact</p>
            <ul className="mt-5 space-y-3 text-sm text-white/70">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-white/50" />
                Mardan Campus, Khyber Pakhtunkhwa, Pakistan
              </li>
              <li className="flex items-start gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-white/50" />
                +92 93X XXXXXXX
              </li>
              <li className="flex items-start gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-white/50" />
                admissions@iiui.edu.pk
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 py-5 text-center text-xs text-white/50">
          © {new Date().getFullYear()} Islamic International University Islamabad — Mardan
          Campus. All rights reserved.
        </div>
      </footer>
    </div>
  );
}