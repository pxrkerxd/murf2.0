import { Button } from '@/components/ui/button';
import React, { useState } from 'react';

interface WelcomeViewProps {
  startButtonText: string;
  onStartCall: () => void;
}

export const WelcomeView = ({
  startButtonText,
  onStartCall,
  ref,
}: React.ComponentProps<'div'> & WelcomeViewProps) => {
  const [showModal, setShowModal] = useState(false);

  const handleConfirm = () => {
    setShowModal(false);
    onStartCall();
  };

  return (
    <div ref={ref} className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-zinc-950 font-outfit">
      
      {/* --- INJECTING ATTRACTIVE GOOGLE FONT --- */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
        .font-outfit {
          font-family: 'Outfit', sans-serif;
        }
      `}} />

      {/* --- VIBRANT AMBIENT ORBS --- */}
      <div className="absolute top-[10%] left-[25%] w-[30rem] h-[30rem] bg-emerald-500/40 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[15%] right-[20%] w-[35rem] h-[35rem] bg-teal-600/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[25rem] h-[25rem] bg-cyan-500/20 rounded-full blur-[100px] pointer-events-none" />

      {/* --- TRUE GLASSMORPHISM CARD --- */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center p-12 md:p-16 rounded-[2.5rem] bg-white/[0.04] backdrop-blur-[40px] border border-white/[0.1] shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] max-w-2xl w-full mx-4">
        
        {/* Store Avatar/Icon */}
        <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-700 shadow-lg shadow-emerald-500/30">
          <span className="text-5xl drop-shadow-md">🏪</span>
        </div>

        {/* Gradient Typography with Extrabold Weight */}
        <h1 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-400 tracking-tight mb-4 drop-shadow-sm">
          Home Fresh
        </h1>
        
        {/* Subtitle with Lighter Weight for Contrast */}
        <p className="text-zinc-300 text-lg md:text-xl font-light mb-10 max-w-md drop-shadow-md leading-relaxed">
          Your AI-powered Kirana assistant.<br/>Tap below to speak with Mita.
        </p>

        {/* Upgraded Button with Premium Typography */}
        <Button
          size="lg"
          onClick={() => setShowModal(true)}
          className="group relative w-72 rounded-full bg-emerald-500 text-zinc-950 font-bold text-sm tracking-[0.2em] uppercase hover:bg-emerald-400 hover:scale-105 transition-all duration-300 shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_50px_rgba(16,185,129,0.5)] h-16 border border-emerald-300/50"
        >
          <span className="flex items-center gap-3">
            <svg className="w-5 h-5 fill-zinc-950" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
            {startButtonText || 'START TALKING'}
          </span>
        </Button>

        {/* Status Pill in Glass */}
        <div className="mt-10 flex items-center gap-3 text-emerald-300 text-sm font-medium bg-white/[0.05] backdrop-blur-md px-6 py-3 rounded-full border border-white/[0.1] shadow-inner">
            <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          System Ready
        </div>
      </section>

      {/* Footer */}
      <div className="fixed bottom-8 left-0 flex w-full items-center justify-center pointer-events-none z-10">
        <p className="text-zinc-500 text-xs font-semibold tracking-widest uppercase drop-shadow-md">
          Powered by Murf Falcon Voice AI
        </p>
      </div>

      {/* --- MICROPHONE POPUP NOTIFICATION --- */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm px-4">
          <div className="bg-white/[0.05] backdrop-blur-3xl border border-white/[0.1] rounded-[2rem] p-8 max-w-sm w-full shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
            
            <div className="h-16 w-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 border border-emerald-500/30">
              <svg className="w-8 h-8 fill-emerald-400" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
              </svg>
            </div>
            
            <h3 className="text-2xl font-extrabold text-slate-100 mb-2 drop-shadow-sm">Connect Mic</h3>
            <p className="text-zinc-300 text-sm mb-8 font-light leading-relaxed">
              To talk to Mita, you will need to allow microphone access on the next screen.
            </p>
            
            <div className="flex w-full gap-3">
              <button 
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 px-4 rounded-full bg-white/[0.05] border border-white/[0.1] text-zinc-300 font-semibold hover:bg-white/[0.1] transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirm}
                className="flex-1 py-3 px-4 rounded-full bg-emerald-500 text-zinc-950 font-bold tracking-wide hover:bg-emerald-400 transition-colors shadow-[0_0_20px_rgba(16,185,129,0.3)]"
              >
                Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};