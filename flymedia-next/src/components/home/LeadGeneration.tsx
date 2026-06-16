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
      <section id="demo-form" className="py-24 border-b border-slate-800 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_80%,rgba(0,98,255,0.1),transparent_40%)]" />
        
        <div className="container relative z-10 mx-auto px-6 max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
            
            {/* Consultation Form Info */}
            <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-orange-500 uppercase tracking-widest">Get Started</span>
                <h2 className="text-3xl font-extrabold text-white mt-2 leading-tight">Request A Free Strategy Call</h2>
                <p className="text-slate-400 text-xs mt-3 leading-relaxed">
                  Fill out the consultation form to schedule a live POS terminal workflow demonstration configured specifically for your restaurant menu.
                </p>
              </div>

              <div className="space-y-4 p-5 rounded-2xl bg-slate-900/50 border border-slate-800">
                <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest block">Instant Live Chat</span>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Prefer direct messaging? Connect instantly with our restaurant support desk via WhatsApp.
                </p>
                <a 
                  href="https://wa.me/15550199" 
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 transition px-5 py-3 text-xs font-extrabold text-white shadow"
                >
                  <MessageCircle className="h-4 w-4" />
                  Chat on WhatsApp
                </a>
              </div>
            </div>

            {/* Live Demo lead form */}
            <div className="lg:col-span-7 bg-slate-900/70 border border-slate-800 p-8 rounded-3xl shadow-xl backdrop-blur relative">
              {demoSubmitted ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                  <div className="h-14 w-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                    <Check className="h-7 w-7 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-extrabold text-white">Request Received Successfully!</h3>
                  <p className="text-xs text-slate-450 mt-2 max-w-sm">
                    Our restaurant POS specialist will reach out to you within 2 business hours on the phone number provided.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleDemoSubmit} className="space-y-5">
                  <h3 className="text-lg font-black text-white">Book Live POS Terminal Demo</h3>
                  <p className="text-slate-400 text-xs leading-none">Schedule a 1-on-1 walkthrough configured to your menu style.</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 tracking-wider">Your Name</label>
                      <input 
                        type="text" 
                        required
                        placeholder="John Doe" 
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-xs text-slate-200 focus:outline-none focus:border-orange-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 tracking-wider">Business Email</label>
                      <input 
                        type="email" 
                        required
                        placeholder="john@restaurant.com" 
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-xs text-slate-200 focus:outline-none focus:border-orange-500 transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 tracking-wider">Phone Number</label>
                      <input 
                        type="tel" 
                        required
                        placeholder="+1 555-0199" 
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-xs text-slate-200 focus:outline-none focus:border-orange-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 tracking-wider">Restaurant Name</label>
                      <input 
                        type="text" 
                        required
                        placeholder="The Pizza Place" 
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-xs text-slate-200 focus:outline-none focus:border-orange-500 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 tracking-wider">Number of Outlets</label>
                    <select className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-xs text-slate-450 focus:outline-none focus:border-orange-500 transition">
                      <option>1 Outlet</option>
                      <option>2 - 5 Outlets</option>
                      <option>6 - 15 Outlets</option>
                      <option>16+ Outlets</option>
                    </select>
                  </div>

                  <button 
                    type="submit"
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-90 py-4 text-xs font-black uppercase tracking-wider text-white shadow-lg transition"
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
      <section className="py-20 bg-slate-950">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-center border border-slate-850 bg-slate-900/40 p-10 rounded-3xl backdrop-blur">
            <div className="md:col-span-2 space-y-3">
              <h3 className="text-xl font-extrabold text-white">Trust, Security & Compliances</h3>
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
                      <h4 className="text-xs font-bold text-white leading-tight">{badge.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-1 leading-normal">{badge.desc}</p>
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
