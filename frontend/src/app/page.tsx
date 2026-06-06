"use client"

import { Activity, Server, Target, Zap } from "lucide-react"
import { MetricCard } from "@/components/dashboard/MetricCard"
import { Card } from "@/components/ui/card"

export default function DashboardPage() {
  return (
    <main className="flex-1 p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Execution <span className="text-primary">Dashboard</span></h1>
          <p className="text-muted mt-2">Real-time async execution metrics and worker health.</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
          </span>
          <span className="text-sm text-muted font-medium">System Online</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <MetricCard 
          title="Active Workers"
          value="12"
          icon={Server}
          trend={{ value: 10, label: "vs last hour", isPositive: true }}
        />
        <MetricCard 
          title="Active Scans"
          value="45"
          icon={Target}
          trend={{ value: 5, label: "vs last hour", isPositive: true }}
        />
        <MetricCard 
          title="Tasks / Sec"
          value="1,432"
          icon={Zap}
          trend={{ value: 12, label: "vs last hour", isPositive: true }}
        />
        <MetricCard 
          title="Queue Depth"
          value="15K"
          icon={Activity}
          description="Total tasks pending execution across all queues."
        />
      </div>

      {/* Charts / Activity Area */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 min-h-[400px] flex items-center justify-center">
          <div className="text-center text-muted">
            <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Throughput Chart (Recharts Integration Pending)</p>
          </div>
        </Card>
        
        <Card className="min-h-[400px] flex flex-col">
          <h3 className="text-lg font-semibold mb-4 border-b border-border pb-2">Recent Activity</h3>
          <div className="flex-1 space-y-4 overflow-auto">
            {/* Mock Activity Stream */}
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start space-x-3 text-sm">
                <div className="w-2 h-2 mt-1.5 rounded-full bg-primary" />
                <div>
                  <p className="text-foreground font-medium">Scan started for target.com</p>
                  <p className="text-muted text-xs">2 minutes ago</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </main>
  )
}
