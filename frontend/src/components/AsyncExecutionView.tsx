"use client"

import React, { useState, useEffect } from "react"
import { Server, Activity, ArrowRight, Play, Square, Settings, Database, Cpu, Plus, Minus, Terminal } from "lucide-react"
import { Card } from "./ui/card"
import { apiService, Scan, QueueStatus, WorkerStatus, ExecutionStats, ScanProgress, Task } from "@/lib/api"

interface AsyncExecutionViewProps {
  activeScan: Scan | null;
}

export function AsyncExecutionView({ activeScan }: AsyncExecutionViewProps) {
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null)
  const [workerStatus, setWorkerStatus] = useState<WorkerStatus | null>(null)
  const [execStats, setExecStats] = useState<ExecutionStats | null>(null)
  const [scanProgress, setScanProgress] = useState<ScanProgress | null>(null)
  const [scanTasks, setScanTasks] = useState<Task[]>([])
  const [concurrency, setConcurrency] = useState(10)
  const [logs, setLogs] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch queue and execution statistics
  const fetchStats = async () => {
    try {
      const qPromise = apiService.getQueueStatus()
      const wPromise = apiService.getWorkerStatus()
      const ePromise = apiService.getExecutionStats()
      
      const [qRes, wRes, eRes] = await Promise.allSettled([qPromise, wPromise, ePromise])
      
      if (qRes.status === "fulfilled") setQueueStatus(qRes.value)
      if (wRes.status === "fulfilled") setWorkerStatus(wRes.value)
      if (eRes.status === "fulfilled") setExecStats(eRes.value)

      if (activeScan) {
        const pPromise = apiService.getScanProgress(activeScan.id)
        const tPromise = apiService.getScanTasks(activeScan.id)
        
        const [pRes, tRes] = await Promise.allSettled([pPromise, tPromise])
        
        if (pRes.status === "fulfilled") setScanProgress(pRes.value)
        if (tRes.status === "fulfilled") {
          const liveTasks = tRes.value
          setScanTasks(liveTasks)
          setLogs(liveTasks.slice(-15).reverse().map(task => {
            const response = task.response
            const time = new Date(response?.created_at || task.created_at).toLocaleTimeString()
            const outcome = response?.status_code ? `HTTP ${response.status_code}` : task.status
            const error = response?.error_message ? ` - ${response.error_message}` : ""
            return `[${time}] EXECUTOR: ${task.method} ${task.url} -> ${outcome}${error}`
          }))
        }
      } else {
        setScanProgress(null)
        setScanTasks([])
        setLogs([])
      }
      setLoading(false)
    } catch (err) {
      console.error("Error fetching execution stats:", err)
    }
  }

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 3000)
    return () => clearInterval(interval)
  }, [activeScan])

  const workers = workerStatus?.workers || []

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-white to-slate-50 p-8 rounded-2xl border border-border flex items-center justify-between shadow-sm relative overflow-hidden">
        {/* Soft decorative gradient */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3"></div>

        <div className="relative z-10">
          <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20 shadow-sm">
              <Server className="w-6 h-6 text-primary" />
            </div>
            Async Scan Execution Center
          </h2>
          <p className="text-sm text-secondary font-medium mt-2">
            Orchestrate distributed workers, adjust token bucket rate limits, and inspect execution pipeline heartbeats.
          </p>
          {activeScan && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/20 text-primary font-bold text-xs rounded-lg mt-3">
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              <span>Active scan: {activeScan.name} ({activeScan.status}) • {scanTasks.length} execution tasks loaded</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <div className="flex items-center bg-white border border-border rounded-xl px-3.5 py-2 gap-2.5 text-xs shadow-sm">
            <span className="text-secondary font-bold">Max Concurrency Limit:</span>
            <button 
              onClick={() => setConcurrency(prev => Math.max(1, prev - 1))}
              className="bg-slate-50 border border-border hover:bg-slate-100 p-1.5 rounded-lg cursor-pointer transition-all shadow-sm"
            >
              <Minus className="w-3.5 h-3.5 text-secondary" />
            </button>
            <span className="font-extrabold text-foreground min-w-[20px] text-center text-sm">{concurrency}</span>
            <button 
              onClick={() => setConcurrency(prev => Math.min(50, prev + 1))}
              className="bg-slate-50 border border-border hover:bg-slate-100 p-1.5 rounded-lg cursor-pointer transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 text-secondary" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-secondary uppercase tracking-widest block">Worker utilization</span>
            <span className="text-3xl font-black text-foreground mt-2 block">
              {workerStatus ? `${workerStatus.active_workers}` : "0"}
            </span>
          </div>
          <span className="text-[10px] text-muted font-bold uppercase tracking-widest mt-4 pt-3 border-t border-border/60">Active worker heartbeats</span>
        </Card>

        <Card className="flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-secondary uppercase tracking-widest block">Scan Queue Depth</span>
            <span className="text-3xl font-black text-foreground mt-2 block">
              {loading ? "..." : `${queueStatus?.total_pending || 0} Tasks`}
            </span>
          </div>
          <span className="text-[10px] text-muted font-bold uppercase tracking-widest mt-4 pt-3 border-t border-border/60">Tasks pending execution</span>
        </Card>

        <Card className="flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-secondary uppercase tracking-widest block">Total Requests Handled</span>
            <span className="text-3xl font-black text-foreground mt-2 block">
              {loading ? "..." : `${execStats?.throughput.total_processed || 0}`}
            </span>
          </div>
          <span className="text-[10px] text-muted font-bold uppercase tracking-widest mt-4 pt-3 border-t border-border/60">Success rate: {execStats?.rates.success_rate_pct || 0}%</span>
        </Card>

        <Card className="flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-secondary uppercase tracking-widest block">Retry & Throttling Limits</span>
            <span className="text-3xl font-black text-foreground mt-2 block">
              {loading ? "..." : `${execStats?.retries_total || 0} Retries`}
            </span>
          </div>
          <span className="text-[10px] text-muted font-bold uppercase tracking-widest mt-4 pt-3 border-t border-border/60">Dead Letter queue: {queueStatus?.dead_letters || 0}</span>
        </Card>
      </div>

      {activeScan && scanProgress && (
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-extrabold text-foreground text-sm tracking-tight">Live Scan Progress</h3>
                <p className="text-xs text-secondary font-medium">Current task completion status for {activeScan.name}</p>
              </div>
              <span className="text-[10px] uppercase font-black tracking-widest text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-xl">
                {activeScan.status}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-[10px] uppercase text-secondary font-bold tracking-widest mb-2">
                  <span>Completion Percentage</span>
                  <span>{Math.round((scanProgress.completed_tasks / Math.max(scanProgress.total_tasks, 1)) * 100)}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden border border-border/55 shadow-inner">
                  <div className="h-2.5 rounded-full bg-primary transition-all duration-500" style={{ width: `${Math.round((scanProgress.completed_tasks / Math.max(scanProgress.total_tasks, 1)) * 100)}%` }} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-[10px]">
                <div className="bg-slate-50/50 p-4 rounded-xl border border-border/80 shadow-inner">
                  <span className="block text-secondary font-bold uppercase tracking-widest mb-1">Succeeded</span>
                  <span className="text-foreground font-black text-lg block">{scanProgress.detailed_stats.SUCCESS}</span>
                </div>
                <div className="bg-slate-50/50 p-4 rounded-xl border border-border/80 shadow-inner">
                  <span className="block text-secondary font-bold uppercase tracking-widest mb-1">Queued</span>
                  <span className="text-foreground font-black text-lg block">{scanProgress.detailed_stats.QUEUED}</span>
                </div>
                <div className="bg-slate-50/50 p-4 rounded-xl border border-border/80 shadow-inner">
                  <span className="block text-secondary font-bold uppercase tracking-widest mb-1">Failed</span>
                  <span className="text-destructive font-black text-lg block">{scanProgress.failed_tasks}</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="md:col-span-1 flex flex-col justify-between">
            <div>
              <h3 className="font-extrabold text-foreground text-sm tracking-tight mb-4 pb-2 border-b border-border/60">Execution Summary</h3>
              <div className="space-y-3.5 text-xs text-secondary font-semibold">
                <div className="flex justify-between">
                  <span>Total Tasks</span>
                  <span className="font-extrabold text-foreground">{scanProgress.total_tasks}</span>
                </div>
                <div className="flex justify-between">
                  <span>Retrying</span>
                  <span className="font-extrabold text-amber-600">{scanProgress.detailed_stats.RETRYING}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pending</span>
                  <span className="font-extrabold text-foreground">{scanProgress.pending_tasks}</span>
                </div>
              </div>
            </div>
            <div className="border-t border-border/60 mt-4 pt-4 text-[10px] text-secondary font-bold">
              <span className="block mb-1">Worker Health Status:</span>
              <span className="text-foreground">{workerStatus?.active_workers || 0} active workers • {workerStatus?.status ?? 'idle'}</span>
            </div>
          </Card>
        </div>
      )}

      {/* Cluster Node map grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Workers Grid */}
        <Card className="md:col-span-2">
          <h3 className="font-extrabold text-foreground text-sm mb-6 border-b border-border/60 pb-4 uppercase tracking-wide">
            Active Cluster Worker Threads
          </h3>

          <div className="grid sm:grid-cols-2 gap-4">
            {workers.length === 0 ? (
              <div className="sm:col-span-2 text-center py-12 text-xs text-secondary font-bold uppercase tracking-widest">Awaiting worker heartbeat signals...</div>
            ) : (
              workers.map((workerId, idx) => (
                <div key={idx} className="p-4 bg-slate-50/50 border border-border/60 rounded-2xl flex items-center justify-between text-xs shadow-inner transition-all hover:border-primary/20">
                  <div className="space-y-1.5 max-w-[65%]">
                    <span className="font-black text-foreground block font-mono text-xs">{workerId}</span>
                    <span className="text-[10px] text-secondary/60 font-bold block">Heartbeat observed in Redis</span>
                  </div>

                  <div className="text-right space-y-1.5 shrink-0">
                    <span className="text-[9px] px-2.5 py-1 rounded-lg font-black uppercase inline-block border shadow-sm bg-green-100 text-green-700 border-green-200">
                      ONLINE
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Live worker logs */}
        <Card className="md:col-span-1 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-foreground text-sm mb-6 border-b border-border/60 pb-4 uppercase tracking-wide flex items-center justify-between">
              <span>Cluster Scaling Log</span>
              <Terminal className="w-4 h-4 text-primary" />
            </h3>

            <div className="bg-slate-950/90 text-green-400 p-4 rounded-2xl border border-slate-800 font-mono text-[10px] min-h-[220px] max-h-[300px] overflow-y-auto space-y-2 shadow-inner custom-scrollbar">
              {logs.length === 0 ? (
                <span className="text-slate-500 font-bold">WORKER-POOL: Awaiting thread pool scaling event...</span>
              ) : (
                logs.map((log, idx) => (
                  <div key={idx} className="leading-normal">{log}</div>
                ))
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
