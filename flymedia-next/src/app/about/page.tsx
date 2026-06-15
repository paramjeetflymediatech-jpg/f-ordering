'use client';

import React from 'react';
import { Award, ShieldCheck, Heart, Sparkles, Building2, Flame } from 'lucide-react';

export default function AboutPage() {
  const stats = [
    { label: 'Successful Projects', value: '150+' },
    { label: 'Active Clients', value: '80+' },
    { label: 'Years Experience', value: '8+' },
    { label: 'Digital Experts', value: '25+' },
  ];

  const values = [
    {
      title: 'Innovation First',
      desc: 'We adopt the latest web technologies and SEO strategies to keep our clients ahead of their competition.',
      icon: Sparkles,
      color: 'text-orange-500 bg-orange-50',
    },
    {
      title: 'Absolute Transparency',
      desc: 'No hidden metrics. We deliver comprehensive reports on rankings, campaign spending, and analytics.',
      icon: ShieldCheck,
      color: 'text-emerald-500 bg-emerald-50',
    },
    {
      title: 'Client-Centric Growth',
      desc: 'We succeed when your business grows. Every line of code and keyword targeting is chosen to deliver ROI.',
      icon: Heart,
      color: 'text-rose-505 bg-rose-50',
    },
    {
      title: 'High-Quality Standards',
      desc: 'Our projects are designed with pixel perfection, clean code, rapid speeds, and robust SEO practices.',
      icon: Award,
      color: 'text-blue-500 bg-blue-50',
    },
  ];

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-slate-900 py-24 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(249,115,22,0.15),transparent_40%),radial-gradient(circle_at_70%_70%,rgba(59,130,246,0.1),transparent_40%)]" />
        <div className="container relative z-10 mx-auto px-6 text-center max-w-4xl">
          <span className="inline-block rounded-full bg-orange-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-orange-400 border border-orange-500/20">
            About Flymedia Tech
          </span>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl text-white">
            We Build Solutions That
            <span className="block mt-2 bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent">
              Empower Digital Brands
            </span>
          </h1>
          <p className="mt-6 text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Flymedia Tech is an agile agency specialized in SEO marketing, bespoke web development, and customer acquisition strategies designed for sustainable growth.
          </p>
        </div>
      </section>

      {/* 2. STATS SECTION */}
      <section className="container mx-auto px-6 -mt-10 relative z-20 max-w-5xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl sm:text-4xl font-extrabold text-slate-900">{stat.value}</p>
              <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1 uppercase tracking-wider">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. CORE STORY */}
      <section className="container mx-auto px-6 py-20 max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-extrabold text-slate-900 leading-tight">
              Driving Digital Excellence Since 2018
            </h2>
            <p className="text-slate-600 leading-relaxed">
              Founded on the belief that digital presence should yield measurable commercial outcomes, Flymedia Tech has grown from a core SEO consultancy to a comprehensive full-service digital agency.
            </p>
            <p className="text-slate-600 leading-relaxed">
              We leverage modern design paradigms like Tailwind CSS and frameworks like Next.js to deliver high-performance client solutions. Simultaneously, our analytics-driven SEO techniques ensure businesses gain maximum organic search visibility.
            </p>
            <div className="flex gap-4 pt-2">
              <div className="flex items-center gap-2 text-sm font-bold text-orange-600">
                <Flame className="h-5 w-5" /> Creative Design
              </div>
              <div className="flex items-center gap-2 text-sm font-bold text-orange-600">
                <Building2 className="h-5 w-5" /> Enterprise Scale
              </div>
            </div>
          </div>
          <div className="relative rounded-3xl overflow-hidden aspect-video md:aspect-square bg-slate-900 shadow-2xl flex items-center justify-center p-8 border border-slate-800">
            <div className="absolute inset-0 bg-gradient-to-tr from-orange-600 to-amber-500 opacity-20" />
            <div className="z-10 text-center space-y-4">
              <Building2 className="h-16 w-16 text-orange-500 mx-auto animate-bounce" />
              <div className="text-white text-xl font-bold font-mono">Ludhiana Corporate Hub</div>
              <p className="text-slate-400 text-xs max-w-xs mx-auto">
                Headquartered in Punjab, serving ambitious clients globally.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. VALUES SECTION */}
      <section className="bg-slate-100/60 py-20 border-y border-slate-200/50">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center max-w-xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900">Our Core Principles</h2>
            <p className="text-slate-500 text-sm mt-2">
              The fundamental guidelines that steer our design sprints, code architectures, and strategy alignments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {values.map((val) => {
              const Icon = val.icon;
              return (
                <div
                  key={val.title}
                  className="bg-white p-8 rounded-2xl border border-slate-200/40 shadow-sm flex gap-6 hover:shadow-md hover:border-slate-200 transition"
                >
                  <div className={`p-4 rounded-xl shrink-0 h-14 w-14 flex items-center justify-center ${val.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{val.title}</h3>
                    <p className="text-slate-600 text-sm mt-2 leading-relaxed">{val.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. CTA SECTION */}
      <section className="py-20 text-center bg-white">
        <div className="container mx-auto px-6 max-w-3xl">
          <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Let&apos;s Build Something Extraordinary Together
          </h2>
          <p className="mt-4 text-slate-500 max-w-lg mx-auto text-sm sm:text-base">
            Work with an agency committed to crafting beautiful user interfaces and result-driven marketing campaigns.
          </p>
          <div className="mt-8">
            <a href="/contact" className="btn inline-flex items-center gap-2">
              Get Started Today
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
