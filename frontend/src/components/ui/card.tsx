import { cn } from "@/lib/utils"

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={cn("bg-white border border-border rounded-2xl p-6 shadow-sm glow-hover transition-all", className)}
      {...props}
    >
      {children}
    </div>
  )
}
