"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, ArrowRight, ArrowLeft, X, CheckCircle, HelpCircle } from "lucide-react"
import { Card } from "./ui/card"

interface TourStep {
  title: string;
  description: string;
  viewId?: string;
}

interface OnboardingTourProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onClose: () => void;
}

export function OnboardingTour({ currentView, onNavigate, onClose }: OnboardingTourProps) {
  const [stepIndex, setStepIndex] = useState(0)

  const steps: TourStep[] = [
    {
      title: "Welcome to TrustLayer Studio",
      description: "This is a live, production-grade API Security Testing Platform. Let's take a quick 1-minute tour of its capabilities.",
      viewId: "executive_dashboard"
    },
    {
      title: "Executive SOC Hub",
      description: "Monitor real-time risk scores, active cluster workers, and priority queues. All metrics are live database streams.",
      viewId: "executive_dashboard"
    },
    {
      title: "Discovery & Schema Crawler",
      description: "Import Swagger / OpenAPI specs, select target endpoints, and configure authentication credentials.",
      viewId: "endpoint_discovery"
    },
    {
      title: "Parameter Mutation Engine",
      description: "Fuzz parameters with boundary inputs, integer overflows, and path traversals to locate payload validation flaws.",
      viewId: "mutation_engine"
    },
    {
      title: "User & Tenant Role Swapper",
      description: "Swap JWT credentials and headers across requests to detect Privilege Escalation (BFLA) and Tenant Leakage (BOLA).",
      viewId: "role_swapping"
    },
    {
      title: "Distributed Worker Cluster",
      description: "Orchestrate scaling worker engines, modify maximum thread concurrency, and view stdout log telemetry.",
      viewId: "async_execution"
    },
    {
      title: "OWASP Vulnerability Reports",
      description: "Regenerate reports, export PDF manuals, and explore remediation blueprints mapped to CVSS scores.",
      viewId: "reports"
    }
  ]

  const currentStep = steps[stepIndex]

  const handleNext = () => {
    if (stepIndex < steps.length - 1) {
      const nextIndex = stepIndex + 1
      setStepIndex(nextIndex)
      if (steps[nextIndex].viewId) {
        onNavigate(steps[nextIndex].viewId!)
      }
    } else {
      onClose()
    }
  }

  const handlePrev = () => {
    if (stepIndex > 0) {
      const prevIndex = stepIndex - 1
      setStepIndex(prevIndex)
      if (steps[prevIndex].viewId) {
        onNavigate(steps[prevIndex].viewId!)
      }
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 50 }}
        className="fixed bottom-6 right-6 z-[100] max-w-sm"
      >
        <Card className="p-6 bg-[#0F172A] text-white border-primary/40 shadow-floating relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-2xl pointer-events-none -translate-y-1/2 translate-x-1/4"></div>

          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="space-y-4 relative z-10">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="w-5 h-5 text-primary animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest bg-primary/20 border border-primary/30 px-2 py-0.5 rounded">
                Guided Tour
              </span>
            </div>

            <div className="space-y-1.5">
              <h4 className="font-black text-sm uppercase tracking-wide text-foreground">
                {currentStep.title}
              </h4>
              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                {currentStep.description}
              </p>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-[10px]">
              <span className="text-slate-400 font-bold">
                Step {stepIndex + 1} of {steps.length}
              </span>

              <div className="flex gap-2">
                {stepIndex > 0 && (
                  <button
                    onClick={handlePrev}
                    className="p-1.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white cursor-pointer transition-all flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3 h-3" />
                  </button>
                )}
                <button
                  onClick={handleNext}
                  className="px-3.5 py-1.5 bg-primary hover:bg-primary-hover border border-primary/20 rounded-lg text-white font-black uppercase tracking-widest cursor-pointer transition-all flex items-center gap-1"
                >
                  {stepIndex === steps.length - 1 ? "Finish" : "Next"}
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}
