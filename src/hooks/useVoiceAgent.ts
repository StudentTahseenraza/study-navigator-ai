import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useProfile } from '@/hooks/useProfile';
import { useUniversities } from '@/hooks/useUniversities';
import { useTasks } from '@/hooks/useTasks';
import { useNotifications } from '@/hooks/useNotifications';

type Msg = { role: 'user' | 'assistant' | 'tool'; content: string; tool_call_id?: string; tool_calls?: any[]; name?: string };

export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';

export const useVoiceAgent = () => {
  const { toast } = useToast();
  const { profile } = useProfile();
  const { universities, shortlist, lockedUniversities, addToShortlist, lockUniversity } = useUniversities();
  const { tasks, createTask, completeTask } = useTasks();
  const { createReminder } = useNotifications();

  const [state, setState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [lastReply, setLastReply] = useState('');
  const [history, setHistory] = useState<Msg[]>([]);
  const [active, setActive] = useState(false);

  const recognitionRef = useRef<any>(null);
  const historyRef = useRef<Msg[]>([]);
  historyRef.current = history;

  const speak = useCallback((text: string) =>
    new Promise<void>((resolve) => {
      if (!text || typeof window === 'undefined' || !window.speechSynthesis) {
        resolve();
        return;
      }
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 1.0;
      utter.pitch = 1.0;
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v => /en[-_]?(US|GB)/i.test(v.lang) && /female|samantha|google/i.test(v.name)) || voices.find(v => /^en/i.test(v.lang));
      if (preferred) utter.voice = preferred;
      utter.onend = () => resolve();
      utter.onerror = () => resolve();
      setState('speaking');
      window.speechSynthesis.speak(utter);
    }), []);

  const executeToolCall = useCallback(async (call: any): Promise<string> => {
    try {
      const args = typeof call.function.arguments === 'string' ? JSON.parse(call.function.arguments) : call.function.arguments;
      switch (call.function.name) {
        case 'shortlist_university': {
          const exists = shortlist.some((s: any) => s.university_id === args.university_id);
          if (exists) return JSON.stringify({ ok: true, note: 'already shortlisted' });
          await addToShortlist.mutateAsync({
            universityId: args.university_id,
            category: args.category,
            fitScore: args.fit_score,
            aiReasoning: args.reasoning,
          });
          return JSON.stringify({ ok: true });
        }
        case 'lock_university': {
          const exists = lockedUniversities.some((l: any) => l.university_id === args.university_id);
          if (exists) return JSON.stringify({ ok: true, note: 'already locked' });
          await lockUniversity.mutateAsync({ universityId: args.university_id, notes: args.notes });
          return JSON.stringify({ ok: true });
        }
        case 'create_task': {
          await createTask.mutateAsync({
            title: args.title,
            description: args.description,
            category: args.category,
            priority: args.priority,
            due_date: args.due_date,
            university_id: args.university_id,
          });
          return JSON.stringify({ ok: true });
        }
        case 'complete_task': {
          await completeTask.mutateAsync(args.task_id);
          return JSON.stringify({ ok: true });
        }
        case 'create_reminder': {
          await createReminder.mutateAsync({
            title: args.title,
            description: args.description ?? null,
            deadline_date: args.deadline_date,
            reminder_type: args.reminder_type,
            university_id: args.university_id ?? null,
            remind_days_before: [30, 14, 7, 3, 1],
            is_active: true,
          });
          return JSON.stringify({ ok: true });
        }
      }
      return JSON.stringify({ ok: false, error: 'unknown tool' });
    } catch (e: any) {
      return JSON.stringify({ ok: false, error: e?.message ?? 'failed' });
    }
  }, [addToShortlist, lockUniversity, createTask, completeTask, createReminder, shortlist, lockedUniversities]);

  const callAgent = useCallback(async (msgs: Msg[]): Promise<{ reply: string; updated: Msg[] }> => {
    let working = [...msgs];
    let finalReply = '';
    for (let i = 0; i < 5; i++) {
      const { data, error } = await supabase.functions.invoke('voice-agent', {
        body: {
          messages: working,
          context: { profile, universities, shortlist, locked: lockedUniversities, tasks },
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const toolCalls = data.tool_calls || [];
      const content = data.content || '';
      if (toolCalls.length > 0) {
        working.push({ role: 'assistant', content, tool_calls: toolCalls });
        for (const c of toolCalls) {
          const result = await executeToolCall(c);
          working.push({ role: 'tool', tool_call_id: c.id, name: c.function.name, content: result });
        }
        continue;
      }
      finalReply = content;
      working.push({ role: 'assistant', content });
      break;
    }
    return { reply: finalReply, updated: working };
  }, [profile, universities, shortlist, lockedUniversities, tasks, executeToolCall]);

  const sendUserText = useCallback(async (text: string) => {
    if (!text.trim()) return;
    setState('thinking');
    const msgs: Msg[] = [...historyRef.current, { role: 'user', content: text }];
    setHistory(msgs);
    try {
      const { reply, updated } = await callAgent(msgs);
      setHistory(updated);
      setLastReply(reply);
      if (reply) await speak(reply);
    } catch (e: any) {
      toast({ title: 'Voice agent error', description: e.message, variant: 'destructive' });
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
      const text = finalText.trim();
      if (text) sendUserText(text);
    };
    rec.onerror = () => setState('idle');
    recognitionRef.current = rec;
    setTranscript('');
    setState('listening');
    rec.start();
  }, [sendUserText, toast]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const start = useCallback(async (kickoff?: string) => {
    setActive(true);
    setHistory([]);
    setState('thinking');
    try {
      const greeting = kickoff || `Hi ${profile?.full_name?.split(' ')[0] || 'there'}, this is your AI study abroad counsellor. I have your profile in front of me. Tell me, what's the one thing you're most worried about with your applications right now?`;
      setLastReply(greeting);
      setHistory([{ role: 'assistant', content: greeting }]);
      await speak(greeting);
    } finally {
      setState('idle');
    }
  }, [profile, speak]);

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    recognitionRef.current?.stop();
    setActive(false);
    setState('idle');
  }, []);

  useEffect(() => () => {
    window.speechSynthesis?.cancel();
    recognitionRef.current?.stop();
  }, []);

  return { state, active, transcript, lastReply, history, start, stop, startListening, stopListening, sendUserText };
};
