"use client"

import React, { useState } from "react"
import { Shield, Key, Mail, Lock, ArrowRight, AlertCircle } from "lucide-react"

interface LoginProps {
  onLoginSuccess: () => void;
  onCancel: () => void;
}

export function Login({ onLoginSuccess, onCancel }: LoginProps) {
  const [email, setEmail] = useState("admin@enterprise.com")
  const [password, setPassword] = useState("••••••••")
  const [apiKey, setApiKey] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    setTimeout(() => {
      setLoading(false)
      onLoginSuccess()
    }, 800)
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground flex items-center justify-center p-6 tech-grid">
      <div className="w-full max-w-md glass-panel rounded-3xl p-8.5 space-y-6.5 relative overflow-hidden">
        {/* Top brand */}
        <div className="flex flex-col items-center text-center space-y-2.5">
          <div className="bg-primary/10 p-3.5 rounded-2xl border border-primary/20 shadow-sm">
            <Shield className="w-8 h-8 text-primary animate-pulse" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-foreground">Sign in to console</h2>
          <p className="text-sm text-secondary font-medium">Access your enterprise API testing workspace</p>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs p-3.5 rounded-xl flex items-center gap-2 font-black uppercase tracking-wider">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-secondary block">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-secondary/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-border/80 bg-slate-50 text-foreground font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-inner text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold uppercase tracking-widest text-secondary">Password</label>
              <a href="#" className="text-xs text-primary hover:underline font-bold">Forgot?</a>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-secondary/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-border/80 bg-slate-50 text-foreground font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-inner text-sm"
              />
            </div>
          </div>

          <div className="border-t border-border/60 my-2 pt-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-widest text-secondary">API Key / Token (Optional)</label>
                <span className="text-[9px] bg-slate-100 border border-border/50 px-2 py-0.5 rounded-lg font-black text-secondary shadow-sm uppercase tracking-wide">Bypasses Login</span>
              </div>
              <div className="relative">
                <Key className="w-4 h-4 text-secondary/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="tl_live_xxxxxxxxxxxxxxxx"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-border/80 bg-slate-50 text-foreground font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-inner text-sm"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 flex items-center gap-3.5">
            <button
              type="button"
              onClick={onCancel}
              className="w-1/3 py-3.5 border border-border text-secondary hover:bg-slate-50 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm uppercase tracking-wider"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold shadow-md shadow-primary/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 uppercase tracking-wider"
            >
              {loading ? "Decrypting profile..." : "Enter Workspace"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Branding decoration */}
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none"></div>
      </div>
    </div>
  )
}
