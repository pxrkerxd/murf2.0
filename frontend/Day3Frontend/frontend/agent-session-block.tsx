'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, type MotionProps, motion } from 'motion/react';
import { useAgent, useSessionContext, useSessionMessages } from '@livekit/components-react';
import { AgentChatTranscript } from '@/components/agents-ui/agent-chat-transcript';
import {
  AgentControlBar,
  type AgentControlBarControls,
} from '@/components/agents-ui/agent-control-bar';
import { Shimmer } from '@/components/ai-elements/shimmer';
import { cn } from '@/lib/shadcn/utils';
import { TileLayout } from './tile-view';

const MotionMessage = motion.create(Shimmer);

const SHIMMER_MOTION_PROPS: MotionProps = {
  variants: {
    visible: { opacity: 1, transition: { ease: 'easeIn', duration: 0.5, delay: 0.8 } },
    hidden: { opacity: 0, transition: { ease: 'easeIn', duration: 0.5, delay: 0 } },
  },
  initial: 'hidden',
  animate: 'visible',
  exit: 'hidden',
};

export interface AgentSessionView_01Props {
  preConnectMessage?: string;
  supportsChatInput?: boolean;
  supportsVideoInput?: boolean;
  supportsScreenShare?: boolean;
  isPreConnectBufferEnabled?: boolean;
  audioVisualizerType?: 'bar' | 'wave' | 'grid' | 'radial' | 'aura';
  audioVisualizerColor?: `#${string}`;
  audioVisualizerColorShift?: number;
  audioVisualizerBarCount?: number;
  audioVisualizerGridRowCount?: number;
  audioVisualizerGridColumnCount?: number;
  audioVisualizerRadialBarCount?: number;
  audioVisualizerRadialRadius?: number;
  audioVisualizerWaveLineWidth?: number;
  className?: string;
}

export function AgentSessionView_01({
  preConnectMessage = 'Agent is listening, ask it a question',
  supportsChatInput = true,
  supportsVideoInput = true,
  supportsScreenShare = true,
  isPreConnectBufferEnabled = true,
  audioVisualizerType = 'aura',
  audioVisualizerColor = '#10b981',
  audioVisualizerColorShift,
  audioVisualizerBarCount,
  audioVisualizerGridRowCount,
  audioVisualizerGridColumnCount,
  audioVisualizerRadialBarCount,
  audioVisualizerRadialRadius,
  audioVisualizerWaveLineWidth,
  ref,
  className,
  ...props
}: React.ComponentProps<'section'> & AgentSessionView_01Props) {
  const session = useSessionContext();
  const { messages } = useSessionMessages(session);
  const [chatOpen, setChatOpen] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { state: agentState } = useAgent();

  const controls: AgentControlBarControls = {
    leave: false,
    microphone: true,
    chat: supportsChatInput,
    camera: supportsVideoInput,
    screenShare: supportsScreenShare,
  };

  useEffect(() => {
    const lastMessage = messages.at(-1);
    const lastMessageIsLocal = lastMessage?.from?.isLocal === true;

    if (scrollAreaRef.current && lastMessageIsLocal) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <section
      ref={ref}
      className={cn('bg-zinc-950 relative z-10 h-full w-full overflow-hidden flex flex-col', className)}
      {...props}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        .lk-participant-tile { 
          background-color: transparent !important; 
          border: none !important; 
          box-shadow: none !important; 
        }
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: #3f3f46;
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #10b981;
        }
      `}} />

      {/* Changed to max-w-[1200px] and 2-column split */}
      <div className="flex-1 w-full max-w-[1200px] mx-auto px-4 md:px-8 pt-28 pb-8 flex flex-col lg:flex-row gap-8 h-full">
        
        {/* COLUMN 1: Visualizer (Now 50% width) */}
        <div className="flex flex-col w-full lg:w-1/2 bg-zinc-900/50 backdrop-blur-md border border-zinc-800/80 rounded-3xl p-6 shadow-xl relative min-h-[400px]">
          <div className="flex items-center justify-center shrink-0 mb-8 z-10">
            <h3 className="text-emerald-500 font-bold text-xs tracking-widest uppercase px-4 py-1.5 bg-zinc-900 rounded-full border border-emerald-900/50 shadow-md">
              Active Connection
            </h3>
          </div>
          
          <div className="flex-1 flex items-center justify-center w-full">
            <div className="w-[280px] h-[280px] relative [&_.lk-participant-tile]:bg-transparent [&_.lk-participant-tile]:border-none [&_.lk-participant-tile]:shadow-none">
              <TileLayout
                chatOpen={false}
                audioVisualizerType={audioVisualizerType}
                audioVisualizerColor={audioVisualizerColor}
                audioVisualizerColorShift={audioVisualizerColorShift}
                audioVisualizerBarCount={audioVisualizerBarCount}
                audioVisualizerRadialBarCount={audioVisualizerRadialBarCount}
                audioVisualizerRadialRadius={audioVisualizerRadialRadius}
                audioVisualizerGridRowCount={audioVisualizerGridRowCount}
                audioVisualizerGridColumnCount={audioVisualizerGridColumnCount}
                audioVisualizerWaveLineWidth={audioVisualizerWaveLineWidth}
              />
            </div>
          </div>

          <button
            onClick={() => session.end()}
            className="shrink-0 mt-6 w-full rounded-xl bg-red-950/60 border border-red-900/50 py-4 text-sm font-bold text-red-400 shadow-lg transition-all hover:bg-red-900 hover:text-red-100 active:scale-95 z-10 relative"
          >
            END CALL
          </button>
        </div>

        {/* COLUMN 2: Live Chat (Now 50% width) */}
        <div className="flex flex-col w-full lg:w-1/2 bg-zinc-900/50 backdrop-blur-md border border-zinc-800/80 rounded-3xl p-6 shadow-xl relative h-full max-h-[75vh]">
          <div className="flex items-center justify-between mb-4 border-b border-zinc-800/50 pb-4 shrink-0">
            <h3 className="text-emerald-400 font-bold text-sm tracking-widest uppercase flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Transcript
            </h3>
          </div>

          {isPreConnectBufferEnabled && messages.length === 0 && (
            <AnimatePresence>
              <MotionMessage
                key="pre-connect-message"
                duration={2}
                {...SHIMMER_MOTION_PROPS}
                className="text-emerald-400/80 text-sm text-center mt-4 font-medium"
              >
                {preConnectMessage}
              </MotionMessage>
            </AnimatePresence>
          )}

          <div className="flex-1 w-full overflow-y-auto scroll-smooth mb-6 pr-3" ref={scrollAreaRef}>
            <AgentChatTranscript
              agentState={agentState}
              messages={messages}
              className="w-full text-base md:text-lg font-medium leading-relaxed flex flex-col gap-4 [&_.is-user]:ml-auto [&_.is-user>div]:bg-zinc-800 [&_.is-user>div]:text-zinc-200 [&_.is-user>div]:rounded-2xl [&_.is-user>div]:rounded-tr-sm [&_.is-user>div]:px-4 [&_.is-user>div]:py-2.5 [&_.is-agent]:mr-auto [&_.is-agent>div]:bg-emerald-950/30 [&_.is-agent>div]:border [&_.is-agent>div]:border-emerald-900/50 [&_.is-agent>div]:text-emerald-50 [&_.is-agent>div]:rounded-2xl [&_.is-agent>div]:rounded-tl-sm [&_.is-agent>div]:px-4 [&_.is-agent>div]:py-2.5"
            />
          </div>

          <div className="shrink-0 mt-auto bg-zinc-950/50 rounded-2xl border border-zinc-800/50 p-2">
            <AgentControlBar
              variant="livekit"
              controls={controls}
              isChatOpen={chatOpen}
              isConnected={session.isConnected}
              onDisconnect={session.end}
              onIsChatOpenChange={setChatOpen}
            />
          </div>
        </div>

      </div>
    </section>
  );
}