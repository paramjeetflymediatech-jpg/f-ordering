'use client';

import React, { useState } from 'react';
import { ArrowRight, Check, MessageCircle, Lock, Database, ShieldCheck, RefreshCw } from 'lucide-react';

export default function LeadGeneration() {
  const [demoSubmitted, setDemoSubmitted] = useState(false);

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDemoSubmitted(true);
  };

  return (
    <>
      <section id="demo-form" className="py-28 border-b border-slate-900 bg-[#030712] relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_80%,rgba(0,98,255,0.015),transparent_40%)]" />
        
        <div className="container relative z-10 mx-auto px-6 max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
            
            {/* Consultation Form Info */}
            <div className="lg:col-span-5 space-y-8 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
                  Get Started
                </span>
                <h2 className="text-3xl font-extrabold text-white mt-5 leading-tight tracking-tight">
                  Request A Free Strategy Call
                </h2>
                <p className="text-slate-400 text-xs sm:text-sm mt-4 leading-relaxed">
                  Fill out the consultation form to schedule a live POS terminal workflow demonstration configured specifically for your restaurant menu.
                </p>
              </div>

              <div className="space-y-4 p-6 rounded-2xl bg-slate-900/30 border border-slate-850">
                <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest block">Instant Live Chat</span>
                <p className="text-slate-450 text-xs leading-relaxed">
                  Prefer direct messaging? Connect instantly with our restaurant support desk via WhatsApp.
                </p>
                <a 
                  href="https://wa.me/15550199" 
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-550 transition-all duration-200 px-5 py-3.5 text-xs font-black text-white shadow-md uppercase tracking-wider"
                >
                  <MessageCircle className="h-4 w-4" />
                  Chat on WhatsApp
                </a>
              </div>
            </div>

            {/* Live Demo lead form */}
            <div className="lg:col-span-7 bg-slate-900/40 border border-slate-850 p-8 sm:p-10 rounded-3xl shadow-2xl backdrop-blur relative">
              {demoSubmitted ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-16 animate-fade-in">
                  <div className="h-14 w-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5">
                    <Check className="h-6 w-6 text-emerald-450" />
                  </div>
                  <h3 className="text-xl font-extrabold text-white">Request Received Successfully!</h3>
                  <p className="text-xs text-slate-450 mt-3 max-w-sm leading-relaxed">
                    Our restaurant POS specialist will reach out to you within 2 business hours on the phone number provided.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleDemoSubmit} className="space-y-6">
                  <div>
                    <h3 className="text-base font-black text-white">Book Live POS Terminal Demo</h3>
                    <p className="text-slate-450 text-xs mt-1">Schedule a 1-on-1 walkthrough configured to your menu style.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-black uppercase text-slate-400 mb-1.5 tracking-wider">Your Name</label>
                      <input 
                        type="text" 
                        required
                        placeholder="John Doe" 
                        className="w-full rounded-xl bg-slate-950/80 border border-slate-850 px-4 py-3.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500/80 focus:ring-1 focus:ring-orange-500/30 transition duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black uppercase text-slate-400 mb-1.5 tracking-wider">Business Email</label>
                      <input 
                        type="email" 
                        required
                        placeholder="john@restaurant.com" 
                        className="w-full rounded-xl bg-slate-950/80 border border-slate-850 px-4 py-3.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500/80 focus:ring-1 focus:ring-orange-500/30 transition duration-200"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-black uppercase text-slate-400 mb-1.5 tracking-wider">Phone Number</label>
                      <input 
                        type="tel" 
                        required
                        placeholder="+1 555-0199" 
                        className="w-full rounded-xl bg-slate-950/80 border border-slate-850 px-4 py-3.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500/80 focus:ring-1 focus:ring-orange-500/30 transition duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black uppercase text-slate-400 mb-1.5 tracking-wider">Restaurant Name</label>
                      <input 
                        type="text" 
                        required
                        placeholder="The Pizza Place" 
                        className="w-full rounded-xl bg-slate-950/80 border border-slate-850 px-4 py-3.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500/80 focus:ring-1 focus:ring-orange-500/30 transition duration-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-black uppercase text-slate-400 mb-1.5 tracking-wider">Number of Outlets</label>
                    <select className="w-full rounded-xl bg-slate-950/80 border border-slate-850 px-4 py-3.5 text-xs text-slate-400 focus:outline-none focus:border-orange-500/80 focus:ring-1 focus:ring-orange-500/30 transition duration-200 appearance-none">
                      <option>1 Outlet</option>
                      <option>2 - 5 Outlets</option>
                      <option>6 - 15 Outlets</option>
                      <option>16+ Outlets</option>
                    </select>
                  </div>

                  <button 
                    type="submit"
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-650 hover:to-orange-650 py-4 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-orange-500/10 transition duration-200"
                  >
                    Request Live Demo
                    <ArrowRight className="h-4 w-4 text-white" />
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* Trust & Security section */}
      <section className="py-24 bg-[#020617]">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-center border border-slate-850 bg-slate-900/20 p-10 rounded-3xl backdrop-blur">
            <div className="md:col-span-2 space-y-4">
              <h3 className="text-xl font-extrabold text-white tracking-tight">Trust, Security & Compliances</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Your menu listings, recipe inventory costs, payment logs, and client databases are protected with high-tier cloud security encryptions.
              </p>
            </div>

            <div className="md:col-span-3 grid grid-cols-2 gap-6">
              {[
                { title: 'Secure Cloud SSL', desc: 'SHA-256 SSL Encryption enabled.', icon: Lock },
                { title: 'Daily DB Backups', desc: 'Secure cloud automated dumps.', icon: Database },
                { title: 'GDPR Compliant', desc: 'Strict customer privacy safety.', icon: ShieldCheck },
                { title: 'PCI DSS Standards', desc: 'Safe payment processing paths.', icon: RefreshCw }
              ].map((badge) => {
                const Icon = badge.icon;
                return (
                  <div key={badge.title} className="flex gap-2">
                    <Icon className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-200 leading-tight">{badge.title}</h4>
                      <p className="text-[10px] text-slate-450 mt-1 leading-normal">{badge.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
