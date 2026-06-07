"use client"

import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Shield, Zap, Key, Server, Cpu, Layers, GitBranch, ArrowRight, Activity, Terminal } from "lucide-react"

interface LandingPageProps {
  onLaunch: () => void;
  onLogin: () => void;
}

export function LandingPage({ onLaunch, onLogin }: LandingPageProps) {
  const [trafficLog, setTrafficLog] = useState<string[]>([])

  // Simulate network traffic log on the landing page for visual pop
  useEffect(() => {
    const methods = ["GET", "POST", "PUT", "DELETE", "PATCH"]
    const endpoints = [
      "/api/v1/auth/login",
      "/api/v1/users/me",
      "/api/v1/payments/refund",
      "/api/v1/tenant/10042/settings",
      "/api/v1/billing/invoice/pdf",
      "/api/v1/admin/dashboard",
      "/api/v1/items/bulk"
    ]
    const agents = ["RoleSwapperAgent", "FuzzingEngine", "ApiCrawler", "JwtAnalyzer"]

    const interval = setInterval(() => {
      const method = methods[Math.floor(Math.random() * methods.length)]
      const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)]
      const agent = agents[Math.floor(Math.random() * agents.length)]
      const status = Math.random() > 0.85 ? "403 FORBIDDEN ⚠️" : "200 OK ✅"
      
      const log = `[${new Date().toLocaleTimeString()}] ${agent} -> ${method} ${endpoint} - ${status}`
      setTrafficLog(prev => [log, ...prev].slice(0, 5))
    }, 1800)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden tech-grid flex flex-col justify-between">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-panel py-4.5 px-6 md:px-12 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/20 shadow-sm">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-foreground">TRUSTLAYER</span>
            <span className="text-primary font-black ml-2 text-[10px] px-2 py-0.5 rounded-lg bg-primary/10 border border-primary/20 shadow-sm">SECURITY</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <button 
            onClick={onLogin}
            className="text-xs font-bold uppercase tracking-wider text-secondary hover:text-foreground transition-colors cursor-pointer"
          >
            Sign In
          </button>
          <button 
            onClick={onLaunch}
            className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-primary/10 cursor-pointer flex items-center gap-1.5"
          >
            Launch Console
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-16 md:py-24 grid md:grid-cols-12 gap-12 items-center z-10">
        <div className="md:col-span-7 space-y-8 text-center md:text-left">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-3.5 py-1.5 rounded-full text-xs font-bold text-primary shadow-sm"
          >
            <Zap className="w-3.5 h-3.5 fill-primary" />
            AI-Powered API Security Intelligence Platform
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-6xl font-black tracking-tight leading-[1.15]"
          >
            Automated API <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-info">
              Authorization Testing
            </span> <br />
            for Enterprise DevSecOps.
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-secondary max-w-xl mx-auto md:mx-0 font-medium leading-relaxed"
          >
            Discover endpoints, crawl schemas, decode tokens, mutate parameter payloads, and swap roles autonomously in real time. Seal BOLA and privilege leaks before deployment.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start"
          >
            <button 
              onClick={onLaunch}
              className="bg-primary hover:bg-primary-hover text-white px-8 py-4 rounded-xl text-base font-bold shadow-lg shadow-primary/15 transition-all flex items-center justify-center gap-2 cursor-pointer group"
            >
              Start Security Scan
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={onLogin}
              className="bg-white hover:bg-slate-50 border border-border text-foreground px-8 py-4 rounded-xl text-base font-bold transition-all shadow-sm cursor-pointer"
            >
              Request API Key
            </button>
          </motion.div>

          {/* Quick stats on Hero */}
          <div className="grid grid-cols-3 gap-6 pt-6 border-t border-border/80 text-center md:text-left">
            <div>
              <div className="text-2xl font-black text-foreground">100%</div>
              <div className="text-[10px] font-bold text-secondary uppercase tracking-widest mt-1">Autonomous Discovery</div>
            </div>
            <div>
              <div className="text-2xl font-black text-foreground">&lt; 15ms</div>
              <div className="text-[10px] font-bold text-secondary uppercase tracking-widest mt-1">Token Parsing Latency</div>
            </div>
            <div>
              <div className="text-2xl font-black text-foreground">P1-P4</div>
              <div className="text-[10px] font-bold text-secondary uppercase tracking-widest mt-1">Distributed Queues</div>
            </div>
          </div>
        </div>

        {/* Hero Interactive visualization */}
        <div className="md:col-span-5 relative flex justify-center items-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="w-full max-w-md bg-white border border-border rounded-3xl p-6.5 shadow-premium relative overflow-hidden"
          >
            {/* Window header */}
            <div className="flex justify-between items-center mb-4.5 pb-3 border-b border-border/60">
              <div className="flex space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-red-400"></span>
                <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                <span className="w-3 h-3 rounded-full bg-green-400"></span>
              </div>
              <div className="text-[10px] text-secondary font-black tracking-widest flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-primary" />
                SECURITY ENGINES
              </div>
            </div>

            {/* Simulated engines running */}
            <div className="space-y-4">
              <div className="bg-slate-50 border border-border/60 rounded-2xl p-4 shadow-inner">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-black text-foreground flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-primary" />
                    ENDPOINT DISCOVERY
                  </span>
                  <span className="text-[9px] bg-green-100 border border-green-200 text-green-700 px-2 py-0.5 rounded-lg font-black uppercase">Active</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden border border-border/40 shadow-inner">
                  <div className="bg-primary h-full w-[85%] rounded-full animate-pulse"></div>
                </div>
              </div>

              <div className="bg-slate-50 border border-border/60 rounded-2xl p-4 shadow-inner">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-black text-foreground flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-secondary" />
                    JWT DECODER & ANALYSIS
                  </span>
                  <span className="text-[9px] bg-amber-100 border border-amber-200 text-amber-700 px-2 py-0.5 rounded-lg font-black uppercase">Analyzing</span>
                </div>
                <div className="font-mono text-[10px] text-secondary truncate bg-white border border-border/60 p-2.5 rounded-xl shadow-sm">
                  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMiIsInJvbGUi...
                </div>
              </div>

              <div className="bg-slate-50 border border-border/60 rounded-2xl p-4 shadow-inner">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-black text-foreground flex items-center gap-1.5">
                    <GitBranch className="w-3.5 h-3.5 text-red-500" />
                    ROLE & TENANT SWAPPING
                  </span>
                  <span className="text-[9px] bg-red-100 border border-red-200 text-red-700 px-2 py-0.5 rounded-lg font-black uppercase">9 Critical Checks</span>
                </div>
                <div className="text-[11px] text-secondary font-bold pl-1">
                  Testing swap: <span className="font-black text-foreground">admin</span> ↔️ <span className="font-black text-foreground">anonymous</span>
                </div>
              </div>
            </div>

            {/* Traffic output console */}
            <div className="mt-5 bg-slate-950/95 rounded-2xl p-4 border border-slate-800 text-[10px] font-mono text-slate-300 min-h-[130px] overflow-hidden flex flex-col justify-end shadow-inner">
              <div className="text-slate-500 text-[9px] mb-2 font-bold border-b border-slate-800/80 pb-1.5 flex justify-between items-center">
                <span>SIMULATED SCAN TRAFFIC LOG</span>
                <span className="animate-ping w-1.5 h-1.5 rounded-full bg-green-500"></span>
              </div>
              <div className="space-y-1.5">
                {trafficLog.length === 0 ? (
                  <span className="text-slate-500">Initializing socket scanner streams...</span>
                ) : (
                  trafficLog.map((log, idx) => (
                    <div key={idx} className="truncate text-green-400 font-semibold leading-relaxed">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>

          {/* Decorative floating shapes */}
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-secondary/15 rounded-full blur-3xl -z-10 animate-pulse"></div>
        </div>
      </main>

      {/* Feature cards Grid */}
      <section className="bg-white/50 border-t border-border/80 py-20 px-6 md:px-12 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-16">
            <h2 className="text-3xl font-black tracking-tight text-foreground">API Security Intelligence Engines</h2>
            <p className="text-sm text-secondary font-medium mt-3 leading-relaxed">Seven specialized core security engines cooperating asynchronously to identify authorization bypasses, token defects, and data leakage.</p>
          </div>

          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
            <div className="bg-white border border-border p-6 rounded-2xl shadow-sm hover:shadow-premium transition-all glow-hover">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-5 border border-primary/20 shadow-sm">
                <Layers className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-extrabold text-foreground text-sm uppercase tracking-wide">Endpoint Discovery</h3>
              <p className="text-xs text-secondary font-semibold leading-relaxed mt-2.5">Auto-parse Swagger/OpenAPI files to identify routes, authorization metadata, and request parameters.</p>
            </div>

            <div className="bg-white border border-border p-6 rounded-2xl shadow-sm hover:shadow-premium transition-all glow-hover">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center mb-5 border border-secondary/20 shadow-sm">
                <GitBranch className="w-5 h-5 text-secondary" />
              </div>
              <h3 className="font-extrabold text-foreground text-sm uppercase tracking-wide">API Schema Crawler</h3>
              <p className="text-xs text-secondary font-semibold leading-relaxed mt-2.5">Traverse endpoint dependency trees to crawl inputs and reconstruct sequence transaction flows.</p>
            </div>

            <div className="bg-white border border-border p-6 rounded-2xl shadow-sm hover:shadow-premium transition-all glow-hover">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center mb-5 border border-purple-500/20 shadow-sm">
                <Cpu className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-extrabold text-foreground text-sm uppercase tracking-wide">Mutation Engine</h3>
              <p className="text-xs text-secondary font-semibold leading-relaxed mt-2.5">Node-powered parameter fuzzing, mutating headers, query strings, and payload IDs dynamically.</p>
            </div>

            <div className="bg-white border border-border p-6 rounded-2xl shadow-sm hover:shadow-premium transition-all glow-hover">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-5 border border-amber-500/20 shadow-sm">
                <Key className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="font-extrabold text-foreground text-sm uppercase tracking-wide">JWT Token Analysis</h3>
              <p className="text-xs text-secondary font-semibold leading-relaxed mt-2.5">Deep inspections on cryptographic signing algorithms, signature strength, and expiration claims.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 text-slate-400 py-8 px-6 md:px-12 text-center text-xs font-semibold">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-primary" />
            <span className="font-extrabold text-slate-200">TrustLayer Labs API Shield</span>
          </div>
          <div className="text-slate-500">
            &copy; 2026 TrustLayer Labs. All rights reserved. Deployment Ready.
          </div>
        </div>
      </footer>
    </div>
  )
}
