'use client';

import React, { useState } from 'react';
import { Calendar, Clock, User, ArrowRight, BookOpen, MessageSquare } from 'lucide-react';

interface BlogPost {
  title: string;
  category: 'SEO' | 'Development' | 'PPC' | 'Branding';
  excerpt: string;
  date: string;
  readTime: string;
  author: string;
  link: string;
}

export default function BlogPage() {
  const posts: BlogPost[] = [
    {
      title: 'Top 5 Local SEO Strategies for Restaurants in 2026',
      category: 'SEO',
      excerpt: 'Discover how local SEO, structured menu schemas, and optimized Google Business profiles drive online ordering and table reservation bookings.',
      date: 'June 10, 2026',
      readTime: '6 min read',
      author: 'Amanpreet Singh',
      link: '#',
    },
    {
      title: 'Why Next.js 15 is the Ultimate Framework for Modern SaaS Systems',
      category: 'Development',
      excerpt: 'An in-depth look into React Server Components, route caching strategies, and SEO-friendly architectures that make Next.js the framework of choice.',
      date: 'May 28, 2026',
      readTime: '8 min read',
      author: 'Rajesh Kumar',
      link: '#',
    },
    {
      title: 'Maximizing ROI on Pay-Per-Click (PPC) Advertising Campaigns',
      category: 'PPC',
      excerpt: 'Learn how to optimize search ads, configure negative keywords, and build custom landing pages that reduce cost-per-acquisition (CPA).',
      date: 'May 15, 2026',
      readTime: '5 min read',
      author: 'Sunita Sharma',
      link: '#',
    },
    {
      title: 'The Role of Visual Branding in Conversion Rate Optimization',
      category: 'Branding',
      excerpt: 'How harmonious colors, vector logos, consistent typography, and modern layouts influence purchase decisions in customer-facing apps.',
      date: 'April 30, 2026',
      readTime: '4 min read',
      author: 'Nisha Verma',
      link: '#',
    },
  ];

  const categories = ['All', 'SEO', 'Development', 'PPC', 'Branding'];
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredPosts = posts.filter(
    (p) => activeCategory === 'All' || p.category === activeCategory
  );

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* 1. HERO BANNER */}
      <section className="relative overflow-hidden bg-slate-900 py-24 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(249,115,22,0.15),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.1),transparent_40%)]" />
        <div className="container relative z-10 mx-auto px-6 text-center max-w-4xl">
          <span className="inline-block rounded-full bg-orange-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-orange-400 border border-orange-500/20">
            Flymedia Insights
          </span>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl text-white">
            Digital Strategy, SEO Guides
            <span className="block mt-2 bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent">
              & Developer Insights
            </span>
          </h1>
          <p className="mt-6 text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Read our latest articles, technology studies, and online advertising strategies authored by our team of digital marketing experts.
          </p>
        </div>
      </section>

      {/* 2. CATEGORY FILTERS */}
      <section className="container mx-auto px-6 pt-12 pb-6 max-w-5xl">
        <div className="flex flex-wrap gap-2 justify-center border-b border-slate-200 pb-6">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                activeCategory === cat
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 hover:text-slate-900 border-slate-200 hover:border-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* 3. BLOG POSTS LIST */}
      <section className="container mx-auto px-6 pb-24 max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
          {filteredPosts.map((post) => (
            <article
              key={post.title}
              className="bg-white rounded-3xl p-6 border border-slate-200/50 shadow-sm flex flex-col justify-between hover:shadow-xl hover:border-slate-300 transition-all duration-300 group"
            >
              <div>
                {/* Meta details */}
                <div className="flex items-center gap-3 text-xs text-slate-400 font-bold uppercase tracking-wider mb-4">
                  <span className="px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-600 border border-orange-500/20">
                    {post.category}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> {post.date}
                  </span>
                </div>

                <h3 className="text-xl font-extrabold text-slate-900 mt-2 leading-snug group-hover:text-orange-600 transition">
                  {post.title}
                </h3>
                <p className="text-slate-600 text-sm mt-3 leading-relaxed">
                  {post.excerpt}
                </p>
              </div>

              {/* Footer row */}
              <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-slate-400" /> {post.author}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-slate-400" /> {post.readTime}
                  </span>
                </div>

                <a
                  href={post.link}
                  className="text-xs font-bold text-orange-600 hover:text-orange-500 flex items-center gap-1 transition group-hover:translate-x-1"
                >
                  Read Article <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 4. NEWSLETTER JOIN */}
      <section className="bg-slate-900 py-20 text-white border-t border-slate-800">
        <div className="container mx-auto px-6 max-w-3xl text-center">
          <BookOpen className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-3xl font-extrabold text-white">Subscribe to Flymedia Digest</h2>
          <p className="text-slate-400 text-sm mt-2 max-w-lg mx-auto">
            Get bi-weekly updates on modern web trends, SEO algorithms, and local lead generation strategies straight to your inbox.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              alert('Thank you for subscribing!');
            }}
            className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <input
              type="email"
              required
              placeholder="Your professional email address"
              className="flex-1 rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-sm text-white outline-none focus:border-orange-500 transition"
            />
            <button
              type="submit"
              className="rounded-xl bg-orange-600 hover:bg-orange-500 transition px-6 py-3 text-sm font-bold text-white shadow-lg"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
