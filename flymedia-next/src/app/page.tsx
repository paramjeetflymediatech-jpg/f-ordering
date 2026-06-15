'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  Search, 
  Code2, 
  TrendingUp, 
  Award, 
  Users2, 
  CheckCircle,
  Building,
  Sparkles
} from 'lucide-react';

export default function Home() {
  const highlights = [
    {
      title: 'SEO Marketing',
      desc: 'Grow organic ranking, search signals, and capture high-intent inquiries.',
      icon: Search,
      color: 'text-orange-500 bg-orange-500/10 border-orange-500/20'
    },
    {
      title: 'Web Development',
      desc: 'Deploy blazing fast static and dynamic storefronts built in Next.js.',
      icon: Code2,
      color: 'text-sky-500 bg-sky-500/10 border-sky-500/20'
    },
    {
      title: 'PPC Management',
      desc: 'Strategic Google & Social media search ads optimized for maximum ROI.',
      icon: TrendingUp,
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
    }
  ];

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-slate-900 py-28 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(249,115,22,0.15),transparent_40%),radial-gradient(circle_at_70%_70%,rgba(59,130,246,0.12),transparent_40%)]" />
        <div className="container relative z-10 mx-auto px-6 text-center max-w-4xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-orange-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-orange-400 border border-orange-500/20">
            <Sparkles className="h-4 w-4" /> Leading Digital Innovation Agency
          </span>
          <h1 className="mt-6 text-5xl font-black tracking-tight sm:text-7xl text-white leading-none">
            Scaling Digital Brands Through
            <span className="block mt-3 bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent">
              SEO, Design & Development
            </span>
          </h1>
          <p className="mt-6 text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            We build high-converting, performance-centric web applications and implement authority search engine optimization strategies that drive organic sales.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link 
              href="/order-online/f-ordering-foods/menu" 
              className="rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 px-6 py-4 text-sm font-bold text-white shadow-lg hover:from-orange-500 hover:to-amber-400 transition"
            >
              Order Online Menu
            </Link>
            <Link 
              href="/services" 
              className="rounded-xl border border-orange-500 text-orange-400 hover:bg-orange-500 hover:text-white px-6 py-4 text-sm font-bold transition"
            >
              Explore Our Services
            </Link>
            <Link 
              href="/contact" 
              className="rounded-xl border border-slate-700 bg-slate-800/40 px-6 py-4 text-sm font-bold text-white hover:bg-slate-800 hover:border-slate-600 transition"
            >
              Get Free Consultation
            </Link>
          </div>
        </div>
      </section>

      {/* 2. SERVICES HIGHLIGHT */}
      <section className="container mx-auto px-6 py-20 max-w-5xl">
        <div className="text-center max-w-xl mx-auto mb-16">
          <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">Core Capabilities</h2>
          <p className="text-slate-500 text-sm mt-2">
            Engineered to scale client customer bases and build reliable technical foundations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {highlights.map((item) => {
            const Icon = item.icon;
            return (
              <div 
                key={item.title}
                className="bg-white rounded-3xl p-6 border border-slate-200/50 shadow-sm flex flex-col justify-between hover:shadow-xl hover:border-slate-300 transition duration-300 group"
              >
                <div>
                  <div className={`p-3.5 rounded-2xl w-12 h-12 flex items-center justify-center border ${item.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-5 group-hover:text-orange-600 transition">
                    {item.title}
                  </h3>
                  <p className="text-slate-600 text-sm mt-3 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <Link 
                    href="/services" 
                    className="text-xs font-bold text-orange-600 hover:text-orange-500 flex items-center gap-1.5"
                  >
                    Learn More <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SaaS Partnership Section */}
      <section className="bg-slate-100 py-20 border-y border-slate-200">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">Partner Program</span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-2">Become a Tech Partner</h2>
            <p className="text-slate-500 text-sm mt-2">
              Subscribe to our high-performance SaaS solutions tailored for the hospitality and retail industry.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* POS Subscription Card */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-sm flex flex-col justify-between hover:shadow-xl transition group">
              <div>
                <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-orange-600 bg-orange-100 rounded-full">Hospitality SaaS</span>
                <h3 className="text-2xl font-black text-slate-900 mt-4">Restaurant POS & Booking Platform</h3>
                <p className="text-slate-600 text-sm mt-3 leading-relaxed">
                  Get our full cloud-based POS Terminal, online QR menu ordering, table reservation manager, discount coupon campaigns, and customer loyalty databases.
                </p>
                <ul className="mt-6 space-y-2">
                  {['Cloud POS Terminal Console', 'Online Ordering & Guest Booking', 'Real-Time KDS Kitchen Updates', 'Loyalty Program & Coupon Manager'].map((feat) => (
                    <li key={feat} className="text-xs text-slate-600 font-semibold flex items-center gap-2">
                      <span className="h-1.5 w-1.5 bg-orange-500 rounded-full" />
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-8 pt-6 border-t border-slate-100">
                <Link href="/register" className="w-full flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 transition py-3 rounded-xl text-xs font-bold text-white">
                  Become a POS Partner <ArrowRight className="h-4 w-4 text-orange-400" />
                </Link>
              </div>
            </div>
            
            {/* Hospitality Web Services Card */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-sm flex flex-col justify-between hover:shadow-xl transition group">
              <div>
                <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-600 bg-sky-100 rounded-full">Custom Web Services</span>
                <h3 className="text-2xl font-black text-slate-900 mt-4">Hospitality Web Services</h3>
                <p className="text-slate-600 text-sm mt-3 leading-relaxed">
                  Establish a custom, lightning-fast SEO-optimized website for your hotels, catering business, or cafe chains fully custom-branded.
                </p>
                <ul className="mt-6 space-y-2">
                  {['Bespoke responsive web design', 'High-performance Next.js architectures', 'Google Maps & Local SEO integration', 'Direct reservations & contact workflows'].map((feat) => (
                    <li key={feat} className="text-xs text-slate-600 font-semibold flex items-center gap-2">
                      <span className="h-1.5 w-1.5 bg-sky-500 rounded-full" />
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-8 pt-6 border-t border-slate-100">
                <Link href="/contact?service=web-design" className="w-full flex items-center justify-center gap-1.5 bg-sky-600 hover:bg-sky-500 transition py-3 rounded-xl text-xs font-bold text-white">
                  Inquire Web Services <ArrowRight className="h-4 w-4 text-white" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. VALUE PROPOSITION */}
      <section className="bg-slate-900 py-20 text-white border-y border-slate-800">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="text-xs font-bold text-orange-400 uppercase tracking-widest">Why Flymedia Tech</span>
              <h2 className="text-3xl font-extrabold text-white sm:text-4xl leading-tight">
                Designed for Performance, Built for Conversion
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                As a digital agency, we understand that beauty without performance does not yield business growth. That is why our products focus on page speeds, semantic search structures, and conversion optimization pipelines.
              </p>
              <div className="space-y-3 pt-2">
                {[
                  '100% Mobile responsive frameworks',
                  'Optimized Next.js and static site speed metrics',
                  'Transparent reporting on SEO rankings & ad spend',
                ].map((point) => (
                  <div key={point} className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                    <CheckCircle className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
                    {point}
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Active Clients', val: '80+', icon: Users2, color: 'text-sky-400 bg-sky-950/40 border-sky-900/30' },
                { label: 'SaaS Platforms', val: '12+', icon: Building, color: 'text-orange-400 bg-orange-950/40 border-orange-900/30' },
                { label: 'Awards Won', val: '5+', icon: Award, color: 'text-purple-400 bg-purple-950/40 border-purple-900/30' },
                { label: 'ROI Growth', val: '3.5x', icon: TrendingUp, color: 'text-emerald-400 bg-emerald-950/40 border-emerald-900/30' }
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <div 
                    key={stat.label}
                    className={`p-5 rounded-2xl border flex flex-col justify-between h-32 ${stat.color}`}
                  >
                    <Icon className="h-6 w-6" />
                    <div>
                      <p className="text-2xl font-black text-white">{stat.val}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-wider">{stat.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 4. FINAL CALL TO ACTION */}
      <section className="py-24 bg-white text-center">
        <div className="container mx-auto px-6 max-w-3xl">
          <h2 className="text-3xl font-black text-slate-900 sm:text-5xl">
            Ready to Scale Your Brand Online?
          </h2>
          <p className="mt-4 text-slate-500 max-w-md mx-auto text-sm sm:text-base">
            Reach out to our experts to schedule a technical SEO audit or software strategy session.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link 
              href="/contact" 
              className="rounded-xl bg-orange-600 hover:bg-orange-500 transition px-6 py-3.5 text-sm font-bold text-white shadow-lg"
            >
              Get Free Strategy Draft
            </Link>
            <Link 
              href="/portfolio" 
              className="rounded-xl border border-slate-200 px-6 py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              View Client Projects
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
