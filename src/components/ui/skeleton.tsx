import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      aria-hidden="true"
      data-slot="skeleton"
      className={cn("bg-foreground/[0.03] premium-shimmer rounded-lg relative overflow-hidden", className)}
      {...props}
    />
  )
}

export { Skeleton }
