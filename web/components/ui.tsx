import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "quiet" | "ghost";

const base =
  "inline-flex items-center justify-center gap-2 rounded-md px-5 py-2.5 text-[15px] font-medium transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed";

const variants: Record<Variant, string> = {
  primary: "bg-sage text-sage-ink hover:opacity-90",
  quiet: "bg-surface-2 text-ink hover:bg-line",
  ghost: "text-muted hover:text-ink hover:bg-surface-2",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

const tints = {
  none: "border-line bg-surface",
  sage: "border-transparent bg-sage-soft",
  mist: "border-transparent bg-mist-soft",
  clay: "border-transparent bg-clay-soft",
} as const;

export function Card({
  className = "",
  tint = "none",
  ...props
}: ComponentProps<"div"> & { tint?: keyof typeof tints }) {
  return <div className={`rounded-3xl border p-6 sm:p-8 ${tints[tint]} ${className}`} {...props} />;
}

type Tone = "sage" | "sand" | "clay" | "mist" | "plain";

const tones: Record<Tone, string> = {
  sage: "bg-sage-soft text-sage",
  sand: "bg-sand text-sand-ink",
  clay: "bg-clay-soft text-clay",
  mist: "bg-mist-soft text-mist-ink",
  plain: "bg-surface-2 text-muted",
};

export function Pill({ tone = "plain", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-3 py-0.5 text-[13px] font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function PageHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: ReactNode;
  title: string;
  children?: ReactNode;
}) {
  return (
    <header className="settle mb-10">
      {eyebrow && <p className="mb-2 text-sm tracking-wide text-muted">{eyebrow}</p>}
      <h1 className="font-display text-3xl leading-tight sm:text-4xl">{title}</h1>
      {children && <div className="mt-4 max-w-prose text-lg text-muted">{children}</div>}
    </header>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="mb-4 font-display text-xl">{children}</h2>;
}
