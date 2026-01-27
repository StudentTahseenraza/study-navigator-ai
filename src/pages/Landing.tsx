import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FloatingBubbles } from '@/components/ui/FloatingBubbles';
import { 
  GraduationCap, 
  Brain, 
  Target, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  Globe,
  Users,
  TrendingUp
} from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Guidance',
    description: 'Get personalized recommendations based on your profile, goals, and budget.',
  },
  {
    icon: Target,
    title: 'Smart Shortlisting',
    description: 'Universities categorized as Dream, Target, and Safe based on your fit.',
  },
  {
    icon: CheckCircle2,
    title: 'Decision Locking',
    description: 'Lock your choices and get focused application guidance.',
  },
  {
    icon: Sparkles,
    title: 'Action-Oriented Tasks',
    description: 'AI generates actionable to-dos tailored to your journey stage.',
  },
];

const stats = [
  { value: '500+', label: 'Universities', icon: GraduationCap },
  { value: '50+', label: 'Countries', icon: Globe },
  { value: '10K+', label: 'Students Guided', icon: Users },
  { value: '95%', label: 'Success Rate', icon: TrendingUp },
];

const stages = [
  { step: 1, title: 'Build Profile', description: 'Share your academic background and goals' },
  { step: 2, title: 'Discover', description: 'AI recommends universities that fit you' },
  { step: 3, title: 'Shortlist', description: 'Compare and select your top choices' },
  { step: 4, title: 'Lock & Apply', description: 'Get guided application support' },
];

export const Landing = () => {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden relative">
      <FloatingBubbles />
      
      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <span className="font-display text-xl font-bold">AI Counsellor</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login">
            <Button variant="ghost" className="text-foreground hover:text-primary">
              Login
            </Button>
          </Link>
          <Link to="/signup">
            <Button className="gradient-bg text-white hover:opacity-90 transition-opacity">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">AI-Powered Study Abroad Platform</span>
          </div>
          
          <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Your Journey to
            <br />
            <span className="gradient-text">World-Class Education</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Navigate your study abroad journey with confidence. Our AI Counsellor guides you from 
            profile building to university applications—step by step.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <Link to="/signup">
              <Button size="lg" className="gradient-bg text-white px-8 py-6 text-lg hover:opacity-90 transition-all hover:scale-105 glow-primary">
                Start Your Journey
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="px-8 py-6 text-lg border-border hover:bg-secondary">
              Watch Demo
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-24 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          {stats.map((stat, index) => (
            <div 
              key={stat.label} 
              className="glass-card p-6 text-center"
              style={{ animationDelay: `${0.5 + index * 0.1}s` }}
            >
              <stat.icon className="w-8 h-8 mx-auto mb-3 text-primary" />
              <div className="font-display text-3xl font-bold gradient-text">{stat.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 py-24 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A structured, stage-based approach to your study abroad journey
            </p>
          </div>

          <div className="relative">
            {/* Connection line */}
            <div className="absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-accent to-success hidden md:block" />
            
            <div className="grid md:grid-cols-4 gap-8">
              {stages.map((stage, index) => (
                <div key={stage.step} className="relative">
                  <div className="glass-card-hover p-6 text-center h-full">
                    <div className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center mx-auto mb-4 font-display text-xl font-bold text-white relative z-10">
                      {stage.step}
                    </div>
                    <h3 className="font-display text-xl font-semibold mb-2">{stage.title}</h3>
                    <p className="text-muted-foreground text-sm">{stage.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold mb-4">
              Powered by <span className="gradient-text">Intelligent AI</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Not just a chatbot—a decision and execution system built for clarity and momentum
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div 
                key={feature.title} 
                className="glass-card-hover p-6"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="glass-card p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 gradient-bg opacity-10" />
            <div className="relative z-10">
              <h2 className="font-display text-4xl font-bold mb-4">
                Ready to Start Your Journey?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Join thousands of students who transformed their study abroad dreams into reality with AI Counsellor.
              </p>
              <Link to="/signup">
                <Button size="lg" className="gradient-bg text-white px-10 py-6 text-lg hover:opacity-90 transition-all hover:scale-105">
                  Get Started Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-muted-foreground text-sm">
          <p>© 2024 AI Counsellor. Guiding students to their dream universities.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
