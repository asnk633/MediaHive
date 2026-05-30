import { cn } from "@/lib/utils"

/**
 * Skeleton — GPU-accelerated shimmer loading placeholder.
 *
 * Uses a translateX-animated diagonal gradient overlay via ::after pseudo-element.
 * Animation runs entirely on the compositor (transform only) for guaranteed 60fps.
 * The shimmer keyframe + .skeleton-shimmer class are defined in globals.css.
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      aria-hidden="true"
      data-slot="skeleton"
      className={cn(
        "bg-foreground/[0.03] rounded-lg relative overflow-hidden skeleton-shimmer",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
