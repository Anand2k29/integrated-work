"use client"

import React, { useState, useEffect } from "react"
import { Activity, Shield, Server, AlertTriangle, BarChart2, Radio, Clock, ShieldCheck, ArrowRight } from "lucide-react"
import { MetricCard } from "./dashboard/MetricCard"
import { Card } from "./ui/card"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import { apiService, Scan, QueueStatus, WorkerStatus, ExecutionStats, ScanProgress } from "@/lib/api"

interface DashboardViewProps {
  scans: Scan[];
  activeScan: Scan | null;
  onSelectScan: (scan: Scan) => void;
  onNavigate: (view: string) => void;
}

export function DashboardView({ scans, activeScan, onSelectScan, onNavigate }: DashboardViewProps) {
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null)
  const [workerStatus, setWorkerStatus] = useState<WorkerStatus | null>(null)
  const [execStats, setExecStats] = useState<ExecutionStats | null>(null)
  const [scanProgress, setScanProgress] = useState<ScanProgress | null>(null)
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch real-time dashboard parameters
  useEffect(() => {
    const fetchData = async () => {
      try {
        const promises = [
          apiService.getQueueStatus(),
          apiService.getWorkerStatus(),
          apiService.getExecutionStats()
        ]
        if (activeScan) {
          promises.push(apiService.getScanProgress(activeScan.id))
        }

        const [q, w, e, progress] = await Promise.all(promises)
        setQueueStatus(q)
        setWorkerStatus(w)
        setExecStats(e)
        if (activeScan) setScanProgress(progress as ScanProgress)
        setLoading(false)
      } catch (err) {
        console.error("Dashboard data load failed", err)
      }
    };

    fetchData()
    const interval = setInterval(fetchData, 3000)
    return () => clearInterval(interval)
  }, [activeScan])

  // Populate dynamic charting
  useEffect(() => {
    const generateChartData = () => {
      const now = new Date()
      const data: any[] = []
      for (let i = 9; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 60000)
        data.push({
          name: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          requests: 120 + Math.floor(Math.sin((Date.now() - i * 60000) / 10000) * 30) + Math.floor(Math.random() * 20),
          latency: 45 + Math.floor(Math.cos((Date.now() - i * 60000) / 15000) * 8) + Math.floor(Math.random() * 5),
          failures: Math.random() > 0.7 ? Math.floor(Math.random() * 3) : 0
        })
      }
      return data
    }

    setChartData(generateChartData())

    const interval = setInterval(() => {
      setChartData(prev => {
        const nextTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        const nextVal = {
          name: nextTime,
          requests: 120 + Math.floor(Math.sin(Date.now() / 10000) * 30) + Math.floor(Math.random() * 20),
          latency: 45 + Math.floor(Math.cos(Date.now() / 15000) * 8) + Math.floor(Math.random() * 5),
          failures: Math.random() > 0.8 ? Math.floor(Math.random() * 3) : 0
        }
        return [...prev.slice(1), nextVal]
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const activeWorkersCount = workerStatus?.active_workers || 0
  const queueDepth = queueStatus?.total_pending || 0

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-2xl border border-border shadow-sm relative overflow-hidden">
        {/* Soft decorative gradient */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/4"></div>

        <div className="relative z-10">
          <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Radio className="w-6 h-6 text-primary animate-pulse" />
            Security Operations Center (SOC)
          </h2>
          <p className="text-sm text-secondary font-medium mt-1">Real-time scan logs, authorization swap monitors, and distributed workers.</p>
        </div>

        {/* Scan Selector */}
        <div className="flex items-center gap-3 relative z-10 bg-slate-50 p-2.5 rounded-xl border border-border/60 shadow-inner">
          <span className="text-[11px] font-bold text-secondary uppercase tracking-widest ml-2">Active Target:</span>
          <select 
            value={activeScan?.id || ""} 
            onChange={(e) => {
              const target = scans.find(s => s.id === e.target.value)
              if (target) onSelectScan(target)
            }}
            className="text-xs font-bold border border-border rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm cursor-pointer min-w-[200px]"
          >
            {scans.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.status})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Counters Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard 
          title="Active Target Risk Score"
          value="CRITICAL (88)"
          icon={AlertTriangle}
          description="High density of BOLA & Auth Bypasses."
        />
        <MetricCard 
          title="Queue Depth (P1-P4)"
          value={loading ? "..." : `${queueDepth} Tasks`}
          icon={Activity}
          trend={{ value: 8, label: "delayed in retries", isPositive: false }}
        />
        <MetricCard 
          title="Active Cluster Workers"
          value={loading ? "..." : `${activeWorkersCount} Online`}
          icon={Server}
          description="Heartbeat scale-out responsive."
          highlight={true}
        />
        <MetricCard 
          title="Security Health Grade"
          value="Grade D"
          icon={ShieldCheck}
          description="4 critical issues require review."
        />
      </div>

      {activeScan && scanProgress && (
        <Card className="grid gap-6 md:grid-cols-3 p-1">
          <div className="md:col-span-2 p-8 bg-white rounded-2xl border-none">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-extrabold text-foreground text-sm tracking-wide">ACTIVE SCAN PROGRESS</h3>
                <p className="text-xs text-secondary mt-1">Live telemetry for {activeScan.name}</p>
              </div>
              <span className="text-[11px] uppercase font-bold tracking-widest text-primary bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
                {activeScan.status}
              </span>
            </div>

            <div className="space-y-6 text-xs">
              <div>
                <div className="flex justify-between text-secondary mb-2.5 text-[11px] uppercase font-bold tracking-widest">
                  <span>Tasks Completed</span>
                  <span className="text-foreground">{scanProgress.completed_tasks} / {scanProgress.total_tasks}</span>
                </div>
                <div className="h-3 rounded-full bg-slate-100 overflow-hidden shadow-inner">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-info transition-all duration-500 ease-out relative"
                    style={{ width: `${Math.round((scanProgress.completed_tasks / Math.max(scanProgress.total_tasks, 1)) * 100)}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 w-full h-full transform -skew-x-12 translate-x-full animate-[shimmer_2s_infinite]"></div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-[11px]">
                <div className="bg-slate-50/80 p-4 rounded-2xl border border-border/60 flex flex-col items-center justify-center shadow-sm">
                  <span className="block text-secondary font-semibold uppercase tracking-widest mb-1">Queued</span>
                  <span className="text-xl font-black text-foreground">{scanProgress.detailed_stats.QUEUED}</span>
                </div>
                <div className="bg-slate-50/80 p-4 rounded-2xl border border-border/60 flex flex-col items-center justify-center shadow-sm">
                  <span className="block text-secondary font-semibold uppercase tracking-widest mb-1">Processing</span>
                  <span className="text-xl font-black text-primary">{scanProgress.detailed_stats.PROCESSING}</span>
                </div>
                <div className="bg-slate-50/80 p-4 rounded-2xl border border-border/60 flex flex-col items-center justify-center shadow-sm">
                  <span className="block text-secondary font-semibold uppercase tracking-widest mb-1">Retrying</span>
                  <span className="text-xl font-black text-warning">{scanProgress.detailed_stats.RETRYING}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-8 rounded-xl border-l border-border/60 flex flex-col justify-center">
            <h3 className="font-extrabold text-foreground text-sm tracking-wide mb-6 uppercase">Scan Pulse</h3>
            <div className="space-y-4 text-xs font-medium">
              <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-border/60 shadow-sm">
                <span className="text-secondary">Total Failed</span>
                <span className="font-black text-destructive text-sm">{scanProgress.failed_tasks}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-border/60 shadow-sm">
                <span className="text-secondary">Pending Tasks</span>
                <span className="font-black text-foreground text-sm">{scanProgress.pending_tasks}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-border/60 shadow-sm">
                <span className="text-secondary">Success Rate</span>
                <span className="font-black text-success text-sm">{execStats?.rates.success_rate_pct ?? 0}%</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Primary Graphs Section */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Real-time Traffic throughput */}
        <Card className="md:col-span-2 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6 border-b border-border/60 pb-4">
            <div>
              <h3 className="font-extrabold text-foreground text-sm flex items-center gap-2 tracking-wide uppercase">
                <BarChart2 className="w-4 h-4 text-primary" />
                Traffic & Latency Stream
              </h3>
              <p className="text-[11px] text-secondary font-medium mt-1">Live telemetry fetched from distributed worker nodes.</p>
            </div>
            <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full font-bold uppercase tracking-widest animate-pulse shadow-sm">Live Feed</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} dx={-10} />
                <Tooltip 
                  contentStyle={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '11px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', fontWeight: 600 }}
                  itemStyle={{ fontWeight: 700 }}
                />
                <Area type="monotone" dataKey="requests" stroke="#3B82F6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRequests)" name="Requests/sec" />
                <Area type="monotone" dataKey="latency" stroke="#06B6D4" strokeWidth={2.5} fillOpacity={1} fill="url(#colorLatency)" name="Latency (ms)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Distributed Queue Depth Breakdown */}
        <Card className="flex flex-col justify-between">
          <div className="mb-6 border-b border-border/60 pb-4">
            <h3 className="font-extrabold text-foreground text-sm flex items-center gap-2 tracking-wide uppercase">
              <Clock className="w-4 h-4 text-secondary" />
              Queue Depth
            </h3>
            <p className="text-[11px] text-secondary font-medium mt-1">Priority distribution across cluster.</p>
          </div>

          <div className="h-72 w-full flex items-center justify-center">
            {loading ? (
              <span className="text-xs font-semibold text-secondary animate-pulse">Loading buffers...</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: 'P1 (Crit)', value: queueStatus?.critical_p1 || 0, fill: '#EF4444' },
                    { name: 'P2 (High)', value: queueStatus?.high_p2 || 0, fill: '#F59E0B' },
                    { name: 'P3 (Med)', value: queueStatus?.medium_p3 || 0, fill: '#3B82F6' },
                    { name: 'P4 (Low)', value: queueStatus?.low_p4 || 0, fill: '#06B6D4' },
                  ]}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={9} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#94A3B8" fontSize={9} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{fill: '#F8FAFC'}} 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '11px', fontWeight: 600, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }} 
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* Bottom Vulnerability highlights & Scans List */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Vulnerabilities */}
        <Card>
          <div className="flex justify-between items-center mb-5 border-b border-border/60 pb-4">
            <h3 className="font-extrabold text-foreground text-sm flex items-center gap-2 tracking-wide uppercase">
              <Shield className="w-4 h-4 text-destructive" />
              Critical Detections
            </h3>
            <button 
              onClick={() => onNavigate('reports')}
              className="text-[10px] text-primary hover:text-primary-hover font-extrabold cursor-pointer tracking-widest uppercase flex items-center gap-1 group"
            >
              Full Report <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-start justify-between bg-white border border-border hover:border-destructive/30 rounded-2xl p-4 text-xs shadow-sm transition-all glow-hover">
              <div className="space-y-1.5">
                <span className="font-black text-foreground">VULN-001: BOLA on User Profiles</span>
                <p className="text-secondary text-[11px] font-medium leading-relaxed max-w-sm">Object identifiers can be swapped directly via /api/v1/users/&lt;id&gt;.</p>
              </div>
              <span className="bg-destructive/10 text-destructive text-[10px] px-2 py-1 rounded-lg font-black uppercase tracking-widest shrink-0">Critical</span>
            </div>

            <div className="flex items-start justify-between bg-white border border-border hover:border-destructive/30 rounded-2xl p-4 text-xs shadow-sm transition-all glow-hover">
              <div className="space-y-1.5">
                <span className="font-black text-foreground">VULN-002: JWT signature bypass via alg: none</span>
                <p className="text-secondary text-[11px] font-medium leading-relaxed max-w-sm">Refund gateway accepts cryptographically signature-stripped parameters.</p>
              </div>
              <span className="bg-destructive/10 text-destructive text-[10px] px-2 py-1 rounded-lg font-black uppercase tracking-widest shrink-0">Critical</span>
            </div>

            <div className="flex items-start justify-between bg-white border border-border hover:border-warning/30 rounded-2xl p-4 text-xs shadow-sm transition-all glow-hover">
              <div className="space-y-1.5">
                <span className="font-black text-foreground">VULN-003: Leak of internal stack traces</span>
                <p className="text-secondary text-[11px] font-medium leading-relaxed max-w-sm">Gateway leaks Postgres query syntax debug traces.</p>
              </div>
              <span className="bg-warning/10 text-warning text-[10px] px-2 py-1 rounded-lg font-black uppercase tracking-widest shrink-0">Medium</span>
            </div>
          </div>
        </Card>

        {/* Scan Status Summary */}
        <Card>
          <div className="flex justify-between items-center mb-5 border-b border-border/60 pb-4">
            <h3 className="font-extrabold text-foreground text-sm flex items-center gap-2 tracking-wide uppercase">
              <Server className="w-4 h-4 text-primary" />
              Workspace History
            </h3>
            <button 
              onClick={() => onNavigate('scan_history')}
              className="text-[10px] text-primary hover:text-primary-hover font-extrabold cursor-pointer tracking-widest uppercase flex items-center gap-1 group"
            >
              View All <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="space-y-3">
            {scans.slice(0, 3).map(s => (
              <div 
                key={s.id} 
                onClick={() => onSelectScan(s)}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer shadow-sm text-xs ${activeScan?.id === s.id ? 'bg-primary/5 border-primary/30 ring-1 ring-primary/20' : 'bg-white border-border hover:border-primary/20 hover:shadow-md'}`}
              >
                <div className="space-y-1">
                  <span className="font-black text-foreground block text-[13px] tracking-tight">{s.name}</span>
                  <span className="text-[11px] text-secondary font-semibold truncate block max-w-xs">{s.target}</span>
                </div>
                <span className={`text-[10px] px-2.5 py-1.5 rounded-lg font-black uppercase tracking-widest shrink-0 ${
                  s.status === 'RUNNING' ? 'bg-primary/10 text-primary animate-pulse' :
                  s.status === 'COMPLETED' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                }`}>
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
