"use client"

import React, { useState } from "react"
import { ShieldCheck, Mail, ShieldAlert, Key, RefreshCw, Layers } from "lucide-react"
import { Card } from "./ui/card"

export function ProfileView() {
  const [profile, setProfile] = useState({
    id: "usr_1002",
    name: "David Miller",
    email: "david.m@trustlayer.io",
    role: "Security Engineer",
    apiKey: "tl_live_12c91b44de804a9767ba8bf13dcac18cf77be8e",
    joined: "June 2026",
  })

  const [permissions, setPermissions] = useState([
    { name: "Execute Security Scans", granted: true },
    { name: "Decode Cryptographic Tokens", granted: true },
    { name: "Configure Rate Limiters", granted: true },
    { name: "Edit Database Schema", granted: false },
    { name: "Export Compliance PDF Reports", granted: true }
  ])

  const [resetting, setResetting] = useState(false)

  const handleResetKey = () => {
    setResetting(true)
    setTimeout(() => {
      setProfile(prev => ({
        ...prev,
        apiKey: `tl_live_${Math.random().toString(36).substr(2, 40)}`
      }))
      setResetting(false)
    }, 800)
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
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            My Security Profile
          </h2>
          <p className="text-sm text-secondary font-medium mt-2">
            Review your credential authorizations, cryptographic keys, and active permission controls.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3 text-xs font-semibold">
        {/* Profile Details */}
        <Card className="md:col-span-1 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-foreground text-sm flex items-center gap-2 mb-6 border-b border-border/60 pb-4 uppercase tracking-wide">
              <Key className="w-4 h-4 text-primary" />
              Console Account Details
            </h3>

            <div className="space-y-3 font-semibold text-xs">
              <div className="flex justify-between items-center bg-slate-50 border border-border/55 p-3.5 rounded-2xl shadow-inner">
                <span className="text-secondary font-bold uppercase tracking-wider text-[9px]">User ID</span>
                <span className="text-foreground font-mono font-black">{profile.id}</span>
              </div>

              <div className="flex justify-between items-center bg-slate-50 border border-border/55 p-3.5 rounded-2xl shadow-inner">
                <span className="text-secondary font-bold uppercase tracking-wider text-[9px]">Full Name</span>
                <span className="text-foreground font-black">{profile.name}</span>
              </div>

              <div className="flex justify-between items-center bg-slate-50 border border-border/55 p-3.5 rounded-2xl shadow-inner">
                <span className="text-secondary font-bold uppercase tracking-wider text-[9px]">Email Address</span>
                <span className="text-foreground font-mono font-black">{profile.email}</span>
              </div>

              <div className="flex justify-between items-center bg-slate-50 border border-border/55 p-3.5 rounded-2xl shadow-inner">
                <span className="text-secondary font-bold uppercase tracking-wider text-[9px]">Security Role</span>
                <span className="bg-amber-100 text-amber-700 text-[9px] px-2.5 py-1 rounded-lg font-black border border-amber-200 uppercase shadow-sm">{profile.role}</span>
              </div>

              <div className="flex justify-between items-center bg-slate-50 border border-border/55 p-3.5 rounded-2xl shadow-inner">
                <span className="text-secondary font-bold uppercase tracking-wider text-[9px]">Member Since</span>
                <span className="text-foreground font-black">{profile.joined}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* API Token Key Management */}
        <Card className="md:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-foreground text-sm flex items-center gap-2 mb-6 border-b border-border/60 pb-4 uppercase tracking-wide">
              <Layers className="w-4 h-4 text-secondary" />
              API Key & Permission Credentials
            </h3>

            <div className="space-y-5 text-xs font-semibold">
              {/* Key configuration */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-border/55 space-y-2.5 shadow-inner">
                <span className="text-secondary font-bold uppercase tracking-wider text-[9px] block">Console Secret API Token</span>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    readOnly
                    value={profile.apiKey}
                    className="flex-1 p-3 border border-border rounded-xl bg-white font-mono text-[10px] text-foreground select-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                  />
                  <button
                    onClick={handleResetKey}
                    disabled={resetting}
                    className="bg-white border border-border hover:border-primary/55 p-3 rounded-xl transition-all cursor-pointer shadow-sm"
                  >
                    <RefreshCw className={`w-4 h-4 text-slate-600 ${resetting ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Permissions list */}
              <div className="space-y-3">
                <span className="text-secondary font-bold uppercase tracking-wider text-[9px] block">Role Permissions Matrix</span>
                <div className="grid md:grid-cols-2 gap-3.5">
                  {permissions.map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-50 border border-border/50 rounded-2xl shadow-inner text-xs">
                      <span className="text-slate-700 font-bold">{p.name}</span>
                      {p.granted ? (
                        <span className="text-green-600 font-black flex items-center gap-1.5 bg-green-50 border border-green-200 px-2.5 py-1 rounded-xl shadow-sm">
                          <ShieldCheck className="w-4 h-4 text-green-600" />
                          Granted
                        </span>
                      ) : (
                        <span className="text-destructive font-black flex items-center gap-1.5 bg-destructive/5 border border-destructive/20 px-2.5 py-1 rounded-xl shadow-sm">
                          <ShieldAlert className="w-4 h-4 text-destructive" />
                          Restricted
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
