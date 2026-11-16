// The app's building blocks. Pages compose these instead of repeating class strings,
// so the look stays consistent and changes in one place.
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

type Variant = "primary" | "secondary" | "ghost" | "danger" | "whatsapp";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-white shadow-card hover:bg-ink/85",
  secondary: "border border-line bg-surface text-ink shadow-card hover:border-ink/30 hover:bg-sunken",
  ghost: "text-ink hover:bg-sunken",
  danger: "border border-danger text-danger hover:bg-danger hover:text-white",
  whatsapp: "bg-wa text-white hover:brightness-95",
};
const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export const buttonClass = (variant: Variant = "primary", size: Size = "md", extra?: string) =>
  cx(
    "press inline-flex items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60",
    variants[variant],
    sizes[size],
    extra,
  );

export function Button({
  variant,
  size,
  className,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}

export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

export const inputClass = cx(
  "w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/70",
  "transition-colors focus:border-brand focus:outline-none focus:ring-3 focus:ring-brand/15",
  "disabled:opacity-60",
);

export function Card({ className, ...props }: ComponentProps<"section">) {
  return <section className={cx("reveal rounded-card border border-line bg-surface p-5 shadow-card sm:p-6", className)} {...props} />;
}

export function SectionTitle({ title, hint, action }: { title: string; hint?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="font-display text-xl font-semibold">{title}</h2>
        {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({
  back,
  eyebrow,
  title,
  sub,
  action,
}: {
  back?: { href: string; label: string };
  eyebrow?: string;
  title: string;
  sub?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="rise flex flex-wrap items-end justify-between gap-4">
      <div>
        {back && <BackLink href={back.href} label={back.label} />}
        {eyebrow && <p className="mt-5 text-sm font-medium text-brand">{eyebrow}</p>}
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        {sub && <p className="mt-2 text-sm text-muted">{sub}</p>}
      </div>
      {action}
    </header>
  );
}

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="press group inline-flex h-8 items-center gap-1 rounded-lg pr-3 pl-1.5 text-sm font-medium text-muted hover:bg-sunken hover:text-ink"
    >
      <svg viewBox="0 0 20 20" aria-hidden className="size-4 transition-transform group-hover:-translate-x-0.5">
        <path d="M12.5 4.5 7 10l5.5 5.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {label}
    </Link>
  );
}

export function Stat({ label, value, sub, tone = "ink" }: { label: string; value: ReactNode; sub?: ReactNode; tone?: "ink" | "brand" | "gold" }) {
  const color = { ink: "text-ink", brand: "text-brand", gold: "text-gold" }[tone];
  return (
    <div className="rounded-card border border-line bg-surface p-4 shadow-card">
      <p className="text-[13px] font-medium text-muted">{label}</p>
      <p className={cx("mt-1 text-3xl font-semibold tracking-tight tabular-nums", color)}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
    </div>
  );
}

export function Badge({ tone = "muted", children }: { tone?: "muted" | "ok" | "gold" | "brand"; children: ReactNode }) {
  const t = {
    muted: "bg-sunken text-muted",
    ok: "bg-ok/12 text-ok",
    gold: "bg-gold-soft text-gold",
    brand: "bg-brand-soft text-brand",
  }[tone];
  return <span className={cx("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", t)}>{children}</span>;
}
