"use client"

import { Card } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"
import { motion } from "framer-motion"
import { TrendingUp, TrendingDown } from "lucide-react"

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
  highlight?: boolean
}

export function MetricCard({ title, value, description, icon: Icon, trend, highlight }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className={`flex flex-col h-full relative overflow-hidden group ${highlight ? 'border-primary/30 bg-primary/5' : 'bg-white'}`}>
        {/* Soft background gradient on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        <div className="flex justify-between items-start mb-3 relative z-10">
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] uppercase tracking-widest text-secondary font-bold truncate">{title}</span>
            <span className="text-3xl font-black text-foreground mt-2 truncate tracking-tight">{value}</span>
          </div>
          <div className={`p-3 rounded-2xl border shrink-0 ml-2 shadow-sm transition-all duration-300 group-hover:scale-110 ${highlight ? 'bg-primary border-primary text-white shadow-primary/20' : 'bg-slate-50 border-border text-primary'}`}>
            <Icon className={`w-5 h-5 ${highlight ? 'text-white' : 'text-primary'}`} />
          </div>
        </div>

        {trend && (
          <div className="flex items-center mt-auto pt-4 border-t border-border/60 gap-2 relative z-10">
            <div className={`p-1 rounded-full ${trend.isPositive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
              {trend.isPositive ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
            </div>
            <span className={`text-sm font-bold ${trend.isPositive ? 'text-success' : 'text-destructive'}`}>
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
            <span className="text-xs text-muted font-semibold truncate">{trend.label}</span>
          </div>
        )}

        {description && !trend && (
          <div className="mt-auto pt-4 border-t border-border/60 relative z-10">
            <span className="text-[11px] text-muted font-medium leading-relaxed line-clamp-2">{description}</span>
          </div>
        )}
      </Card>
    </motion.div>
  )
}

