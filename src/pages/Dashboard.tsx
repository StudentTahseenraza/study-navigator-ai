import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useProfile } from '@/hooks/useProfile';
import { useUniversities } from '@/hooks/useUniversities';
import { useTasks } from '@/hooks/useTasks';
import { useApplications } from '@/hooks/useApplications';
import { UpcomingDeadlines } from '@/components/notifications/UpcomingDeadlines';
import { VoiceAgent } from '@/components/voice/VoiceAgent';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  GraduationCap,
  MessageSquare,
  Target,
  BookOpen,
  FileText,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  TrendingUp,
  AlertCircle,
  Lock,
} from 'lucide-react';

const stageSteps = [
  { id: 'profile_building', label: 'Profile', number: 1 },
  { id: 'discovering', label: 'Discover', number: 2 },
  { id: 'shortlisting', label: 'Shortlist', number: 3 },
  { id: 'locked', label: 'Lock', number: 4 },
  { id: 'applying', label: 'Apply', number: 5 },
];

export const Dashboard = () => {
  const { profile, calculateProfileStrength, getStageLabel } = useProfile();
  const { shortlist, lockedUniversities } = useUniversities();
  const { pendingTasks, completedTasks } = useTasks();
  const { applicationProgress } = useApplications();
  const [voiceOpen, setVoiceOpen] = useState(false);

  // Auto-launch voice counsellor once after onboarding completes
  useEffect(() => {
    if (!profile?.onboarding_completed || !profile?.user_id) return;
    const key = `voice_intro_done_${profile.user_id}`;
    if (typeof window !== 'undefined' && !localStorage.getItem(key)) {
      const t = setTimeout(() => {
        setVoiceOpen(true);
        localStorage.setItem(key, '1');
      }, 1200);
      return () => clearTimeout(t);
    }
  }, [profile?.onboarding_completed, profile?.user_id]);

  const profileStrength = calculateProfileStrength(profile);
  
  // Calculate current stage index
  const getCurrentStageIndex = () => {
    const index = stageSteps.findIndex(s => s.id === profile?.current_stage);
    return index >= 0 ? index : 0;
  };

  // FIXED: Enhanced stage completion logic
  const isStageCompleted = (stageId: string) => {
    const stageIndex = stageSteps.findIndex(s => s.id === stageId);
    const currentStageIndex = getCurrentStageIndex();
    
    // If user has progressed beyond this stage, it's completed
    if (stageIndex < currentStageIndex) return true;
    
    // If this is the current stage or a previous stage, check specific conditions
    switch (stageId) {
      case 'profile_building':
        return profile?.onboarding_completed || false;
        
      case 'discovering':
        // User has discovered if they have shortlisted or visited universities
        return shortlist.length > 0 || true; // Assume true if they're at this stage
        
      case 'shortlisting':
        // Shortlisting is complete if user has shortlisted universities
        return shortlist.length > 0;
        
      case 'locked':
        // Locked stage is complete if:
        // 1. User has locked universities AND
        // 2. Either all tasks are completed OR user has started applying
        const hasLocked = lockedUniversities.length > 0;
        const allTasksCompleted = pendingTasks.length === 0 && completedTasks.length > 0;
        const hasStartedApplying = applicationProgress?.length > 0;
        
        return hasLocked && (allTasksCompleted || hasStartedApplying);
        
      case 'applying':
        // Applying stage shows progress but is only "completed" when all apps are submitted
        // For now, we'll show progress ring instead of checkmark
        return false;
        
      default:
        return false;
    }
  };

  // Check if stage should show as current/active
  const isStageCurrent = (stageId: string) => {
    return profile?.current_stage === stageId;
  };

  // Calculate progress for current stage
  const getStageProgress = () => {
    if (!profile?.current_stage) return 0;
    
    switch (profile.current_stage) {
      case 'locked':
        // Progress for locked stage = task completion percentage
        const totalLockedTasks = pendingTasks.length + completedTasks.length;
        if (totalLockedTasks === 0) return 0;
        return (completedTasks.length / totalLockedTasks) * 100;
        
      case 'applying':
        // Progress for applying stage = application submission percentage
        const totalApps = applicationProgress?.length || 0;
        if (totalApps === 0) return 0;
        const submittedApps = applicationProgress?.filter(app => 
          app.status === 'submitted' || app.status === 'accepted' || app.status === 'rejected'
        ).length || 0;
        return (submittedApps / totalApps) * 100;
        
      default:
        return 0;
    }
  };

  const getProfileStrengthLabel = () => {
    if (profileStrength >= 80) return { label: 'Strong', color: 'text-success' };
    if (profileStrength >= 50) return { label: 'Good', color: 'text-warning' };
    return { label: 'Needs Work', color: 'text-destructive' };
  };

  const strengthInfo = getProfileStrengthLabel();

  // Calculate application stats
  const submittedApplicationsCount = applicationProgress?.filter(app => 
    app.status === 'submitted' || app.status === 'accepted' || app.status === 'rejected'
  ).length || 0;
  
  const totalApplicationsCount = applicationProgress?.length || 0;

  // Check if all tasks are completed
  const allTasksCompleted = pendingTasks.length === 0 && completedTasks.length > 0;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold mb-1">
              Welcome back, {profile?.full_name?.split(' ')[0] || 'Student'}! 👋
            </h1>
            <p className="text-muted-foreground">
              Here's your study abroad journey at a glance
            </p>
          </div>
          <Link to="/counsellor">
            <Button className="gradient-bg text-white gap-2 hover:opacity-90">
              <MessageSquare className="w-4 h-4" />
              Talk to AI Counsellor
            </Button>
          </Link>
        </div>

        {/* Stage Progress */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-xl font-semibold">Your Journey</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Stage {getCurrentStageIndex() + 1} of {stageSteps.length}
              </span>
              {(profile?.current_stage === 'locked' || profile?.current_stage === 'applying') && (
                <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                  {Math.round(getStageProgress())}% complete
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between relative">
            {/* Progress line */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted" />
            <div 
              className="absolute top-5 left-0 h-0.5 gradient-bg transition-all duration-500"
              style={{ 
                width: `${(getCurrentStageIndex() + (getStageProgress() / 100)) / (stageSteps.length) * 100}%` 
              }}
            />
            
            {stageSteps.map((step, index) => {
              const isCompleted = isStageCompleted(step.id);
              const isCurrent = isStageCurrent(step.id);
              const stageProgress = getStageProgress();
              
              return (
                <div key={step.id} className="relative z-10 flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                    isCompleted ? 'bg-success text-success-foreground' :
                    isCurrent ? 'gradient-bg text-white glow-primary' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : isCurrent && stageProgress > 0 ? (
                      // Progress ring for current stage
                      <div className="relative w-full h-full">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle
                            cx="50%"
                            cy="50%"
                            r="45%"
                            stroke="currentColor"
                            strokeWidth="2"
                            fill="none"
                            className="text-white/30"
                          />
                          <circle
                            cx="50%"
                            cy="50%"
                            r="45%"
                            stroke="currentColor"
                            strokeWidth="2"
                            fill="none"
                            strokeLinecap="round"
                            className="text-white"
                            strokeDasharray={`${2 * Math.PI * 45}`}
                            strokeDashoffset={`${2 * Math.PI * 45 * (1 - stageProgress / 100)}`}
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
                          {step.number}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm font-bold">
                        {isCurrent ? step.number : step.number}
                      </span>
                    )}
                  </div>
                  <span className={`text-xs mt-2 ${
                    isCurrent ? 'text-primary font-medium' : 
                    isCompleted ? 'text-success font-medium' : 
                    'text-muted-foreground'
                  }`}>
                    {step.label}
                  </span>
                  {isCurrent && (
                    <span className="text-xs text-muted-foreground mt-1 text-center">
                      {step.id === 'locked' && (
                        <>
                          {completedTasks.length}/{pendingTasks.length + completedTasks.length} tasks
                        </>
                      )}
                      {step.id === 'applying' && totalApplicationsCount > 0 && (
                        <>
                          {submittedApplicationsCount}/{totalApplicationsCount} submitted
                        </>
                      )}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Current Stage Status */}
          {profile?.current_stage && (
            <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/10">
              <div className="flex items-center gap-2 text-sm font-medium text-primary mb-2">
                <span>Current Status:</span>
                <span className="capitalize">
                  {getStageLabel(profile.current_stage)}
                  {(profile.current_stage === 'locked' || profile.current_stage === 'applying') && 
                    ` (${Math.round(getStageProgress())}% complete)`}
                </span>
              </div>
              
              {profile.current_stage === 'locked' && (
                <div className="text-sm text-muted-foreground">
                  {lockedUniversities.length === 0 ? (
                    <p>Lock universities from your shortlist to begin the application process.</p>
                  ) : allTasksCompleted ? (
                    <div className="space-y-2">
                      <p className="text-success font-medium">✓ All tasks completed! You can now start applying.</p>
                      <Link to="/applications">
                        <Button size="sm" className="gradient-bg text-white hover:opacity-90">
                          Go to Applications
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <p>
                      Complete tasks for your {lockedUniversities.length} locked university
                      {lockedUniversities.length !== 1 ? 's' : ''} to start applying 
                      ({completedTasks.length} of {pendingTasks.length + completedTasks.length} tasks done).
                    </p>
                  )}
                </div>
              )}
              
              {profile.current_stage === 'applying' && (
                <div className="text-sm text-muted-foreground">
                  {totalApplicationsCount === 0 ? (
                    <div className="space-y-2">
                      <p>Ready to start applying to your locked universities!</p>
                      <Link to="/applications">
                        <Button size="sm" className="gradient-bg text-white hover:opacity-90">
                          Start Applications
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  ) : submittedApplicationsCount === totalApplicationsCount ? (
                    <div className="space-y-2">
                      <p className="text-success font-medium">
                        ✓ All applications submitted! Waiting for decisions.
                      </p>
                      <p>Check back for updates on your application status.</p>
                    </div>
                  ) : (
                    <p>
                      You have submitted {submittedApplicationsCount} 
                      out of {totalApplicationsCount} applications.
                      {submittedApplicationsCount > 0 && ' Keep up the great work!'}
                    </p>
                  )}
                </div>
              )}
              
              {profile.current_stage === 'shortlisting' && (
                <div className="text-sm text-muted-foreground">
                  {shortlist.length === 0 ? (
                    <p>Shortlist universities from the discovery page to move forward.</p>
                  ) : (
                    <p>
                      You have {shortlist.length} shortlisted university
                      {shortlist.length !== 1 ? 's' : ''}. Review and lock your choices when ready.
                    </p>
                  )}
                </div>
              )}
              
              {profile.current_stage === 'discovering' && (
                <div className="text-sm text-muted-foreground">
                  <p>Explore universities that match your profile and goals.</p>
                </div>
              )}
              
              {profile.current_stage === 'profile_building' && (
                <div className="text-sm text-muted-foreground">
                  {profile?.onboarding_completed ? (
                    <p>Your profile is complete! Start discovering universities.</p>
                  ) : (
                    <p>Complete your profile setup to get personalized recommendations.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Rest of the component remains the same... */}
        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Profile Strength */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">Profile Strength</span>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="font-display text-3xl font-bold">{profileStrength}%</span>
              <span className={`text-sm font-medium ${strengthInfo.color}`}>
                {strengthInfo.label}
              </span>
            </div>
            <Progress value={profileStrength} className="h-2" />
          </div>

          {/* Shortlisted */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">Shortlisted</span>
              <Target className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl font-bold">{shortlist.length}</span>
              <span className="text-sm text-muted-foreground">universities</span>
            </div>
          </div>

          {/* Locked */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">Locked</span>
              <Lock className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl font-bold">{lockedUniversities.length}</span>
              <span className="text-sm text-muted-foreground">committed</span>
            </div>
          </div>

          {/* Tasks */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">Tasks</span>
              <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl font-bold">{completedTasks.length}</span>
              <span className="text-sm text-muted-foreground">/ {pendingTasks.length + completedTasks.length}</span>
            </div>
            {allTasksCompleted && (
              <div className="mt-2 text-xs text-success font-medium">
                ✓ All tasks completed!
              </div>
            )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Profile Summary */}
          <div className="lg:col-span-2 glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-semibold">Profile Summary</h2>
              <Link to="/profile">
                <Button variant="ghost" size="sm" className="text-primary">
                  Edit Profile
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Academic */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <BookOpen className="w-4 h-4" />
                  Academic Background
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Education</span>
                    <span className="font-medium">{profile?.current_education_level || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Major</span>
                    <span className="font-medium">{profile?.degree_major || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">GPA</span>
                    <span className="font-medium">{profile?.gpa || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Goals */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Target className="w-4 h-4" />
                  Study Goals
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Degree</span>
                    <span className="font-medium">{profile?.intended_degree || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Field</span>
                    <span className="font-medium">{profile?.field_of_study || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Intake</span>
                    <span className="font-medium">{profile?.target_intake_year || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Countries */}
              <div className="md:col-span-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
                  <GraduationCap className="w-4 h-4" />
                  Preferred Countries
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile?.preferred_countries?.length ? (
                    profile.preferred_countries.map(country => (
                      <span key={country} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
                        {country}
                      </span>
                    ))
                  ) : (
                    <span className="text-muted-foreground">No countries selected</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions & Tasks */}
          <div className="space-y-6">
            {/* AI Counsellor CTA */}
            <div className="glass-card p-6 gradient-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">AI Counsellor</h3>
                  <p className="text-sm text-muted-foreground">Get personalized guidance</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Ask about universities, get recommendations, and plan your applications.
              </p>
              <Link to="/counsellor">
                <Button className="w-full gradient-bg text-white hover:opacity-90">
                  Start Conversation
                  <MessageSquare className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>

            {/* Pending Tasks */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Pending Tasks</h3>
                <Link to="/tasks" className="text-sm text-primary hover:underline">
                  View all
                </Link>
              </div>
              
              {pendingTasks.length > 0 ? (
                <div className="space-y-3">
                  {pendingTasks.slice(0, 3).map(task => (
                    <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        task.priority === 'high' ? 'bg-destructive' :
                        task.priority === 'medium' ? 'bg-warning' : 'bg-muted-foreground'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{task.title}</p>
                        {task.due_date && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" />
                            Due: {new Date(task.due_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No pending tasks</p>
                  {completedTasks.length > 0 && (
                    <p className="text-xs text-success mt-1">All tasks completed! ✓</p>
                  )}
                </div>
              )}
            </div>

            {/* Upcoming Deadlines */}
            <UpcomingDeadlines />
          </div>
        </div>

        {/* Readiness Indicators */}
        <div className="glass-card p-6">
          <h2 className="font-display text-xl font-semibold mb-6">Readiness Check</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { 
                label: 'IELTS/TOEFL', 
                status: profile?.ielts_status !== 'not_started' || profile?.toefl_status !== 'not_started',
                detail: profile?.ielts_status || 'Not Started'
              },
              { 
                label: 'GRE/GMAT', 
                status: profile?.gre_status !== 'not_started' || profile?.gmat_status !== 'not_started',
                detail: profile?.gre_status || 'Not Started'
              },
              { 
                label: 'SOP', 
                status: profile?.sop_status !== 'not_started',
                detail: profile?.sop_status || 'Not Started'
              },
              { 
                label: 'University Locked', 
                status: lockedUniversities.length > 0,
                detail: lockedUniversities.length > 0 ? `${lockedUniversities.length} locked` : 'None'
              },
            ].map(item => (
              <div key={item.label} className="p-4 rounded-lg bg-secondary/50 flex items-center gap-3">
                {item.status ? (
                  <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                )}
                <div>
                  <p className="font-medium text-sm">{item.label}</p>
                  <p className="text-xs text-muted-foreground capitalize">{item.detail.replace('_', ' ')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;