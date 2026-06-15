'use client';

import React, { useState } from 'react';
import { ExternalLink, Tag, ShieldCheck, Sparkles, TrendingUp, Laptop } from 'lucide-react';

export default function PortfolioPage() {
  const projects = [
    {
      title: 'Twirll SaaS Restaurant Platform',
      category: 'Web Development',
      description: 'A robust multi-tenant POS and Online Table Booking storefront with instant kitchen KDS updates and dark-mode loyalty console.',
      tech: ['Next.js 15', 'Sequelize ORM', 'MySQL', 'Socket.io', 'TailwindCSS'],
      metric: '+140% Order Volumes',
      link: '/register',
    },
    {
      title: 'Apex Real Estate Portal',
      category: 'Web Applications',
      description: 'High-performance property search directory featuring integrated maps, real-time agent chats, and client onboarding pipeline.',
      tech: ['React', 'Node.js', 'Express', 'Google Maps API', 'MongoDB'],
      metric: '400k+ Monthly Visits',
      link: '#',
    },
    {
      title: 'Urban Threads E-Shop',
      category: 'E-Commerce',
      description: 'Fully tailored fashion storefront featuring headless checkout, automated shipping rules, and custom filter builders.',
      tech: ['React.js', 'Redux Toolkit', 'Stripe Sync', 'Framer Motion'],
      metric: '32% Conversion Boost',
      link: '#',
    },
    {
      title: 'Solar Clean Energy SEO Campaign',
      category: 'Search Marketing',
      description: 'Enterprise search optimization program restructuring site indexation and acquiring authority backlinks for green tech.',
      tech: ['SEO Audit', 'Content Strategy', 'Link Building', 'PageSpeed Tune'],
      metric: '+185% Google Traffic',
      link: '#',
    },
  ];

  const categories = ['All', 'Web Development', 'Web Applications', 'E-Commerce', 'Search Marketing'];
  const [activeTab, setActiveTab] = useState('All');

  const filteredProjects = projects.filter(
    (p) => activeTab === 'All' || p.category === activeTab
  );

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* 1. HERO HEADER */}
      <section className="relative overflow-hidden bg-slate-900 py-24 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(249,115,22,0.15),transparent_40%),radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.1),transparent_40%)]" />
        <div className="container relative z-10 mx-auto px-6 text-center max-w-4xl">
          <span className="inline-block rounded-full bg-orange-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-orange-400 border border-orange-500/20">
            Case Studies & Showcases
          </span>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl text-white">
            Our Proven Track Record
            <span className="block mt-2 bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent">
              of Scaling Businesses
            </span>
          </h1>
          <p className="mt-6 text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Browse our catalog of custom web applications, SaaS platform provisions, and technical SEO results delivered with high attention to performance.
          </p>
        </div>
      </section>

      {/* 2. FILTER TABS */}
      <section className="container mx-auto px-6 pt-12 pb-6 max-w-5xl">
        <div className="flex flex-wrap gap-2 justify-center border-b border-slate-200 pb-6">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                activeTab === cat
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 hover:text-slate-900 border-slate-200 hover:border-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* 3. CASE STUDIES GRID */}
      <section className="container mx-auto px-6 pb-24 max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
          {filteredProjects.map((proj) => (
            <div
              key={proj.title}
              className="bg-white rounded-3xl overflow-hidden border border-slate-200/50 shadow-sm flex flex-col justify-between hover:shadow-xl hover:border-slate-300 transition-all duration-300 group"
            >
              {/* Cover card representation */}
              <div className="bg-slate-900 p-8 relative overflow-hidden aspect-video flex flex-col justify-between border-b border-slate-100">
                <div className="absolute inset-0 bg-gradient-to-tr from-orange-600 to-amber-500 opacity-10 group-hover:opacity-20 transition" />
                <div className="flex justify-between items-start z-10">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-bold text-white uppercase tracking-wider">
                    <Tag className="h-3 w-3 text-orange-400" /> {proj.category}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 rounded-full text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                    <TrendingUp className="h-3 w-3" /> {proj.metric}
                  </span>
                </div>
                <div className="z-10 mt-8">
                  <Laptop className="h-12 w-12 text-orange-500 mb-3 group-hover:scale-110 transition duration-300" />
                  <h3 className="text-xl font-bold text-white group-hover:text-orange-400 transition">
                    {proj.title}
                  </h3>
                </div>
              </div>

              {/* Card info */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-slate-600 text-sm leading-relaxed">{proj.description}</p>
                  <div className="flex flex-wrap gap-1.5 mt-5">
                    {proj.tech.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-semibold"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" /> Verified Case Study
                  </span>
                  <a
                    href={proj.link}
                    className="text-xs font-bold text-orange-600 hover:text-orange-500 transition flex items-center gap-1 group-hover:underline"
                  >
                    View Project <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
