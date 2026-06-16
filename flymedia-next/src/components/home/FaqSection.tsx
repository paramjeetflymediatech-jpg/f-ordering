'use client';

import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

export default function FaqSection() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: 'What is a Cloud Restaurant POS?',
      a: 'A cloud-based restaurant POS runs on the internet and stores all data securely online. It allows you to access sales, stock, and staff reports from any device (laptop, phone, tablet) anywhere in the world, while updating menu items in real-time across your terminals.'
    },
    {
      q: 'Can I manage multiple outlets with one account?',
      a: 'Yes! Our platform supports multi-outlet and franchise configurations. You can manage global menus, centralize inventory tracking, and generate consolidated reports for all your branches from a single dashboard.'
    },
    {
      q: 'Does it support QR code table ordering?',
      a: 'Absolutely. Every table gets a unique QR code. Customers can scan it, browse your menu, choose modifiers, place orders to the kitchen, and pay securely using credit cards, UPI, or mobile wallets without waiting for a waiter.'
    },
    {
      q: 'Can I connect thermal receipt printers (e.g. Epson)?',
      a: 'Yes. Our platform integrates natively with thermal printers via LAN, Wi-Fi, Bluetooth, or USB. It is fully compatible with standard ESC/POS command printers like Epson, Star Micronics, and generic thermal printers.'
    },
    {
      q: 'Does the POS terminal work offline?',
      a: 'Yes. The POS billing terminal features offline resiliency. If the internet goes down, you can keep taking orders, generating invoices, and printing receipts. Once the internet connection is restored, all offline transactions sync automatically to the cloud.'
    },
    {
      q: 'Is there a free trial available?',
      a: 'Yes, we offer a 14-day fully-featured free trial. No credit card is required. You can set up your tables, upload your menu, test the POS terminal, and try the QR ordering layout immediately.'
    },
    {
      q: 'How does inventory management help reduce food wastage?',
      a: 'Our Recipe Management links menu items directly to ingredients. Every time an order is placed, the system automatically deducts stock levels. You receive notifications for low ingredients, and can easily log wastages to audit kitchen shrinkage.'
    }
  ];

  return (
    <section className="py-24 bg-slate-950 border-b border-slate-800">
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold text-orange-500 uppercase tracking-widest">Frequently Asked Questions</span>
          <h2 className="text-3xl font-extrabold text-white mt-2 sm:text-4xl">Got Questions? We Have Answers</h2>
          <p className="text-slate-400 text-sm mt-3 leading-relaxed">
            Find detailed explanations regarding setup, subdomains, thermal printers, and hardware integration support.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div 
                key={index} 
                className="bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden transition duration-200"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full flex justify-between items-center p-6 text-left hover:bg-slate-850/60 transition"
                >
                  <span className="text-xs sm:text-sm font-extrabold text-slate-200 flex items-center gap-2.5">
                    <HelpCircle className="h-4 w-4 text-orange-500 shrink-0" />
                    {faq.q}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  )}
                </button>

                {isOpen && (
                  <div className="p-6 pt-0 border-t border-slate-850 bg-slate-900/60">
                    <p className="text-slate-400 text-xs leading-relaxed pl-6.5">
                      {faq.a}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
