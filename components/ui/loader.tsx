import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const loaderVariants = cva("group/loader flex items-end gap-0.5", {
  variants: {
    size: {
      sm: "h-4",
      default: "h-6",
      lg: "h-10",
    },
  },
  defaultVariants: {
    size: "default",
  },
})

function Loader({
  className,
  size = "default",
  bars = 5,
  label = "Loading",
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof loaderVariants> & {
    bars?: number
    label?: string
  }) {
  const barCount = Math.max(3, bars)

  return (
    <div
      data-slot="loader"
      role="status"
      aria-label={label}
      className={cn(loaderVariants({ size }), className)}
      {...props}
    >
      {Array.from({ length: barCount }, (_, index) => (
        <span
          key={index}
          className="w-1 shrink-0 origin-bottom animate-[spectrum_0.9s_ease-in-out_infinite] rounded-full bg-primary group-data-[size=sm]/loader:w-0.5 group-data-[size=lg]/loader:w-1.5"
          style={{
            height: "100%",
            animationDelay: `${(index % 4) * 0.12}s`,
            animationDuration: `${0.7 + (index % 3) * 0.15}s`,
          }}
        />
      ))}
      <span className="sr-only">{label}</span>
    </div>
  )
}

export { Loader }
