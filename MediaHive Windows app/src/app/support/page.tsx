"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  HelpCircle, Sparkles, Send, FileText, 
  MessageSquare, ChevronDown, CheckCircle2
} from "lucide-react";

export default function SupportPage() {
  const [ticketStatus, setTicketStatus] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    { q: "How do I configure offline media sync?", a: "Go to Settings -> Local Storage and verify your cache limit. Once enabled, folders marked 'offline' will sync local backups automatically." },
    { q: "How do roles inherit in the 3-layer hierarchy?", a: "Permissions are inherited down the chain: Tenant level policies automatically apply to all Institutions, which then cascade down to specific Department Units." }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTicketStatus(true);
    setTimeout(() => setTicketStatus(false), 2500);
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1000px] mx-auto w-full pb-10">
      
      {/* Header */}
      <header className="flex flex-col gap-2 border-b border-white/5 pb-6">
        <div className="flex items-center gap-2 text-sm text-teal-400 font-medium tracking-wider uppercase mb-1">
          <Sparkles size={14} />
          Customer Care
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white m-0">Support & Help</h1>
        <p className="text-zinc-400 m-0 text-sm mt-1">
          Access knowledge guides, resolve issues, or submit support tickets to the team.
        </p>
      </header>

      {/* 2. Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Pane: FAQ list (Lg grid span 2) */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider m-0">Frequently Asked Questions</h3>
          
          <div className="flex flex-col gap-3">
            {faqs.map((faq, idx) => (
              <div 
                key={idx}
                className="studio-card rounded-2xl overflow-hidden group hover:border-indigo-500/30 transition-all"
              >
                <button 
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-4 text-left font-bold text-xs text-zinc-200 hover:text-white transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown size={14} className={`text-zinc-500 transition-transform ${openFaq === idx ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence initial={false}>
                  {openFaq === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-white/5 bg-zinc-950/20 font-sans"
                    >
                      <p className="text-xs text-zinc-450 p-4 m-0 leading-relaxed">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        {/* Right Pane: Ticket form */}
        <div className="studio-panel rounded-2xl p-5 flex flex-col gap-4 lg:sticky lg:top-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 blur-[60px] rounded-full pointer-events-none" />
          <div className="flex items-center justify-between border-b border-white/5 pb-2 relative z-10">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider m-0">Submit Ticket</h3>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 relative z-10">
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Subject</label>
              <input 
                type="text" 
                placeholder="Brief summary..."
                className="bg-zinc-950/40 border border-white/5 rounded-xl px-3.5 py-2 text-xs text-zinc-200 focus:outline-none focus:border-teal-500/50 transition-all font-sans"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Description</label>
              <textarea 
                placeholder="Describe your issue details..."
                rows={4}
                className="bg-zinc-950/40 border border-white/5 rounded-xl px-3.5 py-2 text-xs text-zinc-200 focus:outline-none focus:border-teal-500/50 transition-all font-sans"
              />
            </div>

            <button 
              type="submit"
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white text-xs font-semibold py-2 rounded-xl shadow-lg shadow-teal-500/10 hover:shadow-teal-500/20 transition-all cursor-pointer mt-2"
            >
              <Send size={12} />
              <span>{ticketStatus ? "Sent!" : "Send Ticket"}</span>
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}

