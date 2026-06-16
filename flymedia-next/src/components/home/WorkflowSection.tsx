'use client';

import React from 'react';
import { Smartphone, Search, Bell, Laptop, Percent, TrendingUp } from 'lucide-react';

export default function WorkflowSection() {
  return (
    <section className="py-24 border-b border-slate-800 relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(59,130,246,0.05),transparent_40%)]" />
      
      <div className="container relative z-10 mx-auto px-6 max-w-6xl">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold text-orange-500 uppercase tracking-widest">Seamless Ordering Journey</span>
          <h2 className="text-3xl font-extrabold text-white mt-2 sm:text-4xl">How The Platform Works</h2>
          <p className="text-slate-400 text-sm mt-3 leading-relaxed">
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
              <div key={flow.step} className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl relative flex flex-col justify-between hover:border-orange-500/20 transition duration-200">
                {/* Step counter */}
                <span className="absolute top-4 right-4 h-6 w-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-black text-orange-500 border border-slate-700">
                  {flow.step}
                </span>
                
                <div>
                  <Icon className="h-6 w-6 text-orange-500 mb-5" />
                  <h4 className="text-sm font-extrabold text-white">{flow.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">{flow.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
