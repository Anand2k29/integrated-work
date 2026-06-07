"use client"

import React, { useState, useEffect } from "react"
import { Key, ShieldAlert, CheckCircle, AlertCircle, Cpu, FileJson, Sparkles, ShieldCheck, AlertTriangle, RefreshCw } from "lucide-react"
import { Card } from "./ui/card"
import { apiService, JWTAnalysisResult } from "@/lib/api"

export function JwtView() {
  const [tokenInput, setTokenInput] = useState(
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMTAwMiIsImVtYWlsIjoiYWRtaW5AZW50ZXJwcmlzZS5jb20iLCJyb2xlIjoiYWRtaW4iLCJ0ZW5hbnRfaWQiOiJ0ZW5fMDAxNCIsImV4cCI6MTgwMTI4NDAwMH0.dummysig"
  )
  const [result, setResult] = useState<JWTAnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)

  // Run analysis when token changes
  const runAnalysis = async () => {
    if (!tokenInput.trim()) return
    setLoading(true)
    try {
      const res = await apiService.analyzeJWT(tokenInput)
      setResult(res)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runAnalysis()
  }, [tokenInput])

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-white to-slate-50 p-8 rounded-2xl border border-border flex items-center justify-between shadow-sm relative overflow-hidden">
        {/* Soft decorative gradient */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3"></div>

        <div className="relative z-10">
          <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20 shadow-sm">
              <Key className="w-6 h-6 text-primary" />
            </div>
            JWT Vulnerability Analysis
          </h2>
          <p className="text-sm text-secondary font-medium mt-2">
            Decode tokens to audit cryptographic headers, signatures, permissions matrix, and tenant bindings.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Token Paste Card */}
        <Card className="md:col-span-1 h-full flex flex-col">
          <h3 className="font-extrabold text-foreground text-sm flex items-center gap-2 mb-6 border-b border-border/60 pb-4 uppercase tracking-wide">
            <FileJson className="w-4 h-4 text-primary" />
            Paste JWT Token
          </h3>

          <div className="space-y-3 flex-1 flex flex-col">
            <label className="text-[11px] font-bold text-secondary uppercase tracking-widest block">Base64 Encoded Token</label>
            <textarea
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="eyJhbGciOi..."
              className="flex-1 w-full p-4 border border-border/80 rounded-xl bg-slate-50 font-mono text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-inner resize-none min-h-[200px]"
            />
          </div>

          <div className="mt-6 pt-5 border-t border-border/60 flex justify-between items-center text-xs">
            <span className="text-secondary font-bold text-[10px] uppercase tracking-widest flex items-center gap-1.5"><Sparkles className="w-3 h-3 text-info" /> Decodes automatically</span>
            <button
              onClick={runAnalysis}
              disabled={loading}
              className="bg-white border border-border/80 hover:border-primary/30 hover:bg-slate-50 text-foreground font-bold px-4 py-2 rounded-lg cursor-pointer transition-all shadow-sm flex items-center gap-2 group disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-primary ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
              Re-Audit
            </button>
          </div>
        </Card>

        {/* Decoder split view */}
        <Card className="md:col-span-2 h-full flex flex-col">
          <h3 className="font-extrabold text-foreground text-sm flex items-center gap-2 mb-6 border-b border-border/60 pb-4 uppercase tracking-wide">
            <Cpu className="w-4 h-4 text-secondary" />
            Decoded Claims
          </h3>

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4">
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
              <div className="text-xs text-secondary font-bold uppercase tracking-widest animate-pulse">Running cryptographic inspection...</div>
            </div>
          ) : result ? (
            <div className="grid md:grid-cols-2 gap-6 text-xs font-semibold flex-1">
              {/* Header */}
              <div className="space-y-3 flex flex-col h-full">
                <span className="text-info font-bold uppercase tracking-widest text-[10px] flex items-center gap-1.5 bg-info/10 border border-info/20 px-3 py-1.5 rounded-lg w-fit">
                  HEADER: Algorithm & Type
                </span>
                <pre className="flex-1 bg-[#0A0F1C] border border-slate-800 p-5 rounded-2xl font-mono text-[11px] text-info whitespace-pre overflow-x-auto shadow-inner custom-scrollbar min-h-[160px]">
                  {JSON.stringify(result.header, null, 2)}
                </pre>
              </div>

              {/* Payload */}
              <div className="space-y-3 flex flex-col h-full">
                <span className="text-warning font-bold uppercase tracking-widest text-[10px] flex items-center gap-1.5 bg-warning/10 border border-warning/20 px-3 py-1.5 rounded-lg w-fit">
                  PAYLOAD: Identity & Claims
                </span>
                <pre className="flex-1 bg-[#0A0F1C] border border-slate-800 p-5 rounded-2xl font-mono text-[11px] text-warning whitespace-pre overflow-x-auto shadow-inner custom-scrollbar min-h-[160px]">
                  {JSON.stringify(result.payload, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-secondary p-8 bg-slate-50 border border-dashed border-border/80 rounded-2xl">
              <Key className="w-8 h-8 text-muted mb-3" />
              <span className="text-xs font-bold uppercase tracking-widest">Paste a token to inspect elements.</span>
            </div>
          )}
        </Card>
      </div>

      {/* Security Analysis Vulnerabilities block */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Risk Score */}
        <Card className="md:col-span-1 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-foreground text-sm flex items-center gap-2 mb-6 border-b border-border/60 pb-4 uppercase tracking-wide">
              <ShieldAlert className="w-4 h-4 text-primary" />
              Token Security Score
            </h3>

            {result && (
              <div className="text-center py-8 space-y-4 bg-gradient-to-br from-slate-50 to-white border border-border/60 rounded-2xl shadow-inner">
                <div className="relative inline-flex items-center justify-center w-32 h-32">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="64" cy="64" r="56" className="text-slate-100" strokeWidth="12" fill="none" stroke="currentColor" />
                    <circle cx="64" cy="64" r="56" className={`${result.risk_score > 70 ? 'text-destructive' : result.risk_score > 30 ? 'text-warning' : 'text-success'}`} strokeWidth="12" fill="none" stroke="currentColor" strokeDasharray={`${(result.risk_score / 100) * 351} 351`} />
                  </svg>
                  <span className="absolute text-4xl font-black text-foreground">{result.risk_score}</span>
                </div>
                <span className="block text-[10px] uppercase tracking-widest font-bold text-secondary">Risk Assessment Rating</span>
                <div className="pt-2">
                  <span className={`inline-block px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm border ${
                    result.risk_score > 70 ? 'bg-destructive/10 text-destructive border-destructive/20' :
                    result.risk_score > 30 ? 'bg-warning/10 text-warning border-warning/20' :
                    'bg-success/10 text-success border-success/20'
                  }`}>
                    {result.risk_score > 70 ? 'HIGH RISK' : result.risk_score > 30 ? 'MEDIUM RISK' : 'SECURE CONFIG'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Vulnerability Listings */}
        <Card className="md:col-span-2 flex flex-col">
          <h3 className="font-extrabold text-foreground text-sm flex items-center gap-2 mb-6 border-b border-border/60 pb-4 uppercase tracking-wide">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            Detected Token Vulnerabilities
          </h3>

          <div className="space-y-4 flex-1">
            {result?.vulnerabilities && result.vulnerabilities.length > 0 ? (
              result.vulnerabilities.map((vuln, idx) => (
                <div key={idx} className="p-5 bg-white border border-border/80 hover:border-destructive/30 rounded-2xl flex justify-between gap-6 shadow-sm transition-all glow-hover group">
                  <div className="space-y-2">
                    <span className="font-black text-foreground text-sm tracking-tight group-hover:text-destructive transition-colors">{vuln.type}</span>
                    <p className="text-secondary text-xs font-medium leading-relaxed">{vuln.description}</p>
                    <div className="pt-2 flex items-center gap-2 bg-slate-50/50 p-3 rounded-xl border border-border/40 mt-3">
                      <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">Remediation:</span>
                      <span className="text-xs text-primary font-bold">{vuln.remediation}</span>
                    </div>
                  </div>
                  <span className={`text-[10px] px-3 py-1.5 rounded-lg font-black uppercase tracking-widest shadow-sm border h-fit shrink-0 ${
                    vuln.severity === 'CRITICAL' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                    vuln.severity === 'HIGH' ? 'bg-warning/10 text-warning border-warning/20' : 'bg-info/10 text-info border-info/20'
                  }`}>
                    {vuln.severity}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-10 bg-slate-50 border border-dashed border-border/80 rounded-2xl text-center flex flex-col items-center justify-center h-full">
                <div className="p-4 bg-success/10 rounded-full mb-4">
                  <ShieldCheck className="w-10 h-10 text-success" />
                </div>
                <span className="font-extrabold text-foreground text-sm mb-1">No critical flaws detected.</span>
                <span className="text-xs text-secondary font-medium">Header uses strong signatures, validation exp checks are complete.</span>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
