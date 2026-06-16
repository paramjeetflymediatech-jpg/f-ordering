'use client';

import React from 'react';

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
    <section className="py-24 border-b border-slate-800">
      <div className="container mx-auto px-6 max-w-5xl">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold text-orange-500 uppercase tracking-widest">Real Results</span>
          <h2 className="text-3xl font-extrabold text-white mt-2 sm:text-4xl">Client Growth Case Studies</h2>
          <p className="text-slate-400 text-sm mt-3 leading-relaxed">
            Verify how partners eliminated operational bottlenecks and drove significant top-line revenue growths.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {caseStudies.map((cs) => (
            <div 
              key={cs.brand}
              className="bg-slate-900/40 border border-slate-850 rounded-3xl p-8 flex flex-col justify-between hover:border-slate-800 transition"
            >
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xl font-extrabold text-white">{cs.brand}</h3>
                    <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">{cs.outlets}</p>
                  </div>
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-black uppercase tracking-wider px-4 py-2 rounded-full">
                    {cs.growth}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Before list */}
                  <div className="space-y-3 p-4 rounded-2xl bg-red-500/5 border border-red-500/10">
                    <span className="text-[10px] font-black text-red-400 uppercase tracking-widest block mb-2">Before POS Platform</span>
                    {cs.before.map((item) => (
                      <div key={item} className="text-[11px] font-bold text-slate-400 flex items-start gap-1.5">
                        <span className="text-red-400 shrink-0">✕</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>

                  {/* After list */}
                  <div className="space-y-3 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block mb-2">After POS Platform</span>
                    {cs.after.map((item) => (
                      <div key={item} className="text-[11px] font-bold text-slate-300 flex items-start gap-1.5">
                        <span className="text-emerald-400 shrink-0">✓</span>
                        <span>{item}</span>
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
