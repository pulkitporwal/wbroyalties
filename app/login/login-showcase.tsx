import Image from "next/image"
import { BarChart3, ShieldCheck, Users2 } from "lucide-react"

const bars = [38, 62, 45, 80, 55, 70, 40, 90, 58, 72, 48, 65, 35, 85, 50]

const features = [
  {
    icon: BarChart3,
    title: "Performance at a glance",
    description: "Revenue, streams, and platform trends in one dashboard.",
  },
  {
    icon: Users2,
    title: "Artist & catalog tracking",
    description: "See how every artist and release is performing over time.",
  },
  {
    icon: ShieldCheck,
    title: "Locked-down access",
    description: "Only super admins and admins you approve can sign in.",
  },
]

export function LoginShowcase() {
  return (
    <div className="relative hidden flex-col justify-between overflow-hidden bg-[oklch(0.16_0.03_255)] px-10 py-12 text-white lg:flex">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: [
            "radial-gradient(circle at 15% 8%, color-mix(in oklch, var(--primary), transparent 35%), transparent 45%)",
            "radial-gradient(circle at 85% 15%, color-mix(in oklch, var(--secondary), transparent 45%), transparent 40%)",
            "radial-gradient(circle at 30% 95%, color-mix(in oklch, var(--primary), transparent 55%), transparent 50%)",
          ].join(", "),
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full blur-3xl"
        style={{ background: "color-mix(in oklch, var(--secondary), transparent 55%)" }}
      />

      <div className="relative z-10 flex items-center gap-2.5">
        <Image
          src="/logo.webp"
          alt="Logo"
          width={32}
          height={32}
          className="rounded-md"
        />
        <span className="font-heading text-sm font-medium tracking-wide">
          WB Royalties
        </span>
      </div>

      <div className="relative z-10 flex max-w-md flex-col gap-8">
        <div className="flex flex-col gap-3">
          <span className="w-fit rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[0.625rem] font-medium tracking-wide text-white/70 uppercase">
            Internal Platform
          </span>
          <h1 className="font-heading text-4xl leading-tight font-medium text-balance">
            Know exactly how your catalog is performing.
          </h1>
          <p className="text-sm/relaxed text-white/60 text-balance">
            One place to track artists, releases, platforms, and revenue —
            built for the people who run the label.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {features.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex items-start gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                <Icon className="size-4 text-white/80" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs/relaxed font-medium text-white">
                  {title}
                </span>
                <span className="text-xs/relaxed text-white/50">
                  {description}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 flex h-16 items-end gap-1">
        {bars.map((height, index) => (
          <div
            key={index}
            className="w-full rounded-full bg-gradient-to-t from-white/40 to-white/5"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
    </div>
  )
}
