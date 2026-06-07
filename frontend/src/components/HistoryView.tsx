"use client"

import React, { useState, useEffect } from "react"
import { Shield, Play, Plus, Server, Activity, Calendar, Trash2, ArrowRight } from "lucide-react"
import { Card } from "./ui/card"
import { apiService, Scan } from "@/lib/api"

interface HistoryViewProps {
  scans: Scan[];
  activeScan: Scan | null;
  onSelectScan: (scan: Scan) => void;
  onRefreshScans: () => void;
}

export function HistoryView({ scans, activeScan, onSelectScan, onRefreshScans }: HistoryViewProps) {
  const [newScanName, setNewScanName] = useState("")
  const [newScanTarget, setNewScanTarget] = useState("")
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState("")

  const handleCreateScan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newScanName.trim() || !newScanTarget.trim()) {
      setError("Please specify both a scan name and a target API base URL.")
      return
    }

    setCreating(true)
    setError("")

    try {
      const created = await apiService.createScan(newScanName, newScanTarget)
      onSelectScan(created)
      onRefreshScans()
      
      // Reset form
      setNewScanName("")
      setNewScanTarget("")
    } catch (err: any) {
      setError(err.message || "Failed to initialize scan.")
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteScan = async (scanId: string) => {
    if (!confirm("Are you sure you want to delete this scan workspace? This will delete all associated tasks, execution results, and vulnerabilities.")) {
      return
    }

    try {
      await apiService.deleteScan(scanId)
      onRefreshScans()
    } catch (err: any) {
      alert(err.message || "Failed to delete scan workspace.")
    }
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
              <Server className="w-6 h-6 text-primary" />
            </div>
            Audit Target History
          </h2>
          <p className="text-sm text-secondary font-medium mt-2">
            Initiate new scans, review targets, and track history across your workspace.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Create Scan Form */}
        <Card className="md:col-span-1 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-foreground text-sm flex items-center gap-2 mb-6 border-b border-border/60 pb-4 uppercase tracking-wide">
              <Plus className="w-4 h-4 text-primary" />
              Launch New Security Scan
            </h3>

            <form onSubmit={handleCreateScan} className="space-y-5 text-xs font-semibold">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-secondary uppercase tracking-widest block">Audit Scan Title</label>
                <input
                  type="text"
                  value={newScanName}
                  onChange={(e) => setNewScanName(e.target.value)}
                  placeholder="e.g. Production OAuth Gateway"
                  className="w-full p-3 border border-border/80 rounded-xl bg-slate-50 text-foreground font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-inner text-xs"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-secondary uppercase tracking-widest block">Target Base URL / Swagger spec</label>
                <input
                  type="text"
                  value={newScanTarget}
                  onChange={(e) => setNewScanTarget(e.target.value)}
                  placeholder="https://api.example.com/v1"
                  className="w-full p-3 border border-border/80 rounded-xl bg-slate-50 font-mono text-[11px] text-foreground focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-inner"
                />
              </div>

              {error && <div className="text-destructive font-black text-[10px] bg-destructive/10 border border-destructive/20 p-3 rounded-xl uppercase tracking-wider">{error}</div>}

              <button
                type="submit"
                disabled={creating}
                className="w-full py-3.5 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold shadow-md shadow-primary/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 text-xs"
              >
                {creating ? "Launching Scan Engines..." : "Initialize Scan Workspace"}
                <Play className="w-4 h-4 fill-white" />
              </button>
            </form>
          </div>
        </Card>

        {/* History Table */}
        <Card className="md:col-span-2">
          <h3 className="font-extrabold text-foreground text-sm mb-6 border-b border-border/60 pb-4 uppercase tracking-wide">
            Registered Target Workspaces
          </h3>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left font-medium text-slate-700">
              <thead>
                <tr className="border-b border-border text-secondary font-bold text-[10px] uppercase tracking-wider">
                  <th className="py-3 px-4">Scan Title</th>
                  <th className="py-3 px-4">Base Endpoint Target</th>
                  <th className="py-3 px-4">Date Created</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {scans.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-xs text-secondary font-bold uppercase tracking-widest border border-dashed border-border rounded-2xl">
                      No scans executed yet.
                    </td>
                  </tr>
                ) : (
                  scans.map((s) => (
                    <tr 
                      key={s.id} 
                      className={`border-b border-border/40 hover:bg-slate-50 transition-all ${activeScan?.id === s.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}
                    >
                      <td className="py-4 px-4 font-bold text-foreground">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4.5 h-4.5 text-primary shrink-0" />
                          <span>{s.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono text-[10px] text-secondary truncate max-w-xs">{s.target}</td>
                      <td className="py-4 px-4 text-secondary/80 font-bold">{new Date(s.created_at).toLocaleDateString()}</td>
                      <td className="py-4 px-4">
                        <span className={`text-[9px] px-2.5 py-1 rounded-lg font-black uppercase border shadow-sm ${
                          s.status === 'RUNNING' ? 'bg-blue-100 text-blue-700 border-blue-200 animate-pulse' :
                          s.status === 'COMPLETED' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => onSelectScan(s)}
                            className="text-[10px] bg-white border border-border hover:border-primary/50 text-secondary hover:text-primary px-3 py-1.5 rounded-xl transition-all cursor-pointer font-bold shadow-sm"
                          >
                            Select
                          </button>
                          <button 
                            onClick={() => handleDeleteScan(s.id)}
                            className="text-[10px] bg-red-50 border border-red-200 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-xl transition-all cursor-pointer font-bold shadow-sm"
                            title="Delete scan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}
