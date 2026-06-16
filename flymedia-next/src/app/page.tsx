'use client';

import React from 'react';
import { MessageCircle, Sparkles } from 'lucide-react';
import HeroSection from '@/components/home/HeroSection';
import ClientLogos from '@/components/home/ClientLogos';
import SocialProof from '@/components/home/SocialProof';
import ProductShowcase from '@/components/home/ProductShowcase';
import WorkflowSection from '@/components/home/WorkflowSection';
import DemoVideo from '@/components/home/DemoVideo';
import PricingSection from '@/components/home/PricingSection';
import CaseStudies from '@/components/home/CaseStudies';
import FaqSection from '@/components/home/FaqSection';
import LeadGeneration from '@/components/home/LeadGeneration';

export default function Home() {
  const faqs = [
    {
      q: 'What is a Cloud Restaurant POS?',
      a: 'A cloud-based restaurant POS runs on the internet and stores all data securely online.'
    },
    {
      q: 'Can I manage multiple outlets with one account?',
      a: 'Yes! Our platform supports multi-outlet and franchise configurations.'
    },
    {
      q: 'Does it support QR code table ordering?',
      a: 'Absolutely. Every table gets a unique QR code.'
    },
    {
      q: 'Can I connect thermal receipt printers (e.g. Epson)?',
      a: 'Yes. Our platform integrates natively with thermal printers.'
    },
    {
      q: 'Does the POS terminal work offline?',
      a: 'Yes. The POS billing terminal features offline resiliency.'
    },
    {
      q: 'Is there a free trial available?',
      a: 'Yes, we offer a 14-day fully-featured free trial.'
    },
    {
      q: 'How does inventory management help reduce food wastage?',
      a: 'Our Recipe Management links menu items directly to ingredients.'
    }
  ];

  // Schema Markup (SEO)
  const schemaMarkup = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://fordering.com/#organization',
        'name': 'F-Ordering POS Platform',
        'url': 'https://fordering.com',
        'logo': 'https://fordering.com/logo.png',
        'contactPoint': {
          '@type': 'ContactPoint',
          'telephone': '+1-555-0199',
          'contactType': 'customer support'
        }
      },
      {
        '@type': 'Product',
        '@id': 'https://fordering.com/#product',
        'name': 'F-Ordering Restaurant POS SaaS',
        'image': 'https://fordering.com/pos_dashboard_preview.png',
        'description': 'Premium Cloud-Based POS Billing, QR Ordering, Table Reservation, and KDS Software for modern restaurants and cafes.',
        'brand': {
          '@type': 'Brand',
          'name': 'F-Ordering'
        },
        'offers': {
          '@type': 'AggregateOffer',
          'priceCurrency': 'USD',
          'lowPrice': '29.00',
          'highPrice': '149.00',
          'offerCount': '3'
        }
      },
      {
        '@type': 'FAQPage',
        'mainEntity': faqs.map(faq => ({
          '@type': 'Question',
          'name': faq.q,
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': faq.a
          }
        }))
      }
    ]
  };

  return (
    <div className="bg-[#0f172a] text-slate-100 min-h-screen font-sans selection:bg-orange-500/30 selection:text-white">
      {/* Inject SEO Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }}
      />

      {/* --- Sticky Float Buttons --- */}
      {/* 1. Sticky Book Demo Button */}
      <a 
        href="#demo-form" 
        className="fixed bottom-6 left-6 z-50 flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-xl hover:scale-105 transition transform duration-205"
      >
        <Sparkles className="h-4 w-4 text-white animate-pulse" />
        Book Live Demo
      </a>

      {/* 2. WhatsApp CTA */}
      <a 
        href="https://wa.me/15550199" 
        target="_blank" 
        rel="noreferrer" 
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center h-14 w-14 rounded-full bg-emerald-500 text-white shadow-xl hover:scale-110 hover:bg-emerald-400 transition transform duration-200"
        title="Chat on WhatsApp"
      >
        <MessageCircle className="h-7 w-7" />
      </a>

      {/* --- Homepage Component Sections --- */}
      <HeroSection />
      <ClientLogos />
      <SocialProof />
      <ProductShowcase />
      <WorkflowSection />
      <DemoVideo />
      <CaseStudies />
      <PricingSection />
      <FaqSection />
      <LeadGeneration />
    </div>
  );
}
