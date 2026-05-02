import { useState, useRef, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useProfile } from '@/hooks/useProfile';
import { useUniversities } from '@/hooks/useUniversities';
import { useToast } from '@/hooks/use-toast';
import { VoiceAgent } from '@/components/voice/VoiceAgent';
import ReactMarkdown from 'react-markdown';
import {
  Send,
  Loader2,
  Sparkles,
  User,
  Bot,
  GraduationCap,
  AlertCircle,
  Mic,
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SUGGESTED_PROMPTS = [
  "What universities would you recommend for me?",
  "Analyze my profile strengths and weaknesses",
  "How can I improve my chances of admission?",
  "What exams should I prioritize?",
  "Help me create an application timeline",
];

export const Counsellor = () => {
  const { profile } = useProfile();
  const { shortlist, lockedUniversities } = useUniversities();
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `👋 Hello${profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}! I'm your AI Study Abroad Counsellor.

I've reviewed your profile and I'm ready to help you navigate your study abroad journey. I can:

- **Recommend universities** that match your profile
- **Analyze your strengths** and identify areas to improve
- **Create action plans** with clear next steps
- **Answer questions** about applications, exams, and more

What would you like to discuss today?`,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    let assistantContent = '';
    const assistantMessageId = (Date.now() + 1).toString();

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-counsellor`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [...messages.filter(m => m.id !== 'welcome'), userMessage].map(m => ({
              role: m.role,
              content: m.content,
            })),
            userProfile: profile ? {
              fullName: profile.full_name,
              currentEducationLevel: profile.current_education_level,
              degreeMajor: profile.degree_major,
              gpa: profile.gpa,
              intendedDegree: profile.intended_degree,
              fieldOfStudy: profile.field_of_study,
              targetIntakeYear: profile.target_intake_year,
              preferredCountries: profile.preferred_countries,
              budgetMin: profile.budget_min,
              budgetMax: profile.budget_max,
              fundingPlan: profile.funding_plan,
              ieltsStatus: profile.ielts_status,
              greStatus: profile.gre_status,
              sopStatus: profile.sop_status,
              currentStage: profile.current_stage,
            } : undefined,
            shortlistedUniversities: shortlist.map(s => ({
              name: (s as any).universities?.name || 'Unknown',
              category: s.category,
            })),
            lockedUniversities: lockedUniversities.map(l => ({
              name: (l as any).universities?.name || 'Unknown',
            })),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      // Add empty assistant message to update
      setMessages(prev => [
        ...prev,
        { id: assistantMessageId, role: 'assistant', content: '', timestamp: new Date() },
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantMessageId
                    ? { ...m, content: assistantContent }
                    : m
                )
              );
            }
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to get response. Please try again.',
        variant: 'destructive',
      });
      
      // Remove the empty assistant message if there was an error
      if (!assistantContent) {
        setMessages(prev => prev.filter(m => m.id !== assistantMessageId));
      }
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-8rem)] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">AI Counsellor</h1>
            <p className="text-muted-foreground text-sm">
              Your personalized study abroad guide
            </p>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 glass-card flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
            <div className="space-y-6 max-w-3xl mx-auto">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-4 ${
                    message.role === 'user' ? 'flex-row-reverse' : ''
                  } animate-fade-in`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'gradient-bg'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <User className="w-5 h-5" />
                    ) : (
                      <Bot className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div
                    className={`flex-1 max-w-[80%] ${
                      message.role === 'user' ? 'text-right' : ''
                    }`}
                  >
                    <div
                      className={`inline-block p-4 rounded-2xl ${
                        message.role === 'user'
                          ? 'chat-bubble-user'
                          : 'chat-bubble-assistant'
                      }`}
                    >
                      <div className="prose prose-sm prose-invert max-w-none">
                        <ReactMarkdown>{message.content || '...'}</ReactMarkdown>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}

              {isLoading && !messages.find(m => m.content === '') && (
                <div className="flex gap-4 animate-fade-in">
                  <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="p-4 chat-bubble-assistant">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Suggested Prompts */}
          {messages.length <= 1 && (
            <div className="p-4 border-t border-border">
              <p className="text-xs text-muted-foreground mb-3">Suggested questions:</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_PROMPTS.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => sendMessage(prompt)}
                    className="px-3 py-2 text-sm rounded-lg bg-secondary hover:bg-secondary/80 transition-colors text-left"
                    disabled={isLoading}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-border">
            <div className="flex gap-3 max-w-3xl mx-auto">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask me anything about your study abroad journey..."
                className="flex-1 bg-secondary border-border"
                disabled={isLoading}
              />
              <Button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="gradient-bg text-white hover:opacity-90 px-6"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Counsellor;
