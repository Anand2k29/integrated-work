"use client"

import React, { useState } from "react"
import { Users, UserPlus, Key, ShieldCheck, Mail, ShieldAlert, CheckCircle2 } from "lucide-react"
import { Card } from "./ui/card"

export function UserManagementView() {
  const [users, setUsers] = useState([
    { id: "usr_1001", name: "Sarah Jenkins", email: "sarah.j@trustlayer.io", role: "Administrator", token: "tl_live_88a91x", status: "Active" },
    { id: "usr_1002", name: "David Miller", email: "david.m@trustlayer.io", role: "Security Engineer", token: "tl_live_12c91b", status: "Active" },
    { id: "usr_1003", name: "Elena Rostova", email: "elena.r@trustlayer.io", role: "Developer", token: "tl_live_44p00a", status: "Active" },
    { id: "usr_1004", name: "Guest Audit", email: "guest.auditor@enterprise.com", role: "Auditor", token: "tl_live_77q12x", status: "Active" }
  ])

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("Security Engineer")
  const [success, setSuccess] = useState(false)

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return

    const newUser = {
      id: `usr_${Math.floor(Math.random() * 9000) + 1000}`,
      name,
      email,
      role,
      token: `tl_live_${Math.random().toString(36).substr(2, 6)}`,
      status: "Active"
    }

    setUsers(prev => [...prev, newUser])
    setName("")
    setEmail("")
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
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
              <Users className="w-6 h-6 text-primary" />
            </div>
            User & Access Management
          </h2>
          <p className="text-sm text-secondary font-medium mt-2">
            Grant dashboard credentials, configure API access tokens, and define role-based access policies.
          </p>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 font-bold animate-pulse shadow-sm z-10">
            <CheckCircle2 className="w-4 h-4 shrink-0 animate-bounce" />
            User added successfully!
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3 text-xs font-semibold">
        {/* Create User Form */}
        <Card className="md:col-span-1 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-foreground text-sm flex items-center gap-2 mb-6 border-b border-border/60 pb-4 uppercase tracking-wide">
              <UserPlus className="w-4 h-4 text-primary" />
              Add Console User
            </h3>

            <form onSubmit={handleAddUser} className="space-y-5 font-semibold text-xs">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-secondary uppercase tracking-widest block">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Elena Rostova"
                  className="w-full p-3 border border-border/80 rounded-xl bg-slate-50 text-foreground font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-inner text-xs"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-secondary uppercase tracking-widest block">Corporate Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="elena.r@trustlayer.io"
                  className="w-full p-3 border border-border/80 rounded-xl bg-slate-50 font-mono text-[11px] text-foreground focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-inner"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-secondary uppercase tracking-widest block">Access Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full p-3 border border-border/80 rounded-xl bg-slate-50 text-foreground font-bold focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                >
                  <option>Administrator</option>
                  <option>Security Engineer</option>
                  <option>Developer</option>
                  <option>Auditor</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold shadow-md shadow-primary/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs"
              >
                Provision Credentials
                <UserPlus className="w-4 h-4" />
              </button>
            </form>
          </div>
        </Card>

        {/* Users Table */}
        <Card className="md:col-span-2">
          <h3 className="font-extrabold text-foreground text-sm mb-6 border-b border-border/60 pb-4 uppercase tracking-wide">
            Active Accounts & API Keys
          </h3>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left font-medium text-slate-700">
              <thead>
                <tr className="border-b border-border text-secondary font-bold text-[10px] uppercase tracking-wider">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Access Token</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-border/40 hover:bg-slate-50 transition-all">
                    <td className="py-4 px-4 font-bold text-foreground">{u.name}</td>
                    <td className="py-4 px-4 font-mono text-[10px] text-secondary">{u.email}</td>
                    <td className="py-4 px-4">
                      <span className={`text-[9px] px-2.5 py-1 rounded-lg font-black uppercase border shadow-sm ${
                        u.role === 'Administrator' ? 'bg-red-100 text-red-700 border-red-200' :
                        u.role === 'Security Engineer' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-blue-100 text-blue-700 border-blue-200'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-mono text-[10px] text-secondary">{u.token}</td>
                    <td className="py-4 px-4 text-right">
                      <span className="bg-green-100 text-green-700 text-[9px] px-2.5 py-1 rounded-lg font-black uppercase border border-green-200 shadow-sm">
                        {u.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}
