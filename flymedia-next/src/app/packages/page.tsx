'use client';

import React, { useState, useEffect } from 'react';
import * as Lucide from 'lucide-react';
import Link from 'next/link';

interface Package {
  id: string;
  name: string;
  price: string;
  billing_cycle: string;
  features: string[];
  is_popular: boolean;
  service?: {
    id: string;
    title: string;
  };
}

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [billingFilter, setBillingFilter] = useState<'all' | 'monthly' | 'one-time'>('all');

  useEffect(() => {
    fetch('/api/public/packages')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setPackages(data.packages || []);
        } else {
          setError(data.message || 'Failed to load packages.');
        }
      })
      .catch((err) => {
        console.error(err);
        setError('Network error fetching packages.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const filteredPackages = packages.filter((pkg) => {
    if (billingFilter === 'all') return true;
    return pkg.billing_cycle === billingFilter;
  });

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* 1. HERO BANNER */}
      <section className="relative overflow-hidden bg-slate-900 py-24 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(0,98,255,0.15),transparent_40%),radial-gradient(circle_at_30%_80%,rgba(0,194,203,0.1),transparent_40%)]" />
        <div className="container relative z-10 mx-auto px-6 text-center max-w-4xl">
          <span className="inline-block rounded-full bg-orange-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-orange-400 border border-orange-500/20">
            Pricing Plans
          </span>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl text-white">
            Transparent Pricing for
            <span className="block mt-2 bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent">
              Every Stage of Growth
            </span>
          </h1>
          <p className="mt-6 text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Choose the perfect plan to scale your brand. No hidden fees. Fully customizable deliverables.
          </p>

          {/* Filter Toggles */}
          <div className="mt-10 inline-flex items-center gap-1 bg-slate-800 p-1.5 rounded-2xl border border-slate-700">
            <button
              onClick={() => setBillingFilter('all')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                billingFilter === 'all' ? 'bg-orange-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Plans
            </button>
            <button
              onClick={() => setBillingFilter('monthly')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                billingFilter === 'monthly' ? 'bg-orange-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly Subscription
            </button>
            <button
              onClick={() => setBillingFilter('one-time')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                billingFilter === 'one-time' ? 'bg-orange-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              One-Time Projects
            </button>
          </div>
        </div>
      </section>

      {/* 2. PRICING CARDS GRID */}
      <section className="container mx-auto px-6 py-20 max-w-5xl">
        {loading ? (
          <div className="text-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-t-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-slate-400 font-semibold">Loading pricing packages...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 text-red-500 font-semibold">{error}</div>
        ) : filteredPackages.length === 0 ? (
          <div className="text-center py-20 text-slate-500 font-semibold">
            No packages match this filter. Check back soon!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
            {filteredPackages.map((pkg) => (
              <div
                key={pkg.id}
                className={`bg-white rounded-3xl p-8 border shadow-sm flex flex-col justify-between relative transition hover:shadow-2xl ${
                  pkg.is_popular
                    ? 'border-orange-500 ring-2 ring-orange-500/20 md:-translate-y-2'
                    : 'border-slate-200/60 hover:border-slate-350'
                }`}
              >
                {pkg.is_popular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-600 to-amber-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-md">
                    Most Popular
                  </span>
                )}

                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{pkg.name}</h3>
                      {pkg.service && (
                        <span className="inline-block mt-1 text-[10px] font-bold text-orange-500 uppercase tracking-wide">
                          {pkg.service.title}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-4xl font-black text-slate-900">${parseFloat(pkg.price).toFixed(2)}</span>
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                      / {pkg.billing_cycle === 'one-time' ? 'project' : pkg.billing_cycle}
                    </span>
                  </div>

                  <ul className="mt-8 space-y-3.5 border-t border-slate-100 pt-6">
                    {pkg.features.map((feat, index) => (
                      <li key={index} className="flex items-start gap-2.5 text-xs text-slate-600 font-medium">
                        <Lucide.CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8">
                  <Link
                    href="/contact"
                    className={`w-full block text-center py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition ${
                      pkg.is_popular
                        ? 'bg-gradient-to-r from-orange-600 to-amber-500 text-white hover:from-orange-500 hover:to-amber-400 shadow-md shadow-orange-500/10'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    Select Plan
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. TRUST & FAQS SECTION */}
      <section className="bg-slate-900 py-20 text-white border-t border-slate-800">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-white">Pricing FAQs</h2>
            <p className="text-slate-400 text-sm mt-2">
              Have questions about onboarding, subscriptions, or custom deliverables? We have answers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                q: 'Can I change my plan or billing cycle later?',
                a: 'Yes. You can upgrade, downgrade, or switch between monthly and project billing tiers at any time by contacting your dedicated account manager.',
              },
              {
                q: 'Are there any setup fees or hidden costs?',
                a: 'No. All packages list final deliverables with absolute price points. Any third-party integrations or hosting fees will be reviewed upfront.',
              },
              {
                q: 'What is the turnaround time for web development plans?',
                a: 'A single landing page takes around 5-7 business days. Complex multi-page SaaS dashboard systems typically require 4-6 weeks of design and engineering sprints.',
              },
              {
                q: 'Do you offer custom package configurations?',
                a: 'Absolutely. Contact our agency specialists, and we will tailor custom milestones, SLAs, and package pricing unique to your business requirements.',
              },
            ].map((faq, i) => (
              <div key={i} className="bg-slate-850 p-6 rounded-2xl border border-slate-800">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Lucide.HelpCircle className="h-4.5 w-4.5 text-orange-500 shrink-0" />
                  {faq.q}
                </h4>
                <p className="text-slate-400 text-xs mt-3 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
