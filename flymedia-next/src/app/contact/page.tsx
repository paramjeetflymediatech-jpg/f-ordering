'use client';

import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

export default function ContactPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    service: 'seo',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!form.name || !form.email || !form.message) {
      setError('Please fill out all required fields.');
      return;
    }

    setLoading(true);

    // Mock API submission wait
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setForm({
        name: '',
        email: '',
        phone: '',
        service: 'seo',
        message: '',
      });
    }, 1200);
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-slate-900 py-20 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(249,115,22,0.15),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(59,130,246,0.1),transparent_40%)]" />
        <div className="container relative z-10 mx-auto px-6 text-center max-w-4xl">
          <span className="inline-block rounded-full bg-orange-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-orange-400 border border-orange-500/20">
            Get In Touch
          </span>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl text-white">
            Let&apos;s Discuss Your
            <span className="block mt-2 bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent">
              Next Project Goals
            </span>
          </h1>
          <p className="mt-6 text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Have questions about SEO strategies, POS pricing, or custom web design? Drop us a message, and our digital consultants will reach out.
          </p>
        </div>
      </section>

      {/* 2. CONTACT DETAILS & FORM */}
      <section className="container mx-auto px-6 py-20 max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          {/* Info Side */}
          <div className="md:col-span-5 space-y-6">
            <h2 className="text-2xl font-extrabold text-slate-900">Contact Information</h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              We look forward to partnering with your brand. Choose a contact route below or complete the inquiry form to start.
            </p>

            <div className="space-y-4 pt-4">
              {[
                { label: 'General Inquiries', val: 'info@flymediatech.com', desc: 'Expect a response within 24 hours.', icon: Mail, color: 'text-orange-600 bg-orange-100' },
                { label: 'Consultation Hotline', val: '+91 98765-43210', desc: 'Monday to Saturday, 9AM to 6PM IST', icon: Phone, color: 'text-sky-600 bg-sky-100' },
                { label: 'Corporate Office', val: 'Flymedia Tech, Ludhiana, Punjab, India', desc: 'Near main transit hub.', icon: MapPin, color: 'text-emerald-600 bg-emerald-100' },
              ].map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.label}
                    className="p-5 rounded-2xl border border-slate-200/50 bg-white flex gap-4 shadow-sm hover:border-slate-300 transition"
                  >
                    <div className={`p-3 rounded-xl h-11 w-11 shrink-0 flex items-center justify-center ${card.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{card.label}</p>
                      <p className="font-bold text-slate-900 mt-1 text-sm sm:text-base">{card.val}</p>
                      <p className="text-slate-500 text-xs mt-1">{card.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-white flex items-center gap-3">
              <Clock className="h-5 w-5 text-orange-500 shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Average Response</p>
                <p className="text-sm font-semibold text-slate-200 mt-0.5">Under 2 hours during office sessions.</p>
              </div>
            </div>
          </div>

          {/* Form Side */}
          <div className="md:col-span-7 bg-white p-8 rounded-3xl border border-slate-200/50 shadow-xl">
            <h3 className="text-xl font-bold text-slate-900">Send us a Message</h3>
            <p className="text-slate-500 text-xs mt-1">Complete your specifications, and we will prepare a preliminary strategy draft.</p>

            {error && (
              <div className="mt-4 p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> {error}
              </div>
            )}

            {success && (
              <div className="mt-4 p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-xs text-emerald-400 font-bold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Your inquiry has been submitted! We will be in touch shortly.
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500">Your Full Name *</label>
                <input
                  name="name"
                  required
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. John Doe"
                  className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-orange-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500">Email Address *</label>
                  <input
                    name="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    placeholder="e.g. john@brand.com"
                    className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-orange-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500">Phone Number</label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="e.g. +91 98765-XXXXX"
                    className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-orange-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500">Service Category Needed</label>
                <select
                  name="service"
                  value={form.service}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-orange-500 focus:bg-white font-bold"
                >
                  <option value="seo">Search Engine Optimization (SEO)</option>
                  <option value="web-design">Bespoke Web Design / Next.js Development</option>
                  <option value="ppc">Pay-Per-Click Marketing (PPC)</option>
                  <option value="branding">Logo & Branding Identity</option>
                  <option value="ecommerce">E-Commerce Development</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500">Message / Project Description *</label>
                <textarea
                  name="message"
                  required
                  rows={4}
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Tell us about your project requirements..."
                  className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-orange-500 focus:bg-white"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 px-4 py-3.5 text-xs font-bold text-white transition hover:from-orange-500 hover:to-amber-400 focus:outline-none disabled:opacity-50"
                >
                  <Send className="h-4 w-4" /> {loading ? 'Submitting Form...' : 'Send Inquiry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
