import { Card } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"

interface MetricCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: {
    value: number
    label: string
    isPositive: boolean
  }
}

export function MetricCard({ title, value, description, icon: Icon, trend }: MetricCardProps) {
  return (
    <Card className="flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-col">
          <span className="text-sm uppercase tracking-wider text-muted font-semibold">{title}</span>
          <span className="text-3xl font-bold text-foreground mt-1">{value}</span>
        </div>
        <div className="p-3 bg-background rounded-lg border border-border">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </div>
      
      {trend && (
        <div className="flex items-center mt-auto pt-4 border-t border-border/50">
          <span className={`text-sm font-medium ${trend.isPositive ? 'text-success' : 'text-destructive'}`}>
            {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
          </span>
          <span className="text-sm text-muted ml-2">{trend.label}</span>
        </div>
      )}
      
      {description && !trend && (
        <div className="mt-auto pt-4 border-t border-border/50">
          <span className="text-sm text-muted">{description}</span>
        </div>
      )}
    </Card>
  )
}
