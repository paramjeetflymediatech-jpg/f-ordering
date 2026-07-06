'use client';

import React from 'react';
import { X, Check } from 'lucide-react';

export default function CaseStudies() {
  const caseStudies = [
    {
      brand: 'Mitran Da Dhaba',
      outlets: '5 Outlets',
      before: ['Manual handwritten KOT checks', 'Slow checkout queues & cash errors', 'No customer visit records'],
      after: ['KDS system reduces prep time by 30%', 'POS billing prints checkout slips instantly', 'Direct QR ordering increased average order value by 18%'],
      growth: '+32% Monthly Sales'
    },
    {
      brand: 'Pizzeria Romana',
      outlets: 'Franchise Chain',
      before: ['Stock theft & ingredient wastage', 'Hard to manage multi-branch menus', 'Third-party delivery commissions high'],
      after: ['Centralized inventory alerts on wastage', 'Single-click menu sync across all branches', 'Direct ordering menu saves $2.5K/month on commissions'],
      growth: '2.5x ROI Increase'
    }
  ];

  return (
    <section className="py-28 border-b border-slate-900 bg-[#030712]">
      <div className="container mx-auto px-6 max-w-5xl">
        <div className="text-center max-w-2xl mx-auto mb-20">
          <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
            Real Results
          </span>
          <h2 className="text-3xl font-extrabold text-white mt-4 sm:text-4xl tracking-tight leading-tight">
            Client Growth Case Studies
          </h2>
          <p className="text-slate-400 text-sm mt-4 leading-relaxed max-w-md mx-auto">
            Verify how partners eliminated operational bottlenecks and drove significant top-line revenue growths.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {caseStudies.map((cs) => (
            <div 
              key={cs.brand}
              className="bg-gradient-to-b from-slate-900/40 to-slate-950/20 border border-slate-850/80 rounded-3xl p-8 flex flex-col justify-between hover:border-slate-800 transition duration-300"
            >
              <div>
                <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-900">
                  <div>
                    <h3 className="text-lg font-black text-white">{cs.brand}</h3>
                    <p className="text-[9px] text-slate-500 font-black mt-1 uppercase tracking-widest">{cs.outlets}</p>
                  </div>
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase tracking-wider px-4 py-2 rounded-full">
                    {cs.growth}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Before list */}
                  <div className="space-y-3.5 p-5 rounded-2xl bg-red-500/[0.02] border border-red-500/10">
                    <span className="text-[9px] font-black text-red-400 uppercase tracking-widest block mb-2">Before POS Platform</span>
                    {cs.before.map((item) => (
                      <div key={item} className="text-[10px] font-bold text-slate-400 flex items-start gap-2">
                        <X className="h-3 w-3 text-red-500 shrink-0 mt-0.5" />
                        <span className="leading-snug">{item}</span>
                      </div>
                    ))}
                  </div>

                  {/* After list */}
                  <div className="space-y-3.5 p-5 rounded-2xl bg-emerald-500/[0.02] border border-emerald-500/10">
                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest block mb-2">After POS Platform</span>
                    {cs.after.map((item) => (
                      <div key={item} className="text-[10px] font-bold text-slate-200 flex items-start gap-2">
                        <Check className="h-3 w-3 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="leading-snug">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
