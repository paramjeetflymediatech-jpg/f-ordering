'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Play } from 'lucide-react';

export default function DemoVideo() {
  const [videoOpen, setVideoOpen] = useState(false);

  return (
    <section className="py-28 bg-[#020617] border-b border-slate-900">
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="bg-gradient-to-br from-slate-900/60 to-slate-950/40 border border-slate-850 rounded-3xl p-8 sm:p-14 text-center relative overflow-hidden shadow-2xl glow-card">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(249,115,22,0.02),transparent_40%)]" />
          
          <div className="relative z-10">
            <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
              Video Walkthrough
            </span>
            <h2 className="text-3xl font-extrabold text-white mt-5 leading-tight sm:text-4xl tracking-tight">
              See How Restaurants Increase Revenue
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-4 max-w-xl mx-auto leading-relaxed">
              Watch our 3-minute product demo console walkthrough to see how KDS dispatch workflows and table bill splits operate in real-time.
            </p>

            {/* Video Player Card */}
            <div 
              onClick={() => setVideoOpen(true)}
              className="mt-10 relative aspect-video max-w-2xl mx-auto rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 group cursor-pointer shadow-2xl"
            >
              <Image 
                src="/pos_dashboard_preview.png"
                alt="POS Terminal walkthrough demo screen video"
                fill
                className="object-cover opacity-40 group-hover:scale-102 transition duration-500"
                sizes="(max-width: 900px) 100vw, 900px"
              />
              
              {/* Pulsing Play Overlay Button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-16 w-16 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-2xl group-hover:scale-110 transition duration-300 relative">
                  <span className="absolute inset-0 rounded-full bg-orange-500 animate-ping opacity-35" />
                  <Play className="h-6 w-6 text-white fill-white ml-1 relative z-10" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Popup Video Modal */}
      {videoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl p-1.5 animate-fade-in">
            {/* Close Button */}
            <button 
              onClick={() => setVideoOpen(false)}
              className="absolute top-4 right-4 z-10 rounded-full bg-slate-950/80 text-slate-400 hover:text-white p-2 border border-slate-800 transition"
              title="Close modal"
            >
              <XClose />
            </button>

            <div className="aspect-video w-full relative bg-black rounded-2xl overflow-hidden">
              <iframe 
                className="absolute inset-0 h-full w-full"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
                title="POS SaaS Video Walkthrough Demo"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// Custom Close Icon helper
function XClose() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}
