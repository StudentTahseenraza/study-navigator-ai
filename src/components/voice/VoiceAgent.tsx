import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Mic, MicOff, Square, Loader2, Volume2 } from 'lucide-react';
import { useVoiceAgent, type VoiceState } from '@/hooks/useVoiceAgent';
import { cn } from '@/lib/utils';

interface VoiceAgentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  autoStart?: boolean;
}

const stateLabel: Record<VoiceState, string> = {
  idle: 'Tap the mic to talk',
  listening: 'Listening…',
  thinking: 'Thinking…',
  speaking: 'Speaking…',
};

export const VoiceAgent = ({ open, onOpenChange, autoStart }: VoiceAgentProps) => {
  const { state, active, transcript, lastReply, history, start, stop, startListening, stopListening } = useVoiceAgent();

  useEffect(() => {
    if (open && autoStart && !active) {
      start();
    }
    if (!open && active) {
      stop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) stop(); onOpenChange(v); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5 text-primary" />
            AI Voice Counsellor
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-6">
          <div className={cn(
            'relative h-32 w-32 rounded-full flex items-center justify-center transition-all',
            state === 'listening' && 'bg-destructive/10 animate-pulse',
            state === 'thinking' && 'bg-muted',
            state === 'speaking' && 'bg-primary/10 animate-pulse',
            state === 'idle' && 'bg-primary/5'
          )}>
            {state === 'thinking' ? (
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            ) : state === 'listening' ? (
              <Mic className="h-12 w-12 text-destructive" />
            ) : state === 'speaking' ? (
              <Volume2 className="h-12 w-12 text-primary" />
            ) : (
              <Mic className="h-12 w-12 text-primary" />
            )}
          </div>

          <p className="text-sm text-muted-foreground">{stateLabel[state]}</p>

          {transcript && (
            <div className="w-full rounded-lg border bg-muted/40 p-3 text-sm">
              <p className="text-xs text-muted-foreground mb-1">You said:</p>
              <p>{transcript}</p>
            </div>
          )}

          {lastReply && (
            <div className="w-full rounded-lg border bg-card p-3 text-sm max-h-40 overflow-y-auto">
              <p className="text-xs text-muted-foreground mb-1">Counsellor:</p>
              <p>{lastReply}</p>
            </div>
          )}

          <div className="flex gap-3">
            {!active ? (
              <Button onClick={() => start()} size="lg">
                <Mic className="mr-2 h-4 w-4" /> Start Conversation
              </Button>
            ) : state === 'listening' ? (
              <Button onClick={stopListening} variant="destructive" size="lg">
                <MicOff className="mr-2 h-4 w-4" /> Stop
              </Button>
            ) : (
              <Button onClick={startListening} disabled={state === 'thinking' || state === 'speaking'} size="lg">
                <Mic className="mr-2 h-4 w-4" /> Hold to Speak
              </Button>
            )}
            {active && (
              <Button onClick={stop} variant="outline" size="lg">
                <Square className="mr-2 h-4 w-4" /> End
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground text-center">
            {history.length} messages · The counsellor can shortlist universities, create tasks, and set reminders for you.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
