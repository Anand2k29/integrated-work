"use client"

import React, { useState, useEffect } from "react"
import { Shield, FileText, Download, AlertTriangle, CheckCircle, ExternalLink, RefreshCw } from "lucide-react"
import { Card } from "./ui/card"
import { apiService, Scan } from "@/lib/api"

interface ReportsViewProps {
  activeScan: Scan | null;
}

export function ReportsView({ activeScan }: ReportsViewProps) {
  const [report, setReport] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeIssue, setActiveIssue] = useState<any | null>(null)

  const fetchReport = async () => {
    if (!activeScan) return
    setLoading(true)
    try {
      const res = await apiService.getReport(activeScan.id)
      setReport(res)
      if (res?.vulnerabilities && res.vulnerabilities.length > 0) {
        setActiveIssue(res.vulnerabilities[0])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [activeScan])

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-white to-slate-50 p-8 rounded-2xl border border-border flex items-center justify-between shadow-sm relative overflow-hidden">
        {/* Soft decorative gradient */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3"></div>

        <div className="relative z-10">
          <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20 shadow-sm">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            TLL-Alpha Security Reports
          </h2>
          <p className="text-sm text-secondary font-medium mt-2">
            Generate and view automated vulnerability findings for API authorization and access control assessments.
          </p>
        </div>

        <div className="flex gap-3 relative z-10">
          <button
            onClick={fetchReport}
            disabled={loading}
            className="bg-white border border-border hover:border-primary/55 text-foreground text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-primary ${loading ? 'animate-spin' : ''}`} />
            Regenerate Report
          </button>
          <button
            className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-md shadow-primary/10"
          >
            <Download className="w-3.5 h-3.5" />
            Export PDF
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
          <div className="text-xs text-secondary font-bold uppercase tracking-widest animate-pulse">Running security analysis & generating report...</div>
        </div>
      ) : report ? (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Findings List */}
          <Card className="md:col-span-1 flex flex-col justify-between">
            <div>
              <h3 className="font-extrabold text-foreground text-sm flex items-center gap-2 mb-6 border-b border-border/60 pb-4 uppercase tracking-wide">
                <FileText className="w-4 h-4 text-primary" />
                Identified Vulnerabilities
              </h3>

              <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1.5 custom-scrollbar">
                {report.vulnerabilities.map((vuln: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setActiveIssue(vuln)}
                    className={`w-full text-left p-4 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-sm ${
                      activeIssue?.id === vuln.id
                        ? 'bg-primary/5 border-primary/25 text-primary'
                        : 'bg-slate-50 border-border/60 hover:bg-slate-100/50 text-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="font-mono text-[10px] text-secondary/70">{vuln.id}</span>
                      <span className={`text-[8px] px-2 py-0.5 rounded font-black uppercase border ${
                        vuln.severity === 'CRITICAL' ? 'bg-red-100 text-red-700 border-red-200' :
                        vuln.severity === 'HIGH' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-blue-100 text-blue-700 border-blue-200'
                      }`}>
                        {vuln.severity}
                      </span>
                    </div>
                    <h4 className="font-black truncate text-foreground text-sm tracking-tight mb-2">{vuln.title}</h4>
                    <div className="flex items-center gap-1.5 text-[9px] text-secondary mt-1 font-mono">
                      <span className="bg-white border border-border/50 px-1.5 py-0.5 rounded text-[8px] font-black">{vuln.method}</span>
                      <span className="truncate">{vuln.path}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Finding Details */}
          <Card className="md:col-span-2 flex flex-col justify-between">
            {activeIssue ? (
              <div className="space-y-5 text-xs font-medium leading-relaxed">
                <div className="flex justify-between items-start border-b border-border/60 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] bg-slate-100 border border-border px-2 py-0.5 rounded-lg text-secondary/70 font-bold">{activeIssue.id}</span>
                      <span className={`text-[9px] px-2.5 py-1 rounded-xl font-black uppercase border shadow-sm ${
                        activeIssue.severity === 'CRITICAL' ? 'bg-red-100 text-red-700 border-red-200' :
                        activeIssue.severity === 'HIGH' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-blue-100 text-blue-700 border-blue-200'
                      }`}>
                        {activeIssue.severity} (CVSS {activeIssue.cvss})
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-foreground tracking-tight pt-1">{activeIssue.title}</h3>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 bg-slate-50 border border-border/60 p-4 rounded-2xl shadow-inner text-[11px] font-semibold">
                  <div>
                    <span className="text-secondary block text-[9px] font-bold uppercase tracking-widest">Endpoint Path</span>
                    <span className="font-mono font-black text-foreground block truncate mt-1">{activeIssue.path}</span>
                  </div>
                  <div>
                    <span className="text-secondary block text-[9px] font-bold uppercase tracking-widest">HTTP Method</span>
                    <span className="font-mono font-black text-foreground block mt-1">{activeIssue.method}</span>
                  </div>
                  <div>
                    <span className="text-secondary block text-[9px] font-bold uppercase tracking-widest">Impact Level</span>
                    <span className="font-black text-destructive block mt-1">{activeIssue.impact}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-secondary font-bold uppercase tracking-wider text-[9px]">Description & Evidence</span>
                  <p className="text-foreground text-xs font-semibold leading-relaxed bg-slate-50 border border-border/50 p-4 rounded-2xl shadow-inner">
                    {activeIssue.description}
                  </p>
                </div>

                <div className="space-y-2">
                  <span className="text-primary font-bold uppercase tracking-wider text-[9px] flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    Remediation blueprint
                  </span>
                  <p className="text-secondary text-xs font-semibold leading-relaxed bg-primary/5 border border-primary/10 p-4 rounded-2xl shadow-inner">
                    {activeIssue.remediation}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-xs text-secondary font-bold uppercase tracking-widest">Select an issue from the sidebar to inspect parameters.</div>
            )}
          </Card>
        </div>
      ) : (
        <Card className="text-center py-16 text-xs text-secondary flex flex-col items-center justify-center border-dashed border-2">
          <AlertTriangle className="w-10 h-10 text-amber-500 mb-3" />
          <span className="font-extrabold text-foreground text-sm">No active reports generated.</span>
          <span className="text-xs mt-1 font-semibold">Select a valid target or create a scan first.</span>
        </Card>
      )}
    </div>
  )
}
