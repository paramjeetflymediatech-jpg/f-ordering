'use client';

import React, { useState, useEffect } from 'react';
import * as Lucide from 'lucide-react';
import { ChevronRight, Sparkles } from 'lucide-react';

interface Package {
  id: string;
  name: string;
  price: string;
  billing_cycle: string;
  features: string[];
  is_popular: boolean;
}

interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  highlights: string[];
  packages?: Package[];
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/public/services')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setServices(data.services || []);
        } else {
          setError(data.message || 'Failed to load services.');
        }
      })
      .catch((err) => {
        console.error(err);
        setError('Network error fetching services.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* 1. HERO BANNER */}
      <section className="relative overflow-hidden bg-slate-900 py-24 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(0,98,255,0.15),transparent_40%),radial-gradient(circle_at_30%_80%,rgba(0,194,203,0.1),transparent_40%)]" />
        <div className="container relative z-10 mx-auto px-6 text-center max-w-4xl">
          <span className="inline-block rounded-full bg-orange-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-orange-400 border border-orange-500/20">
            Our Digital Core
          </span>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl text-white">
            High-Impact Services to
            <span className="block mt-2 bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent">
              Elevate Your Presence
            </span>
          </h1>
          <p className="mt-6 text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            From coding performance-centric platforms to executing search campaigns, we offer comprehensive expertise to scale your online brand.
          </p>
        </div>
      </section>

      {/* 2. SERVICES LIST GRID */}
      <section className="container mx-auto px-6 py-20 max-w-6xl">
        {loading ? (
          <div className="text-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-t-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-slate-400 font-semibold">Loading our services...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 text-red-500 font-semibold">{error}</div>
        ) : services.length === 0 ? (
          <div className="text-center py-20 text-slate-500">No services currently listed. Check back soon!</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((srv) => {
              // Resolve Lucide Icon dynamically
              const LucideIcon = (Lucide as any)[srv.icon] || Lucide.Sparkles;

              return (
                <div
                  key={srv.id}
                  className="bg-white rounded-3xl p-6 border border-slate-200/50 shadow-sm flex flex-col justify-between hover:shadow-xl hover:border-slate-300/80 transition group"
                >
                  <div>
                    <div className={`p-3.5 rounded-2xl w-12 h-12 flex items-center justify-center border ${srv.color || 'text-orange-500 bg-orange-500/10 border-orange-500/20'}`}>
                      <LucideIcon className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mt-5 group-hover:text-orange-600 transition">
                      {srv.title}
                    </h3>
                    <p className="text-slate-600 text-sm mt-3 leading-relaxed">
                      {srv.description}
                    </p>
                  </div>

                  {/* Highlights section */}
                  {srv.highlights && srv.highlights.length > 0 && (
                    <div className="mt-6 pt-5 border-t border-slate-100">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Key Areas</p>
                      <ul className="space-y-1.5">
                        {srv.highlights.map((hl) => (
                          <li key={hl} className="text-xs text-slate-600 font-semibold flex items-center gap-1.5">
                            <span className="h-1 w-1 bg-orange-500 rounded-full shrink-0" />
                            {hl}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}


                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. APPROACH / FEATURES SUMMARY */}
      <section className="bg-slate-900 py-20 text-white border-t border-slate-800">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-bold text-orange-400 uppercase tracking-widest">Our Methodology</span>
              <h2 className="text-3xl font-extrabold text-white mt-2 leading-tight">
                Designed for Speed, Engineered for Results
              </h2>
              <p className="text-slate-400 text-sm mt-4 leading-relaxed">
                We believe digital growth requires a balanced combination of technical performance and user psychology. That is why our design, SEO, and developer teams collaborate closely on every project.
              </p>
              <div className="mt-6 space-y-4">
                {[
                  'SEO Optimization from day one',
                  'Frictionless responsive interface design',
                  'Rigorous performance and speed checks',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                    <Sparkles className="h-4.5 w-4.5 text-orange-400" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-slate-850 p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
              <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl" />
              <h3 className="text-lg font-bold text-white mb-4">Request a Proposal</h3>
              <p className="text-slate-400 text-xs mb-6">
                Tell us about your brand goals. Our experts will perform a preliminary organic audit and construct a personalized strategy.
              </p>
              <a
                href="/contact"
                className="w-full flex items-center justify-center gap-1.5 bg-orange-600 hover:bg-orange-500 transition py-3 rounded-xl text-xs font-bold text-white"
              >
                Let&apos;s Connect <ChevronRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
