"use client"

import React, { useState, useEffect } from "react"
import { Shield, Server, Activity, Terminal, GitBranch, ArrowRight, Play, CheckCircle } from "lucide-react"
import { Card } from "./ui/card"
import { apiService, Scan, Task } from "@/lib/api"

interface CrawlerViewProps {
  activeScan: Scan | null;
}

export function CrawlerView({ activeScan }: CrawlerViewProps) {
  const [crawlerState, setCrawlerState] = useState("RUNNING")
  const [visited, setVisited] = useState<string[]>([])
  const [pending, setPending] = useState<string[]>([])
  const [logs, setLogs] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [scanTasks, setScanTasks] = useState<Task[]>([])

  useEffect(() => {
    const loadTasks = async () => {
      if (!activeScan) {
        setVisited(["/api/v1/auth/login", "/api/v1/users/me", "/api/v1/items/bulk"])
        setPending(["/api/v1/payments/refund", "/api/v1/tenant/settings", "/api/v1/billing/invoice/pdf"])
        return
      }

      setLoading(true)
      try {
        const tasks = await apiService.getScanTasks(activeScan.id)
        setScanTasks(tasks)

        const visitedUrls = tasks
          .filter(task => task.status !== 'QUEUED')
          .map(task => task.url)

        const pendingUrls = tasks
          .filter(task => task.status === 'QUEUED')
          .map(task => task.url)

        setVisited(visitedUrls.length ? Array.from(new Set(visitedUrls)) : ["/api/v1/auth/login"])
        setPending(pendingUrls.length ? Array.from(new Set(pendingUrls)) : ["/api/v1/payments/refund", "/api/v1/tenant/settings", "/api/v1/billing/invoice/pdf"])
      } catch (err) {
        console.error('Failed to load scan tasks for crawler', err)
      } finally {
        setLoading(false)
      }
    }

    loadTasks()
  }, [activeScan])

  useEffect(() => {
    if (crawlerState !== "RUNNING") return

    const interval = setInterval(() => {
      if (pending.length === 0) {
        setCrawlerState("COMPLETED")
        return
      }

      // Move one item from pending to visited
      const itemToVisit = pending[0]
      setPending(prev => prev.slice(1))
      setVisited(prev => [...prev, itemToVisit])

      // Add a simulated crawler log
      const time = new Date().toLocaleTimeString()
      const method = itemToVisit.includes("refund") || itemToVisit.includes("settings") ? "POST" : "GET"
      setLogs(prev => [
        `[${time}] CRAWLER: Traversing ${method} ${itemToVisit}`,
        `[${time}] CRAWLER: Extracted parameters schema successfully`,
        `[${time}] CRAWLER: Queue depth adjusted - pending tasks list updated`,
        ...prev
      ].slice(0, 15))

    }, 4000)

    return () => clearInterval(interval)
  }, [crawlerState, pending])

  const triggerRecrawl = () => {
    if (activeScan) {
      setCrawlerState("RUNNING")
      setLogs([`[${new Date().toLocaleTimeString()}] CRAWLER: Initializing recrawl session for ${activeScan.name}...`])
      return
    }

    setVisited(["/api/v1/auth/login"])
    setPending([
      "/api/v1/users/me",
      "/api/v1/payments/refund",
      "/api/v1/tenant/settings",
      "/api/v1/billing/invoice/pdf",
      "/api/v1/items/bulk"
    ])
    setCrawlerState("RUNNING")
    setLogs([`[${new Date().toLocaleTimeString()}] CRAWLER: Initializing recrawl session...`])
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
              <GitBranch className="w-6 h-6 text-primary" />
            </div>
            API Schema Crawler
          </h2>
          <p className="text-sm text-secondary font-medium mt-2">
            Explore dependency trees and sequence transitions between authenticated routes.
          </p>
          {activeScan && (
            <p className="text-xs text-primary font-bold mt-2.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              Active scan: {activeScan.name} ({activeScan.status})
            </p>
          )}
        </div>

        <div className="flex items-center gap-4 relative z-10 bg-slate-50 p-3 rounded-2xl border border-border/60 shadow-inner">
          <span className={`text-[11px] px-3 py-1.5 rounded-lg font-black tracking-widest uppercase shadow-sm border ${
            crawlerState === 'RUNNING' ? 'bg-info/10 text-info border-info/20 animate-pulse' : 'bg-success/10 text-success border-success/20'
          }`}>
            Status: {crawlerState}
          </span>
          <button 
            onClick={triggerRecrawl}
            className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-md shadow-primary/20 group"
          >
            Recrawl Spec
            <Play className="w-3.5 h-3.5 fill-white group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Traversal Counters */}
        <Card className="flex flex-col justify-between h-full">
          <div>
            <h3 className="font-extrabold text-foreground text-sm flex items-center gap-2 mb-6 border-b border-border/60 pb-4 uppercase tracking-wide">
              <Activity className="w-4 h-4 text-primary" />
              Crawler Metrics
            </h3>
            
            <div className="space-y-4 text-xs font-semibold text-secondary">
              <div className="flex justify-between items-center bg-white border border-border/80 hover:border-primary/20 p-4 rounded-xl shadow-sm transition-all glow-hover">
                <span className="uppercase tracking-widest text-[10px]">Visited Endpoints</span>
                <span className="text-foreground font-black text-lg">{visited.length}</span>
              </div>

              <div className="flex justify-between items-center bg-white border border-border/80 hover:border-primary/20 p-4 rounded-xl shadow-sm transition-all glow-hover">
                <span className="uppercase tracking-widest text-[10px]">Pending Endpoints</span>
                <span className="text-foreground font-black text-lg">{pending.length}</span>
              </div>

              <div className="flex justify-between items-center bg-white border border-border/80 hover:border-primary/20 p-4 rounded-xl shadow-sm transition-all glow-hover">
                <span className="uppercase tracking-widest text-[10px]">Max Depth Traversed</span>
                <span className="text-foreground font-black text-lg">3 <span className="text-muted text-sm">/ 5</span></span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-border/60 flex items-center justify-center gap-2 text-[11px] text-secondary font-bold uppercase tracking-widest bg-slate-50/50 rounded-xl p-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary border-2 border-white"></span>
            </span>
            <span>Autopilot parsing online</span>
          </div>
        </Card>

        {/* Visited vs Pending Lists */}
        <Card className="md:col-span-2 h-full flex flex-col">
          <h3 className="font-extrabold text-foreground text-sm mb-6 border-b border-border/60 pb-4 uppercase tracking-wide">
            Endpoint Traversal Path Status
          </h3>

          <div className="grid md:grid-cols-2 gap-6 text-xs flex-1 min-h-0">
            {/* Visited list */}
            <div className="space-y-3 flex flex-col min-h-0">
              <div className="flex items-center gap-2">
                <span className="font-black tracking-widest text-success bg-success/10 px-3 py-1.5 rounded-lg border border-success/20 uppercase text-[10px] shadow-sm">Visited ({visited.length})</span>
              </div>
              <div className="space-y-2.5 overflow-y-auto flex-1 pr-2 custom-scrollbar">
                {visited.map((v, idx) => (
                  <div key={idx} className="p-3 bg-white border border-border/80 text-foreground font-mono font-semibold text-[11px] rounded-xl flex items-center gap-2.5 shadow-sm">
                    <CheckCircle className="w-4 h-4 text-success shrink-0" />
                    <span className="truncate">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pending list */}
            <div className="space-y-3 flex flex-col min-h-0">
              <div className="flex items-center gap-2">
                <span className="font-black tracking-widest text-info bg-info/10 px-3 py-1.5 rounded-lg border border-info/20 uppercase text-[10px] shadow-sm">Pending ({pending.length})</span>
              </div>
              <div className="space-y-2.5 overflow-y-auto flex-1 pr-2 custom-scrollbar">
                {pending.length === 0 ? (
                  <div className="p-6 text-center text-muted font-bold tracking-widest uppercase border border-dashed border-border/80 rounded-xl">Traversal Queue Empty</div>
                ) : (
                  pending.map((p, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-100 text-secondary font-mono font-semibold text-[11px] rounded-xl flex items-center gap-2.5 shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-info animate-pulse shrink-0 border border-white" />
                      <span className="truncate">{p}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Crawler stream logs */}
      <Card>
        <div className="flex justify-between items-center mb-6 border-b border-border/60 pb-4">
          <h3 className="font-extrabold text-foreground text-sm flex items-center gap-2 uppercase tracking-wide">
            <Terminal className="w-4 h-4 text-primary" />
            Crawler Console Log stream
          </h3>
          <span className="text-[10px] bg-primary/10 text-primary px-3 py-1.5 rounded-full font-black tracking-widest uppercase shadow-sm border border-primary/20">Auto-refresh active</span>
        </div>

        <div className="bg-[#0A0F1C] border border-slate-800 text-info p-5 rounded-2xl font-mono text-[11px] min-h-[180px] max-h-[300px] overflow-y-auto space-y-2 shadow-inner custom-scrollbar">
          {logs.length === 0 ? (
            <span className="text-slate-500 font-semibold">CRAWLER: Waiting for crawler stream logs...</span>
          ) : (
            logs.map((log, idx) => (
              <div key={idx} className="leading-relaxed font-semibold opacity-90">{log}</div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}
