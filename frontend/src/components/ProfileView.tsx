"use client"

import React from "react"
import { ShieldCheck, Key } from "lucide-react"
import { Card } from "./ui/card"

export function ProfileView() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-white to-slate-50 p-8 rounded-2xl border border-border flex items-center justify-between shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative z-10">
          <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20 shadow-sm">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            My Security Profile
          </h2>
          <p className="text-sm text-secondary font-medium mt-2">
            User profile data is shown only after a real identity provider is connected.
          </p>
        </div>
      </div>

      <Card className="text-center py-20 border-dashed border-2 text-xs text-secondary font-bold uppercase tracking-widest">
        <Key className="w-10 h-10 text-muted mx-auto mb-4" />
        No authenticated profile is available.
      </Card>
    </div>
  )
}
