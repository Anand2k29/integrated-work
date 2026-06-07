"use client"

import React, { useState } from "react"
import { Sparkles, ArrowRight, ShieldAlert, CheckCircle, HelpCircle, FileText, Split, AlertTriangle } from "lucide-react"
import { Card } from "./ui/card"
import { apiService, DiffResult } from "@/lib/api"

export function DiffEngineView() {
  const [statusA, setStatusA] = useState(200)
  const [bodyA, setBodyA] = useState(
    JSON.stringify({ id: "usr_1002", email: "admin@enterprise.com", role: "administrator", active: true, balance: 1450.00 }, null, 2)
  )

  const [statusB, setStatusB] = useState(200)
  const [bodyB, setBodyB] = useState(
    JSON.stringify({ id: "usr_1002", email: "admin@enterprise.com", role: "administrator", active: true, balance: 1450.00 }, null, 2)
  )

  const [diffResult, setDiffResult] = useState<DiffResult | null>(null)
  const [loading, setLoading] = useState(false)

  const handleRunDiff = async () => {
    setLoading(true)
    try {
      const res = await apiService.runDiff(
        { status_code: statusA, body: bodyA },
        { status_code: statusB, body: bodyB }
      )
      setDiffResult(res)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Pre-populate BOLA vulnerability case
  const loadBolaCase = () => {
    setStatusA(200)
    setBodyA(JSON.stringify({ id: "usr_1002", email: "admin@enterprise.com", balance: 5000.00 }, null, 2))
    
    setStatusB(200) // Vulnerable - swapped context but still got 200 with matching private fields
    setBodyB(JSON.stringify({ id: "usr_1002", email: "admin@enterprise.com", balance: 5000.00 }, null, 2))
    setDiffResult(null)
  }

  // Pre-populate secure case
  const loadSecureCase = () => {
    setStatusA(200)
    setBodyA(JSON.stringify({ id: "usr_1002", email: "admin@enterprise.com", balance: 5000.00 }, null, 2))
    
    setStatusB(403) // Secure - context swap gets blocked correctly
    setBodyB(JSON.stringify({ error: "Access Denied", code: "AUTH_ERR_01" }, null, 2))
    setDiffResult(null)
  }

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-white to-slate-50 p-8 rounded-2xl border border-border flex items-center justify-between shadow-sm relative overflow-hidden">
        {/* Soft decorative gradient */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3"></div>

        <div className="relative z-10">
          <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20 shadow-sm">
              <Split className="w-6 h-6 text-primary" />
            </div>
            Response Diff & Leakage Engine
          </h2>
          <p className="text-sm text-secondary font-medium mt-2">
            Compare response body payloads side-by-side to find metadata leaks and BOLA indicators.
          </p>
        </div>

        <div className="flex gap-3 relative z-10">
          <button
            onClick={loadBolaCase}
            className="text-[10px] bg-red-50 hover:bg-red-100/80 text-red-700 px-4 py-2.5 border border-red-200 rounded-xl font-extrabold tracking-wider uppercase transition-all cursor-pointer shadow-sm"
          >
            Load BOLA Case
          </button>
          <button
            onClick={loadSecureCase}
            className="text-[10px] bg-green-50 hover:bg-green-100/80 text-green-700 px-4 py-2.5 border border-green-200 rounded-xl font-extrabold tracking-wider uppercase transition-all cursor-pointer shadow-sm"
          >
            Load Secure Case
          </button>
        </div>
      </div>

      {/* Split view inputs */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Request A */}
        <Card className="space-y-4">
          <div className="flex justify-between items-center border-b border-border/60 pb-4">
            <h3 className="font-extrabold text-foreground text-sm flex items-center gap-2 uppercase tracking-wide">
              <FileText className="w-4 h-4 text-primary" />
              Response A (High Privilege User)
            </h3>
            <div className="flex items-center gap-2.5 text-xs font-bold">
              <span className="text-secondary">Status:</span>
              <input
                type="number"
                value={statusA}
                onChange={(e) => setStatusA(parseInt(e.target.value))}
                className="w-16 p-1.5 border border-border/80 rounded-xl bg-slate-50 font-mono text-xs text-center focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-black text-foreground"
              />
            </div>
          </div>

          <textarea
            rows={10}
            value={bodyA}
            onChange={(e) => setBodyA(e.target.value)}
            className="w-full p-4 border border-border/80 rounded-2xl bg-slate-50 font-mono text-[11px] focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-inner leading-relaxed resize-none"
          />
        </Card>

        {/* Request B */}
        <Card className="space-y-4">
          <div className="flex justify-between items-center border-b border-border/60 pb-4">
            <h3 className="font-extrabold text-foreground text-sm flex items-center gap-2 uppercase tracking-wide">
              <FileText className="w-4 h-4 text-secondary" />
              Response B (Low Privilege User)
            </h3>
            <div className="flex items-center gap-2.5 text-xs font-bold">
              <span className="text-secondary">Status:</span>
              <input
                type="number"
                value={statusB}
                onChange={(e) => setStatusB(parseInt(e.target.value))}
                className="w-16 p-1.5 border border-border/80 rounded-xl bg-slate-50 font-mono text-xs text-center focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-black text-foreground"
              />
            </div>
          </div>

          <textarea
            rows={10}
            value={bodyB}
            onChange={(e) => setBodyB(e.target.value)}
            className="w-full p-4 border border-border/80 rounded-2xl bg-slate-50 font-mono text-[11px] focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-inner leading-relaxed resize-none"
          />
        </Card>
      </div>

      {/* Button to run */}
      <div className="flex justify-center">
        <button
          onClick={handleRunDiff}
          disabled={loading}
          className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-8 py-3.5 rounded-xl transition-all shadow-md shadow-primary/10 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
        >
          {loading ? "Calculating Diff Metrics..." : "Run Diff Audit"}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Diff Results Output */}
      {diffResult && (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Risk Card */}
          <Card className="md:col-span-1 flex flex-col justify-between">
            <div>
              <h3 className="font-extrabold text-foreground text-sm flex items-center gap-2 mb-6 border-b border-border/60 pb-4 uppercase tracking-wide">
                <ShieldAlert className="w-4 h-4 text-primary" />
                Diff Assessment
              </h3>

              <div className="text-center py-6 space-y-3 bg-gradient-to-br from-slate-50 to-white border border-border/60 rounded-2xl shadow-inner">
                <span className="text-5xl font-black text-foreground block">{diffResult.risk_score}</span>
                <span className="block text-[10px] uppercase tracking-widest font-bold text-secondary">Vulnerability Score</span>
                <div className="pt-2">
                  <span className={`inline-block px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${
                    diffResult.leak_detected ? 'bg-destructive/10 text-destructive border-destructive/20 animate-pulse' : 'bg-success/10 text-success border-success/20'
                  }`}>
                    {diffResult.leak_detected ? 'CRITICAL LEAK' : 'AUTHORIZATION SECURE'}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Details & Explanations */}
          <Card className="md:col-span-2 flex flex-col justify-between">
            <div>
              <h3 className="font-extrabold text-foreground text-sm flex items-center gap-2 mb-6 border-b border-border/60 pb-4 uppercase tracking-wide">
                <Sparkles className="w-4 h-4 text-primary" />
                Copilot Diff Analysis
              </h3>

              <div className="space-y-4 text-xs font-semibold">
                <div className="flex flex-wrap items-center gap-4 bg-slate-50 border border-border/55 p-4 rounded-2xl shadow-inner">
                  <div className="flex items-center gap-1.5">
                    <span className="text-secondary block text-[10px] uppercase font-bold tracking-wider">Status A:</span>
                    <span className="text-foreground text-xs font-black">{diffResult.status_a}</span>
                  </div>
                  <div className="flex items-center gap-1.5 border-l border-border pl-4">
                    <span className="text-secondary block text-[10px] uppercase font-bold tracking-wider">Status B:</span>
                    <span className="text-foreground text-xs font-black">{diffResult.status_b}</span>
                  </div>
                  <div className="flex items-center gap-1.5 border-l border-border pl-4">
                    <span className="text-secondary block text-[10px] uppercase font-bold tracking-wider">Status Differs:</span>
                    <span className={`text-xs font-black uppercase tracking-wider ${diffResult.status_differs ? "text-success" : "text-destructive"}`}>
                      {diffResult.status_differs ? "Yes (Secure)" : "No (Warning)"}
                    </span>
                  </div>
                </div>

                {diffResult.leak_detected && (
                  <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl flex items-start gap-3 shadow-sm">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="font-black text-sm block leading-none">{diffResult.leak_type}</span>
                      <p className="text-[11px] text-destructive/80 font-semibold leading-relaxed">Request B (viewer role) fetched matching sensitive data keys as Request A (admin). BOLA vulnerability confirmed.</p>
                    </div>
                  </div>
                )}

                <div className="bg-slate-50 border border-border/55 p-4 rounded-2xl shadow-inner space-y-1">
                  <span className="text-[9px] font-bold text-secondary uppercase tracking-widest block">AI Explanation</span>
                  <p className="text-foreground text-[11px] font-semibold leading-relaxed">{diffResult.explanation}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
