"use client"

import React from "react"
import { LucideIcon } from "lucide-react"
import { Card } from "./ui/card"

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon: LucideIcon;
}

export function EmptyState({ title, description, actionLabel, onAction, icon: Icon }: EmptyStateProps) {
  return (
    <Card className="text-center py-16 px-6 border-dashed border-2 flex flex-col items-center justify-center space-y-4 max-w-lg mx-auto bg-slate-50/35 border-slate-200">
      <div className="p-4 bg-primary/10 rounded-full border border-primary/20 shadow-inner">
        <Icon className="w-10 h-10 text-primary" />
      </div>
      <div className="space-y-1">
        <h3 className="font-extrabold text-foreground text-sm tracking-wide uppercase">{title}</h3>
        <p className="text-xs text-secondary font-medium leading-relaxed max-w-sm mx-auto">{description}</p>
      </div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-all cursor-pointer shadow-md shadow-primary/15"
        >
          {actionLabel}
        </button>
      )}
    </Card>
  )
}
