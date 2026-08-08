import { Button } from '@/components/ui/button';
import React from 'react';

interface WelcomeViewProps {
  startButtonText: string;
  onStartCall: () => void;
}

export const WelcomeView = ({
  startButtonText,
  onStartCall,
  ref,
}: React.ComponentProps<'div'> & WelcomeViewProps) => {
  return (
    <div ref={ref}>
      <section className="bg-emerald-50 flex flex-col items-center justify-center text-center p-8 rounded-2xl shadow-sm border border-emerald-100">
        
        {/* New Grocery Branding */}
        <h1 className="text-4xl md:text-5xl font-extrabold text-emerald-800 tracking-tight mb-3">
          Ulwe Fresh Grocery 🛒
        </h1>
        
        <p className="text-emerald-700 max-w-prose pt-1 text-lg leading-6 font-medium">
          Talk to Mita, your virtual shopkeeper
        </p>

        {/* Updated Button */}
        <Button
          size="lg"
          onClick={onStartCall}
          className="mt-8 w-64 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold tracking-wider uppercase shadow-md transition-all"
        >
          {/* We'll override the default text here */}
          Tap to Order
        </Button>

        {/* Day 3 Requirement: Clear 'Ready' State */}
        <p className="text-emerald-600 font-semibold mt-6 text-sm">
          Status: Ready — Tap the button to begin
        </p>

      </section>

      <div className="fixed bottom-5 left-0 flex w-full items-center justify-center">
        <p className="text-emerald-600/70 max-w-prose pt-1 text-xs leading-5 font-normal md:text-sm">
          Powered by Murf Falcon Voice AI
        </p>
      </div>
    </div>
  );
};