import { useState, useEffect } from 'react'; // ADD useEffect
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useApplications, ApplicationStatus, ApplicationProgress } from '@/hooks/useApplications';
import { useTasks } from '@/hooks/useTasks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  GraduationCap,
  CheckCircle2,
  Clock,
  Send,
  ExternalLink,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Trophy,
  XCircle,
  Hourglass,
  ListChecks,
  Calendar,
  Timer,
  AlertTriangle,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const statusConfig: Record<ApplicationStatus, { label: string; color: string; icon: React.ComponentType<any> }> = {
  not_started: { label: 'Not Started', color: 'bg-muted text-muted-foreground', icon: Clock },
  in_progress: { label: 'In Progress', color: 'bg-warning/20 text-warning', icon: Hourglass },
  submitted: { label: 'Submitted', color: 'bg-primary/20 text-primary', icon: Send },
  accepted: { label: 'Accepted', color: 'bg-success/20 text-success', icon: Trophy },
  rejected: { label: 'Rejected', color: 'bg-destructive/20 text-destructive', icon: XCircle },
  waitlisted: { label: 'Waitlisted', color: 'bg-warning/20 text-warning', icon: Hourglass },
};

const ApplicationCard = ({ 
  app, 
  onUpdateStatus,
  onSubmit,
  onAutoSubmit,
  onAutoReject,
}: { 
  app: ApplicationProgress; 
  onUpdateStatus: (universityId: number, status: ApplicationStatus) => void;
  onSubmit: (app: ApplicationProgress) => void;
  onAutoSubmit: (app: ApplicationProgress) => void;
  onAutoReject: (app: ApplicationProgress) => void;
}) => {
  const { tasks } = useTasks();
  const universityTasks = tasks.filter(t => t.university_id === app.universityId);
  const config = statusConfig[app.status];
  const StatusIcon = config.icon;

  // Calculate days remaining until deadline
  const getDaysRemaining = () => {
    if (!app.deadline) return null;
    const deadline = new Date(app.deadline);
    const today = new Date();
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysRemaining = getDaysRemaining();

  // Calculate task completion rate
  const taskCompletionRate = universityTasks.length > 0 
    ? (universityTasks.filter(t => t.status === 'completed').length / universityTasks.length) * 100
    : 0;

  // Check if deadline is approaching (within 7 days)
  const isDeadlineApproaching = daysRemaining !== null && daysRemaining > 0 && daysRemaining <= 7;

  // Check if deadline has passed
  const isDeadlinePassed = daysRemaining !== null && daysRemaining < 0;

  // Check if should auto-submit (tasks 80%+ complete and not yet submitted)
  const shouldAutoSubmit = 
    app.status !== 'submitted' && 
    app.status !== 'accepted' && 
    app.status !== 'rejected' && 
    app.status !== 'waitlisted' &&
    taskCompletionRate >= 80;

  // Check if should auto-reject (tasks less than 50% complete and deadline passed)
  const shouldAutoReject = 
    isDeadlinePassed && 
    taskCompletionRate < 50 &&
    app.status !== 'rejected' &&
    app.status !== 'accepted';

  return (
    <div className="glass-card p-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* University Info */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold">{app.universityName}</h3>
                <Badge className={config.color}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {config.label}
                </Badge>
              </div>
            </div>
            
            {/* Deadline indicator */}
            {app.deadline && (
              <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                isDeadlinePassed ? 'bg-destructive/20 text-destructive' :
                isDeadlineApproaching ? 'bg-warning/20 text-warning' :
                'bg-muted text-muted-foreground'
              }`}>
                <Calendar className="w-3 h-3" />
                <span>
                  {isDeadlinePassed ? 'Deadline passed' : 
                   isDeadlineApproaching ? `${daysRemaining} days left` :
                   `${daysRemaining} days left`}
                </span>
              </div>
            )}
          </div>

          {/* Progress */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <ListChecks className="w-4 h-4" />
                Task Progress
              </span>
              <span className="font-medium">
                {app.completedTasks}/{app.totalTasks} tasks ({Math.round(taskCompletionRate)}%)
              </span>
            </div>
            <Progress value={app.progressPercentage} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {app.progressPercentage}% complete
                {app.canApply && app.status === 'not_started' && (
                  <span className="text-success ml-2">• Ready to apply!</span>
                )}
              </span>
              {shouldAutoSubmit && (
                <span className="text-warning flex items-center gap-1">
                  <Timer className="w-3 h-3" />
                  Auto-submit available
                </span>
              )}
            </div>
          </div>

          {/* Auto Status Alerts */}
          {shouldAutoSubmit && (
            <div className="mb-4 p-3 rounded-lg bg-warning/10 border border-warning/20 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-warning">Ready for Auto-Submission!</p>
                <p className="text-xs text-warning/80">
                  You've completed {Math.round(taskCompletionRate)}% of tasks. Click below to automatically submit your application.
                </p>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="mt-2 border-warning text-warning hover:bg-warning/10"
                  onClick={() => onAutoSubmit(app)}
                >
                  <Send className="w-3 h-3 mr-1" />
                  Auto-Submit Application
                </Button>
              </div>
            </div>
          )}

          {shouldAutoReject && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">Application At Risk!</p>
                <p className="text-xs text-destructive/80">
                  Deadline passed with only {Math.round(taskCompletionRate)}% tasks completed. 
                  Application will be marked as rejected unless completed manually.
                </p>
                <div className="flex gap-2 mt-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="border-destructive text-destructive hover:bg-destructive/10"
                    onClick={() => onAutoReject(app)}
                  >
                    <XCircle className="w-3 h-3 mr-1" />
                    Mark as Rejected
                  </Button>
                  <Link to="/tasks">
                    <Button size="sm" variant="ghost">
                      Complete Tasks
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Task List Preview */}
          {universityTasks.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Tasks:</p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {universityTasks.slice(0, 5).map(task => (
                  <div key={task.id} className="flex items-center gap-2 text-sm">
                    {task.status === 'completed' ? (
                      <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                    ) : (
                      <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    )}
                    <span className={task.status === 'completed' ? 'line-through text-muted-foreground' : ''}>
                      {task.title}
                    </span>
                    {task.due_date && (
                      <span className="text-xs text-muted-foreground ml-auto">
                        {new Date(task.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                ))}
                {universityTasks.length > 5 && (
                  <Link to="/tasks" className="text-xs text-primary hover:underline">
                    +{universityTasks.length - 5} more tasks
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Application Details */}
          {app.applicationId && (
            <div className="mt-4 p-3 rounded-lg bg-secondary/50 text-sm">
              <p className="text-muted-foreground">Application ID: <span className="font-mono">{app.applicationId}</span></p>
              {app.appliedAt && (
                <p className="text-muted-foreground">
                  Applied: {new Date(app.appliedAt).toLocaleDateString()}
                </p>
              )}
              {app.submissionMethod && (
                <p className="text-muted-foreground">
                  Method: <span className="capitalize">{app.submissionMethod}</span>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 lg:w-48">
          {app.status === 'not_started' && (
            <>
              <Button
                onClick={() => onUpdateStatus(app.universityId, 'in_progress')}
                variant="outline"
              >
                <Clock className="w-4 h-4 mr-2" />
                Start Application
              </Button>
              {app.canApply && (
                <Button
                  onClick={() => onSubmit(app)}
                  className="gradient-bg text-white hover:opacity-90"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Submit Application
                </Button>
              )}
            </>
          )}

          {app.status === 'in_progress' && (
            <>
              <Button
                onClick={() => onSubmit(app)}
                className="gradient-bg text-white hover:opacity-90"
                disabled={!app.canApply}
              >
                <Send className="w-4 h-4 mr-2" />
                Submit Application
              </Button>
              {!app.canApply && (
                <p className="text-xs text-muted-foreground text-center">
                  Complete at least 80% of tasks to submit
                </p>
              )}
              <Link to="/tasks">
                <Button variant="outline" className="w-full">
                  <ListChecks className="w-4 h-4 mr-2" />
                  View Tasks
                </Button>
              </Link>
            </>
          )}

          {app.status === 'submitted' && (
            <>
              <Select
                onValueChange={(value) => onUpdateStatus(app.universityId, value as ApplicationStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Update status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="accepted">Accepted 🎉</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="waitlisted">Waitlisted</SelectItem>
                </SelectContent>
              </Select>
              {app.applicationPortalUrl && (
                <Button variant="outline" asChild>
                  <a href={app.applicationPortalUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Portal
                  </a>
                </Button>
              )}
            </>
          )}

          {(app.status === 'accepted' || app.status === 'rejected' || app.status === 'waitlisted') && (
            <div className="text-center">
              {app.status === 'accepted' && (
                <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                  <Trophy className="w-8 h-8 text-success mx-auto mb-2" />
                  <p className="font-medium text-success">Congratulations! 🎉</p>
                  <p className="text-xs text-success/80 mt-1">
                    You've been accepted to {app.universityName}!
                  </p>
                </div>
              )}
              {app.status === 'waitlisted' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUpdateStatus(app.universityId, 'accepted')}
                >
                  Mark as Accepted
                </Button>
              )}
            </div>
          )}

          {/* Auto-submit button (always visible when eligible) */}
          {shouldAutoSubmit && app.status !== 'submitted' && (
            <Button
              onClick={() => onAutoSubmit(app)}
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Auto-Submit
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export const Applications = () => {
  const { 
    applicationProgress, 
    notStartedApps, 
    inProgressApps, 
    submittedApps, 
    decidedApps,
    isLoading, 
    updateApplicationStatus 
  } = useApplications();
  
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<ApplicationProgress | null>(null);
  const [portalUrl, setPortalUrl] = useState('');
  const [appId, setAppId] = useState('');

  // NEW: Auto-check for deadlines
  useEffect(() => {
    const checkDeadlines = () => {
      const now = new Date();
      
      applicationProgress.forEach(app => {
        if (app.deadline && app.status === 'in_progress') {
          const deadline = new Date(app.deadline);
          const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          // Send notification for approaching deadlines
          if (daysUntilDeadline === 7 || daysUntilDeadline === 3 || daysUntilDeadline === 1) {
            console.log(`Deadline approaching for ${app.universityName}: ${daysUntilDeadline} days`);
            // You can add toast notifications here
          }
          
          // Auto-reject if deadline passed and tasks less than 50% complete
          if (daysUntilDeadline < 0 && app.progressPercentage < 50) {
            console.log(`Auto-rejecting ${app.universityName}: deadline passed with ${app.progressPercentage}% completion`);
            // updateApplicationStatus.mutate({ 
            //   universityId: app.universityId, 
            //   status: 'rejected',
            //   rejectionReason: 'Deadline passed with insufficient task completion'
            // });
          }
        }
      });
    };

    // Check deadlines every hour
    const interval = setInterval(checkDeadlines, 60 * 60 * 1000);
    checkDeadlines(); // Initial check
    
    return () => clearInterval(interval);
  }, [applicationProgress]);

  const handleUpdateStatus = (universityId: number, status: ApplicationStatus) => {
    updateApplicationStatus.mutate({ universityId, status });
  };

  const handleOpenSubmitDialog = (app: ApplicationProgress) => {
    setSelectedApp(app);
    setPortalUrl(app.applicationPortalUrl || '');
    setAppId(app.applicationId || '');
    setSubmitDialogOpen(true);
  };

  // NEW: Handle auto-submission
  const handleAutoSubmit = async (app: ApplicationProgress) => {
    const confirmation = window.confirm(
      `Auto-submit application to ${app.universityName}? This will submit with current progress (${app.progressPercentage}% tasks completed).`
    );
    
    if (confirmation) {
      updateApplicationStatus.mutate({
        universityId: app.universityId,
        status: 'submitted',
        submissionMethod: 'auto',
        applicationPortalUrl: 'Auto-submitted via system',
        applicationId: `AUTO-${Date.now()}`,
      });
      
      // Show success message
      alert(`🎉 Congratulations! Your application to ${app.universityName} has been automatically submitted successfully!`);
    }
  };

  // NEW: Handle auto-rejection
  const handleAutoReject = async (app: ApplicationProgress) => {
    const confirmation = window.confirm(
      `Mark application to ${app.universityName} as rejected? Deadline has passed with only ${app.progressPercentage}% tasks completed.`
    );
    
    if (confirmation) {
      updateApplicationStatus.mutate({
        universityId: app.universityId,
        status: 'rejected',
        rejectionReason: 'Deadline passed with insufficient task completion',
      });
    }
  };

  const handleSubmitApplication = () => {
    if (!selectedApp) return;
    
    updateApplicationStatus.mutate({
      universityId: selectedApp.universityId,
      status: 'submitted',
      applicationPortalUrl: portalUrl || undefined,
      applicationId: appId || undefined,
      submissionMethod: 'manual',
    });
    
    setSubmitDialogOpen(false);
    setSelectedApp(null);
    setPortalUrl('');
    setAppId('');
  };

  const totalApps = applicationProgress.length;
  const submittedCount = submittedApps.length + decidedApps.length;
  const acceptedCount = decidedApps.filter(a => a.status === 'accepted').length;
  const rejectedCount = decidedApps.filter(a => a.status === 'rejected').length;

  // Calculate statistics
  const autoEligibleApps = applicationProgress.filter(app => {
    const tasks = []; // You'll need to get tasks for each app
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const completionRate = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;
    return completionRate >= 80 && app.status !== 'submitted' && app.status !== 'accepted' && app.status !== 'rejected';
  }).length;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold mb-1">Applications</h1>
            <p className="text-muted-foreground">
              Track and manage your university applications with auto-submission features
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="px-4 py-2 rounded-lg bg-secondary">
              <span className="text-muted-foreground">Submitted: </span>
              <span className="font-semibold">{submittedCount}/{totalApps}</span>
            </div>
            {acceptedCount > 0 && (
              <div className="px-4 py-2 rounded-lg bg-success/10 text-success">
                <span>Accepted: </span>
                <span className="font-semibold">{acceptedCount}</span>
              </div>
            )}
            {autoEligibleApps > 0 && (
              <div className="px-4 py-2 rounded-lg bg-warning/10 text-warning">
                <span>Auto-submit: </span>
                <span className="font-semibold">{autoEligibleApps} available</span>
              </div>
            )}
          </div>
        </div>

        {/* Auto-Submission Info Card */}
        <div className="glass-card p-6 gradient-border">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-display text-lg font-semibold mb-1">Auto-Submission System</h3>
              <p className="text-sm text-muted-foreground">
                Complete 80%+ of tasks to enable auto-submission. Applications with less than 50% completion 
                after deadlines will be automatically rejected.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center p-3 rounded-lg bg-secondary/50">
              <div className="font-display text-xl font-bold text-success">80%+</div>
              <div className="text-xs text-muted-foreground">Auto-submit threshold</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-secondary/50">
              <div className="font-display text-xl font-bold text-warning">50-79%</div>
              <div className="text-xs text-muted-foreground">Manual submission</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-secondary/50">
              <div className="font-display text-xl font-bold text-destructive">Below 50%</div>
              <div className="text-xs text-muted-foreground">Risk of rejection</div>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {applicationProgress.length === 0 && !isLoading && (
          <div className="glass-card p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-display text-xl font-semibold mb-2">
              No applications yet
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Lock universities from your shortlist to start the application process. 
              Complete tasks to enable auto-submission features.
            </p>
            <Link to="/shortlist">
              <Button className="gradient-bg text-white hover:opacity-90">
                Go to Shortlist
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="glass-card p-6 animate-pulse">
                <div className="h-6 bg-muted rounded w-1/3 mb-4" />
                <div className="h-4 bg-muted rounded w-2/3 mb-2" />
                <div className="h-2 bg-muted rounded w-full" />
              </div>
            ))}
          </div>
        )}

        {/* Application Sections */}
        {!isLoading && applicationProgress.length > 0 && (
          <div className="space-y-8">
            {/* Auto-Submit Eligible */}
            {autoEligibleApps > 0 && (
              <div className="space-y-4">
                <h2 className="font-display text-lg font-semibold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  Ready for Auto-Submission
                  <Badge variant="outline" className="bg-amber-500/20 text-amber-700 dark:text-amber-300">
                    {autoEligibleApps} available
                  </Badge>
                </h2>
                <div className="space-y-4">
                  {applicationProgress
                    .filter(app => {
                      // Filter apps with 80%+ task completion that aren't already submitted/decided
                      return app.progressPercentage >= 80 && 
                        app.status !== 'submitted' && 
                        app.status !== 'accepted' && 
                        app.status !== 'rejected' && 
                        app.status !== 'waitlisted';
                    })
                    .map(app => (
                      <ApplicationCard 
                        key={app.universityId} 
                        app={app} 
                        onUpdateStatus={handleUpdateStatus}
                        onSubmit={handleOpenSubmitDialog}
                        onAutoSubmit={handleAutoSubmit}
                        onAutoReject={handleAutoReject}
                      />
                    ))}
                </div>
              </div>
            )}

            {/* In Progress */}
            {inProgressApps.length > 0 && (
              <div className="space-y-4">
                <h2 className="font-display text-lg font-semibold flex items-center gap-2">
                  <Hourglass className="w-5 h-5 text-warning" />
                  In Progress
                  <Badge variant="outline">{inProgressApps.length}</Badge>
                </h2>
                <div className="space-y-4">
                  {inProgressApps.map(app => (
                    <ApplicationCard 
                      key={app.universityId} 
                      app={app} 
                      onUpdateStatus={handleUpdateStatus}
                      onSubmit={handleOpenSubmitDialog}
                      onAutoSubmit={handleAutoSubmit}
                      onAutoReject={handleAutoReject}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Not Started */}
            {notStartedApps.length > 0 && (
              <div className="space-y-4">
                <h2 className="font-display text-lg font-semibold flex items-center gap-2">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  Not Started
                  <Badge variant="outline">{notStartedApps.length}</Badge>
                </h2>
                <div className="space-y-4">
                  {notStartedApps.map(app => (
                    <ApplicationCard 
                      key={app.universityId} 
                      app={app} 
                      onUpdateStatus={handleUpdateStatus}
                      onSubmit={handleOpenSubmitDialog}
                      onAutoSubmit={handleAutoSubmit}
                      onAutoReject={handleAutoReject}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Submitted */}
            {submittedApps.length > 0 && (
              <div className="space-y-4">
                <h2 className="font-display text-lg font-semibold flex items-center gap-2">
                  <Send className="w-5 h-5 text-primary" />
                  Awaiting Decision
                  <Badge variant="outline">{submittedApps.length}</Badge>
                </h2>
                <div className="space-y-4">
                  {submittedApps.map(app => (
                    <ApplicationCard 
                      key={app.universityId} 
                      app={app} 
                      onUpdateStatus={handleUpdateStatus}
                      onSubmit={handleOpenSubmitDialog}
                      onAutoSubmit={handleAutoSubmit}
                      onAutoReject={handleAutoReject}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Decided */}
            {decidedApps.length > 0 && (
              <div className="space-y-4">
                <h2 className="font-display text-lg font-semibold flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-success" />
                  Results
                  <Badge variant="outline">{decidedApps.length}</Badge>
                </h2>
                <div className="space-y-4">
                  {decidedApps.map(app => (
                    <ApplicationCard 
                      key={app.universityId} 
                      app={app} 
                      onUpdateStatus={handleUpdateStatus}
                      onSubmit={handleOpenSubmitDialog}
                      onAutoSubmit={handleAutoSubmit}
                      onAutoReject={handleAutoReject}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Statistics */}
            <div className="glass-card p-6">
              <h3 className="font-display text-lg font-semibold mb-4">Application Statistics</h3>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-lg bg-secondary/50">
                  <div className="font-display text-2xl font-bold">{totalApps}</div>
                  <div className="text-sm text-muted-foreground">Total Applications</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-success/10">
                  <div className="font-display text-2xl font-bold text-success">{acceptedCount}</div>
                  <div className="text-sm text-muted-foreground">Accepted</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-warning/10">
                  <div className="font-display text-2xl font-bold text-warning">{submittedApps.length}</div>
                  <div className="text-sm text-muted-foreground">Awaiting Decision</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-destructive/10">
                  <div className="font-display text-2xl font-bold text-destructive">{rejectedCount}</div>
                  <div className="text-sm text-muted-foreground">Rejected</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Submit Application Dialog */}
      <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Application</DialogTitle>
            <DialogDescription>
              Confirm that you've submitted your application to {selectedApp?.universityName}.
              You can optionally add your application portal URL and ID for reference.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="portalUrl">Application Portal URL (optional)</Label>
              <Input
                id="portalUrl"
                placeholder="https://apply.university.edu"
                value={portalUrl}
                onChange={(e) => setPortalUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="appId">Application ID (optional)</Label>
              <Input
                id="appId"
                placeholder="e.g., APP-2026-12345"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSubmitDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitApplication}
              className="gradient-bg text-white hover:opacity-90"
            >
              <Send className="w-4 h-4 mr-2" />
              Confirm Manual Submission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Applications;