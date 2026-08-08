'use client';

import { useMemo, useEffect, useState } from 'react';
import { TokenSource } from 'livekit-client';
import { useSession, useVoiceAssistant } from '@livekit/components-react';
import { WarningIcon } from '@phosphor-icons/react/dist/ssr';
import type { AppConfig } from '@/app-config';
import { AgentSessionProvider } from '@/components/agents-ui/agent-session-provider';
import { StartAudioButton } from '@/components/agents-ui/start-audio-button';
import { ViewController } from '@/components/app/view-controller';
import { Toaster } from '@/components/ui/sonner';
import { useAgentErrors } from '@/hooks/useAgentErrors';
import { useDebugMode } from '@/hooks/useDebug';
import { getSandboxTokenSource } from '@/lib/utils';

const IN_DEVELOPMENT = process.env.NODE_ENV !== 'production';

// --- NEW DAY 3 FEATURE: DYNAMIC STATE INDICATOR ---
function AgentStatusIndicator() {
  const { state } = useVoiceAssistant();
  
  const getStateText = () => {
    switch (state) {
      case 'disconnected': return 'Call ended — Ready to start again';
      case 'connecting': return 'Connecting to Mita... please wait';
      case 'listening': return 'Mita is listening to you...';
      case 'speaking': return 'Mita is speaking...';
      default: return 'Ready';
    }
  };

  if (state === 'disconnected') return null;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 rounded-full bg-emerald-100 px-6 py-2 shadow-md border border-emerald-300">
      <p className="text-emerald-800 font-bold tracking-wide">{getStateText()}</p>
    </div>
  );
}

// --- NEW DAY 3 FEATURE: MIC PERMISSION ERROR HANDLER ---
function MicPermissionCheck() {
  const [micError, setMicError] = useState(false);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => {
      setMicError(true);
    });
  }, []);

  if (!micError) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-lg bg-red-100 px-6 py-4 shadow-lg border border-red-300 w-11/12 max-w-md">
      <p className="text-red-800 font-semibold text-center">
        ⚠️ Microphone access blocked. <br/>
        Please allow microphone permissions in your browser to talk to the shopkeeper.
      </p>
    </div>
  );
}

function AppSetup() {
  useDebugMode({ enabled: IN_DEVELOPMENT });
  useAgentErrors();
  return null;
}

interface AppProps {
  appConfig: AppConfig;
}

export function App({ appConfig }: AppProps) {
  const tokenSource = useMemo(() => {
    return typeof process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT === 'string'
      ? getSandboxTokenSource(appConfig)
      : TokenSource.endpoint('/api/token');
  }, [appConfig]);

  const session = useSession(
    tokenSource,
    appConfig.agentName ? { agentName: appConfig.agentName } : undefined
  );

  return (
    <AgentSessionProvider session={session}>
      <AppSetup />
      
      {/* Day 3 UI Injections */}
      <MicPermissionCheck />
      <AgentStatusIndicator />

      {/* Added the green theme background here */}
      <main className="grid h-svh grid-cols-1 place-content-center bg-emerald-50">
        <ViewController appConfig={appConfig} />
      </main>
      
      <StartAudioButton label="Start Audio" />
      <Toaster
        icons={{
          warning: <WarningIcon weight="bold" />,
        }}
        position="top-center"
        className="toaster group"
        style={
          {
            '--normal-bg': 'var(--popover)',
            '--normal-text': 'var(--popover-foreground)',
            '--normal-border': 'var(--border)',
          } as React.CSSProperties
        }
      />
    </AgentSessionProvider>
  );
}