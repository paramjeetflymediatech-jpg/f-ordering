'use client';

import React from 'react';
import { Smartphone, Search, Bell, Laptop, Percent, TrendingUp } from 'lucide-react';

export default function WorkflowSection() {
  return (
    <section className="py-28 border-b border-slate-900 bg-[#030712] relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(59,130,246,0.02),transparent_40%)]" />
      
      <div className="container relative z-10 mx-auto px-6 max-w-6xl">
        <div className="text-center max-w-2xl mx-auto mb-20">
          <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
            Seamless Ordering Journey
          </span>
          <h2 className="text-3xl font-extrabold text-white mt-4 sm:text-4xl tracking-tight leading-tight">
            How The Platform Works
          </h2>
          <p className="text-slate-400 text-sm mt-4 leading-relaxed max-w-md mx-auto">
            Trace orders automatically from tables to kitchens and sync live payment summaries instantly.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6 relative">
          {[
            { step: '1', title: 'Scan Table QR', desc: 'Customer scans table QR to open digital menu.', icon: Smartphone },
            { step: '2', title: 'Place Order', desc: 'Adds dishes, customize sides, and sends order.', icon: Search },
            { step: '3', title: 'KDS Receives', desc: 'Kitchen displays orders on monitor instantly.', icon: Bell },
            { step: '4', title: 'POS Syncs', desc: 'POS cash register updates automatically.', icon: Laptop },
            { step: '5', title: 'Collect Pay', desc: 'Secures check via UPI, Card, or Cash receipts.', icon: Percent },
            { step: '6', title: 'Live Analytics', desc: 'SaaS logs raw revenue, stock, and staff reports.', icon: TrendingUp }
          ].map((flow) => {
            const Icon = flow.icon;
            return (
              <div 
                key={flow.step} 
                className="bg-gradient-to-b from-slate-900/40 to-slate-950/20 border border-slate-850 p-6 rounded-2xl relative flex flex-col justify-between hover:border-orange-500/30 hover:shadow-lg transition-all duration-250 transform hover:-translate-y-0.5 group"
              >
                {/* Step counter */}
                <span className="absolute top-4 right-4 h-6 w-6 rounded-full bg-orange-500/10 flex items-center justify-center text-[10px] font-black text-orange-500 border border-orange-500/20 group-hover:bg-orange-500 group-hover:text-white transition duration-200">
                  {flow.step}
                </span>
                
                <div>
                  <Icon className="h-6 w-6 text-orange-500 mb-6 group-hover:scale-105 transition" />
                  <h4 className="text-xs font-black text-white">{flow.title}</h4>
                  <p className="text-[10px] text-slate-450 mt-2.5 leading-relaxed">{flow.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
