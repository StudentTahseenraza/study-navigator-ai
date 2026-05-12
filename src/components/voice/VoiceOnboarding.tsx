import { useCallback, useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Mic, MicOff, Loader2, Volume2, Square, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useProfile } from '@/hooks/useProfile';
import { useNavigate } from 'react-router-dom';

type Msg = { role: 'user' | 'assistant'; content: string };
type State = 'idle' | 'listening' | 'thinking' | 'speaking';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const REQUIRED_KEYS = [
  'intended_degree',
  'field_of_study',
  'budget_max',
  'funding_plan',
  'preferred_countries',
  'ielts_status',
  'toefl_status',
  'gre_status',
  'gmat_status',
  'sop_status',
] as const;

export const VoiceOnboarding = ({ open, onOpenChange }: Props) => {
  const { toast } = useToast();
  const { profile, updateProfile } = useProfile();
  const navigate = useNavigate();

  const [state, setState] = useState<State>('idle');
  const [collected, setCollected] = useState<Record<string, any>>({});
  const [history, setHistory] = useState<Msg[]>([]);
  const [transcript, setTranscript] = useState('');
  const [lastReply, setLastReply] = useState('');
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const collectedRef = useRef(collected);
  collectedRef.current = collected;
  const historyRef = useRef(history);
  historyRef.current = history;
  const recRef = useRef<any>(null);

  const speak = useCallback((text: string) =>
    new Promise<void>((resolve) => {
      if (!text || !window.speechSynthesis) return resolve();
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 1.0;
      const voices = window.speechSynthesis.getVoices();
      const v = voices.find(x => /^en/i.test(x.lang));
      if (v) utter.voice = v;
      utter.onend = () => resolve();
      utter.onerror = () => resolve();
      setState('speaking');
      window.speechSynthesis.speak(utter);
    }), []);

  const callAgent = useCallback(async (msgs: Msg[]) => {
    const { data, error } = await supabase.functions.invoke('voice-onboarding', {
      body: { messages: msgs, collected: collectedRef.current },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data as { spoken_reply: string; done: boolean; updates: Record<string, any> };
  }, []);

  const sendUserText = useCallback(async (text: string) => {
    if (!text.trim()) return;
    setState('thinking');
    const msgs = [...historyRef.current, { role: 'user' as const, content: text }];
    setHistory(msgs);
    try {
      const res = await callAgent(msgs);
      const merged = { ...collectedRef.current };
      for (const [k, v] of Object.entries(res.updates ?? {})) {
        if (v === null || v === undefined) continue;
        if (k === 'preferred_countries' && Array.isArray(v)) {
          const set = new Set([...(merged[k] ?? []), ...v]);
          merged[k] = Array.from(set);
        } else {
          merged[k] = v;
        }
      }
      setCollected(merged);
      setHistory([...msgs, { role: 'assistant', content: res.spoken_reply }]);
      setLastReply(res.spoken_reply);
      if (res.done) setDone(true);
      if (res.spoken_reply) await speak(res.spoken_reply);
    } catch (e: any) {
      toast({ title: 'Voice onboarding error', description: e.message, variant: 'destructive' });
    } finally {
      setState('idle');
    }
  }, [callAgent, speak, toast]);

  const startListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast({ title: 'Voice not supported', description: 'Use Chrome or Edge for voice input.', variant: 'destructive' });
      return;
    }
    const rec = new SR();
    rec.lang = 'en-US';
    rec.continuous = false;
    rec.interimResults = true;
    let finalText = '';
    rec.onresult = (e: any) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += t;
        else interim += t;
      }
      setTranscript(finalText + interim);
    };
    rec.onend = () => {
      setState('idle');
      const t = finalText.trim();
      if (t) sendUserText(t);
    };
    rec.onerror = () => setState('idle');
    recRef.current = rec;
    setTranscript('');
    setState('listening');
    rec.start();
  }, [sendUserText, toast]);

  const stopListening = useCallback(() => recRef.current?.stop(), []);

  // Kickoff greeting when dialog opens
  useEffect(() => {
    if (!open) {
      window.speechSynthesis?.cancel();
      recRef.current?.stop();
      return;
    }
    if (history.length > 0) return;
    const name = profile?.full_name?.split(' ')[0] || 'there';
    const greeting = `Hi ${name}! Let's set up your study plan in a quick voice chat. To start, what degree are you aiming for and in which field?`;
    setHistory([{ role: 'assistant', content: greeting }]);
    setLastReply(greeting);
    speak(greeting);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const filled = REQUIRED_KEYS.filter((k) => {
    const v = (collected as any)[k];
    if (k === 'preferred_countries') return Array.isArray(v) && v.length > 0;
    return v !== undefined && v !== null && v !== '';
  }).length;
  const progress = Math.round((filled / REQUIRED_KEYS.length) * 100);

  const handleFinish = async () => {
    setSubmitting(true);
    try {
      await updateProfile.mutateAsync({
        intended_degree: collected.intended_degree,
        field_of_study: collected.field_of_study,
        target_intake_year: collected.target_intake_year ?? new Date().getFullYear() + 1,
        preferred_countries: collected.preferred_countries,
        budget_min: collected.budget_min ?? null,
        budget_max: collected.budget_max ?? null,
        funding_plan: collected.funding_plan,
        ielts_status: collected.ielts_status ?? 'not_started',
        toefl_status: collected.toefl_status ?? 'not_started',
        gre_status: collected.gre_status ?? 'not_started',
        gmat_status: collected.gmat_status ?? 'not_started',
        sop_status: collected.sop_status ?? 'not_started',
        onboarding_completed: true,
        current_stage: 'profile_building',
        profile_strength: 60,
      });
      toast({ title: 'Onboarding complete!', description: 'Your study plan is saved.' });
      onOpenChange(false);
      navigate('/dashboard');
    } catch (e: any) {
      toast({ title: 'Could not save', description: e.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5 text-primary" /> Voice Onboarding
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Profile fields captured</span>
              <span>{filled}/{REQUIRED_KEYS.length}</span>
            </div>
            <Progress value={progress} />
          </div>

          <div className="flex flex-col items-center gap-4 pt-2">
            <div className={cn(
              'h-24 w-24 rounded-full flex items-center justify-center transition-all',
              state === 'listening' && 'bg-destructive/10 animate-pulse',
              state === 'thinking' && 'bg-muted',
              state === 'speaking' && 'bg-primary/10 animate-pulse',
              state === 'idle' && 'bg-primary/5'
            )}>
              {state === 'thinking' ? <Loader2 className="h-10 w-10 animate-spin text-primary" />
                : state === 'listening' ? <Mic className="h-10 w-10 text-destructive" />
                : state === 'speaking' ? <Volume2 className="h-10 w-10 text-primary" />
                : <Mic className="h-10 w-10 text-primary" />}
            </div>
            <p className="text-xs text-muted-foreground">
              {state === 'idle' ? 'Tap the mic when you\'re ready to answer' : state === 'listening' ? 'Listening…' : state === 'thinking' ? 'Thinking…' : 'Speaking…'}
            </p>
          </div>

          {transcript && (
            <div className="rounded-lg border bg-muted/40 p-3 text-sm">
              <p className="text-xs text-muted-foreground mb-1">You:</p>
              <p>{transcript}</p>
            </div>
          )}
          {lastReply && (
            <div className="rounded-lg border bg-card p-3 text-sm max-h-32 overflow-y-auto">
              <p className="text-xs text-muted-foreground mb-1">Counsellor:</p>
              <p>{lastReply}</p>
            </div>
          )}

          <div className="flex gap-2 justify-center">
            {state === 'listening' ? (
              <Button onClick={stopListening} variant="destructive">
                <MicOff className="mr-2 h-4 w-4" /> Stop
              </Button>
            ) : (
              <Button onClick={startListening} disabled={state === 'thinking' || state === 'speaking'}>
                <Mic className="mr-2 h-4 w-4" /> Tap to Speak
              </Button>
            )}
            <Button variant="outline" onClick={() => { window.speechSynthesis?.cancel(); onOpenChange(false); }}>
              <Square className="mr-2 h-4 w-4" /> Close
            </Button>
          </div>

          {done && (
            <div className="rounded-lg border border-success/40 bg-success/10 p-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-success" />
                All required answers captured.
              </div>
              <Button size="sm" onClick={handleFinish} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save & Continue'}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
