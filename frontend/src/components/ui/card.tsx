import { cn } from "@/lib/utils"

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={cn("bg-card border border-border rounded-xl p-6 glow-hover", className)}
      {...props}
    >
      {children}
    </div>
  )
}
