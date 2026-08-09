import { Button } from '@/components/ui/button';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

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
    setTimeout(() => onStartCall(), 300);
  };

  return (
    // 🚨 THE FIX: Changed 'h-full' to 'min-h-[100dvh]' so it forces the div to fill the entire monitor
    <div ref={ref} className="relative flex min-h-[100dvh] w-full flex-col items-center justify-center overflow-hidden bg-[#09090b] font-outfit">
      
      {/* --- INJECTING CUSTOM CSS & FONTS --- */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
        .font-outfit { font-family: 'Outfit', sans-serif; }
        
        /* High-Tech Grid Background */
        .bg-grid-pattern {
          background-image: radial-gradient(rgba(16, 185, 129, 0.15) 1px, transparent 1px);
          background-size: 32px 32px;
        }

        /* Continuous Text Shine */
        .animate-text-shine {
          background-size: 200% auto;
          animation: textShine 4s linear infinite;
        }
        @keyframes textShine {
          to { background-position: 200% center; }
        }

        /* Radar Ping Effect */
        .radar-ping::before, .radar-ping::after {
          content: '';
          position: absolute;
          inset: -10px;
          border-radius: 50%;
          border: 1px solid rgba(16, 185, 129, 0.4);
          animation: ping-large 2.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        .radar-ping::after {
          animation-delay: 1.25s;
        }
        @keyframes ping-large {
          75%, 100% { transform: scale(1.8); opacity: 0; }
        }
      `}} />

      {/* --- BACKGROUND LAYER --- */}
      <div className="absolute inset-0 bg-grid-pattern opacity-60 mix-blend-screen" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#09090b]/80 to-[#09090b]" />
      
      {/* Heavy glowing orbs for backdrop depth */}
      <div className="absolute top-[10%] left-[20%] w-[35rem] h-[35rem] bg-emerald-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[0%] right-[10%] w-[40rem] h-[40rem] bg-teal-800/20 rounded-full blur-[150px] pointer-events-none" />

      {/* --- FLOATING HOLOGRAPHIC GROCERIES --- */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
        {[
          { icon: '🥑', top: '15%', left: '15%', delay: 0 },
          { icon: '🥛', top: '65%', left: '10%', delay: 1.5 },
          { icon: '🥕', top: '20%', left: '80%', delay: 0.5 },
          { icon: '🍞', top: '75%', left: '85%', delay: 2 },
          { icon: '🍎', top: '45%', left: '92%', delay: 1 },
          { icon: '🥚', top: '40%', left: '5%', delay: 2.5 }
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ y: 0 }}
            animate={{ y: [-20, 20, -20], rotate: [-10, 10, -10] }}
            transition={{ duration: 8, repeat: Infinity, delay: item.delay, ease: "easeInOut" }}
            className="absolute text-5xl opacity-[0.08] blur-[2px] grayscale-[50%]"
            style={{ top: item.top, left: item.left }}
          >
            {item.icon}
          </motion.div>
        ))}
      </div>

      {/* --- MAIN HERO CARD --- */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center p-12 max-w-2xl w-full mx-4">
        
        {/* Animated Radar Avatar */}
        <div className="relative mb-12 flex h-28 w-28 items-center justify-center rounded-full bg-zinc-900 border border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.2)] radar-ping">
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-inner">
            <span className="text-5xl drop-shadow-lg filter contrast-125">🏪</span>
          </div>
        </div>

        {/* Animated Gradient Title */}
        <h1 className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-300 animate-text-shine tracking-tighter mb-6 drop-shadow-2xl">
          Home Fresh
        </h1>
        
        <p className="text-zinc-400 text-lg md:text-xl font-medium mb-12 max-w-md leading-relaxed tracking-wide">
          Your AI-powered Kirana assistant. <br/>
          <span className="text-emerald-500/80 font-semibold">Tap below to speak with Mita.</span>
        </p>

        {/* Hyper-Tactile Button */}
        <Button
          size="lg"
          onClick={() => setShowModal(true)}
          className="group relative w-72 rounded-2xl bg-emerald-500 text-zinc-950 font-extrabold text-sm tracking-[0.25em] uppercase hover:bg-emerald-400 hover:-translate-y-1 transition-all duration-300 shadow-[0_10px_40px_-10px_rgba(16,185,129,0.7)] h-16 overflow-hidden"
        >
          {/* Button Sweep Animation */}
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] skew-x-12" />
          
          <span className="relative flex items-center justify-center gap-3 w-full">
            <svg className="w-5 h-5 fill-zinc-950" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
            {startButtonText || 'INITIALIZE LINK'}
          </span>
        </Button>

        {/* Cyber-Style Status Badge */}
        <div className="mt-12 flex items-center gap-3 text-emerald-400 text-xs font-bold tracking-widest uppercase bg-zinc-950/80 px-6 py-2.5 rounded-sm border border-emerald-500/20 shadow-[inset_0_0_15px_rgba(16,185,129,0.1)]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          System Ready
        </div>
      </section>

      <div className="absolute bottom-6 left-0 flex w-full items-center justify-center pointer-events-none z-10">
        <p className="text-zinc-600 text-[10px] font-black tracking-[0.3em] uppercase">
          Powered by Murf Falcon Voice AI
        </p>
      </div>

      {/* --- CINEMATIC MODAL --- */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/90 backdrop-blur-xl px-4"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="bg-zinc-900 border border-emerald-500/20 rounded-[2rem] p-10 max-w-sm w-full shadow-[0_0_50px_rgba(16,185,129,0.1)] flex flex-col items-center text-center relative overflow-hidden"
            >
              {/* Modal Tech Background */}
              <div className="absolute inset-0 bg-grid-pattern opacity-30 mix-blend-screen pointer-events-none" />
              
              <div className="relative h-20 w-20 bg-zinc-950 rounded-full flex items-center justify-center mb-6 border border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                <svg className="w-10 h-10 fill-emerald-400" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
              </div>
              
              <h3 className="relative text-3xl font-black text-white mb-3 tracking-tight">Audio Uplink</h3>
              <p className="relative text-zinc-400 text-sm mb-10 font-medium">
                Initialize microphone access to begin voice transmission with Mita.
              </p>
              
              <div className="relative flex w-full gap-4">
                <button 
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-4 px-4 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-400 font-bold uppercase tracking-widest text-xs hover:bg-zinc-800 transition-colors"
                >
                  Abort
                </button>
                <button 
                  onClick={handleConfirm}
                  className="flex-1 py-4 px-4 rounded-xl bg-emerald-500 text-zinc-950 font-black uppercase tracking-widest text-xs hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all"
                >
                  Connect
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};