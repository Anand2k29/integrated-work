"use client"

import React, { useState } from "react"
import { Users, GitBranch, ArrowRight, ShieldCheck, AlertCircle, RefreshCw, Key, Layers, ShieldAlert, CheckCircle, Activity } from "lucide-react"
import { Card } from "./ui/card"
import { Scan } from "@/lib/api"

interface RoleSwapperViewProps {
  activeScan: Scan | null;
}

export function RoleSwapperView({ activeScan }: RoleSwapperViewProps) {
  const [roleMatrix, setRoleMatrix] = useState([
    { endpoint: "/api/v1/users/me", method: "GET", sourceRole: "viewer", targetRole: "admin", status: "SUCCESS (SECURE)", bypass: false, detail: "Correctly rejected with 403 Forbidden" },
    { endpoint: "/api/v1/payments/refund", method: "POST", sourceRole: "viewer", targetRole: "admin", status: "BYPASS DETECTED ⚠️", bypass: true, detail: "Refund executed with viewer authentication" },
    { endpoint: "/api/v1/tenant/settings", method: "GET", sourceRole: "anonymous", targetRole: "viewer", status: "SUCCESS (SECURE)", bypass: false, detail: "Anonymous block works correctly" },
    { endpoint: "/api/v1/billing/invoice/pdf", method: "GET", sourceRole: "viewer", targetRole: "editor", status: "BYPASS DETECTED ⚠️", bypass: true, detail: "Can view other client invoices without token validations" },
    { endpoint: "/api/v1/items/bulk", method: "PUT", sourceRole: "editor", targetRole: "admin", status: "SUCCESS (SECURE)", bypass: false, detail: "Rejected correctly" },
  ])

  const [activeSwap, setActiveSwap] = useState<any>(roleMatrix[1])

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-white to-slate-50 p-8 rounded-2xl border border-border flex items-center justify-between shadow-sm relative overflow-hidden">
        {/* Soft decorative gradient */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3"></div>

        <div className="relative z-10">
          <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20 shadow-sm">
              <Users className="w-6 h-6 text-primary" />
            </div>
            User / Role / Tenant Swapping
          </h2>
          <p className="text-sm text-secondary font-medium mt-2">
            Swap authentication contexts (JWT claims and user IDs) across requests to identify Privilege Escalation (BFLA) and BOLA.
          </p>
          {activeScan && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/20 text-primary font-bold text-xs rounded-lg mt-3">
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              <span>Analyzing: {activeScan.name} ({activeScan.status})</span>
            </div>
          )}
        </div>
      </div>

      {/* Role mappings node view */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Swapping configuration info card */}
        <Card className="md:col-span-1 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-foreground text-sm flex items-center gap-2 mb-6 border-b border-border/60 pb-4 uppercase tracking-wide">
              <GitBranch className="w-4 h-4 text-primary" />
              Active Swapping Profile
            </h3>

            <div className="space-y-4 text-xs font-semibold">
              <div className="flex justify-between items-center bg-slate-50 border border-border/55 p-4 rounded-2xl shadow-inner">
                <div className="space-y-1">
                  <span className="text-secondary block text-[10px] uppercase font-bold tracking-wider">SOURCE CONTEXT</span>
                  <span className="text-foreground text-xs font-black">Viewer (Low)</span>
                </div>
                <div className="p-1.5 bg-white border border-border shadow-sm rounded-lg">
                  <ArrowRight className="w-4 h-4 text-primary" />
                </div>
                <div className="space-y-1 text-right">
                  <span className="text-secondary block text-[10px] uppercase font-bold tracking-wider">TARGET CONTEXT</span>
                  <span className="text-foreground text-xs font-black text-primary">Admin (High)</span>
                </div>
              </div>

              <div className="bg-slate-50 border border-border/55 p-4 rounded-2xl shadow-inner space-y-2.5">
                <span className="text-secondary block text-[10px] uppercase font-bold tracking-wider">Tenant Boundaries Tested</span>
                <div className="flex items-center gap-2 text-foreground font-bold">
                  <span className="bg-white px-2.5 py-1 border border-border rounded-lg font-mono text-[10px] shadow-sm">tenant_0014</span>
                  <span className="text-secondary text-[10px] font-bold">to</span>
                  <span className="bg-white px-2.5 py-1 border border-border rounded-lg font-mono text-[10px] shadow-sm">tenant_0099</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Access control details */}
        <Card className="md:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-foreground text-sm flex items-center gap-2 mb-6 border-b border-border/60 pb-4 uppercase tracking-wide">
              <Layers className="w-4 h-4 text-secondary" />
              Vulnerability Details
            </h3>

            {activeSwap ? (
              <div className="space-y-4 text-xs">
                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-border/60 shadow-inner">
                  <div className="flex items-center gap-2.5">
                    <span className={`text-[9px] px-2 py-1 rounded-lg font-black ${
                      activeSwap.method === 'GET' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-green-100 text-green-700 border border-green-200'
                    }`}>{activeSwap.method}</span>
                    <span className="font-mono text-foreground font-bold text-sm tracking-tight">{activeSwap.endpoint}</span>
                  </div>
                  <span className={`text-[10px] px-3 py-1.5 rounded-xl font-black uppercase tracking-widest border shadow-sm ${
                    activeSwap.bypass ? 'bg-destructive/10 text-destructive border-destructive/20 animate-pulse' : 'bg-success/10 text-success border-success/20'
                  }`}>
                    {activeSwap.bypass ? 'Vulnerable' : 'Secure'}
                  </span>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-border/50 shadow-inner space-y-2">
                    <span className="text-[10px] font-bold text-secondary uppercase tracking-widest flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5 text-destructive" /> Swap Test Description</span>
                    <p className="text-foreground text-xs font-semibold leading-relaxed">{activeSwap.detail}</p>
                  </div>
                  <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 shadow-inner space-y-2">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-primary" /> Remediation Blueprint</span>
                    <p className="text-secondary text-xs font-semibold leading-relaxed">Verify target role privileges inside resource handler before processing database writes.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-xs text-secondary font-bold uppercase tracking-widest">Select a row below to inspect swap outcomes.</div>
            )}
          </div>
        </Card>
      </div>

      {/* Results grid */}
      <Card>
        <h3 className="font-extrabold text-foreground text-sm mb-6 border-b border-border/60 pb-4 uppercase tracking-wide">
          Authorization Swapping test matrices
        </h3>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left font-medium text-slate-700">
            <thead>
              <tr className="border-b border-border text-secondary font-bold text-[10px] uppercase tracking-wider">
                <th className="py-3 px-4">API Endpoint</th>
                <th className="py-3 px-4">Source Role</th>
                <th className="py-3 px-4">Target Role</th>
                <th className="py-3 px-4">Outcome Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {roleMatrix.map((item, idx) => (
                <tr 
                  key={idx} 
                  onClick={() => setActiveSwap(item)}
                  className={`border-b border-border/40 hover:bg-slate-50 cursor-pointer transition-all ${activeSwap?.endpoint === item.endpoint ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}
                >
                  <td className="py-4 px-4 font-mono text-[10px] text-foreground">
                    <span className={`text-[9px] px-2 py-0.5 rounded-lg font-black mr-2.5 ${
                      item.method === 'GET' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-green-100 text-green-700 border border-green-200'
                    }`}>{item.method}</span>
                    {item.endpoint}
                  </td>
                  <td className="py-4 px-4 font-bold text-foreground/80">{item.sourceRole}</td>
                  <td className="py-4 px-4 font-bold text-foreground/80">{item.targetRole}</td>
                  <td className={`py-4 px-4`}>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider ${item.bypass ? 'text-destructive' : 'text-success'}`}>
                      {item.bypass ? <ShieldAlert className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                      {item.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button className="text-[10px] bg-white border border-border hover:border-primary/50 text-secondary hover:text-primary px-3 py-1.5 rounded-xl transition-all cursor-pointer font-bold shadow-sm">
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

