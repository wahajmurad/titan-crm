import { cn } from "@/lib/utils"

function Skeleton({ className, variant, ...props }: React.ComponentProps<"div"> & { variant?: "default" | "shimmer" }) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "rounded-[10px]",
        variant === "shimmer"
          ? "skeleton-shimmer"
          : "bg-accent animate-pulse",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
