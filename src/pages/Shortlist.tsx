import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useUniversities } from '@/hooks/useUniversities';
import { useTasks } from '@/hooks/useTasks';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { useToast } from '@/hooks/use-toast';
import {
  Lock,
  Unlock,
  Trash2,
  MapPin,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  GraduationCap,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Shortlist = () => {
  const { shortlist, lockedUniversities, removeFromShortlist, lockUniversity, unlockUniversity, loadingShortlist } = useUniversities();
  const { createTask } = useTasks();
  const { profile, updateProfile } = useProfile();
  const { toast } = useToast();

  const dreamUniversities = shortlist.filter(s => s.category === 'dream');
  const targetUniversities = shortlist.filter(s => s.category === 'target');
  const safeUniversities = shortlist.filter(s => s.category === 'safe');

  const isLocked = (universityId: number) => 
    lockedUniversities.some(l => l.university_id === universityId);

  const handleLock = async (uni: typeof shortlist[0]) => {
    try {
      await lockUniversity.mutateAsync({ universityId: uni.university_id });
      
      // Update user stage if first lock
      if (lockedUniversities.length === 0) {
        await updateProfile.mutateAsync({ current_stage: 'locked' });
      }

      // Create initial tasks for this university
      const university = (uni as any).universities;
      await createTask.mutateAsync({
        title: `Complete SOP for ${university?.name || 'University'}`,
        description: 'Write and finalize your Statement of Purpose',
        category: 'Documents',
        priority: 'high',
        university_id: uni.university_id,
      });
      await createTask.mutateAsync({
        title: `Gather transcripts for ${university?.name || 'University'}`,
        description: 'Request official transcripts from your institution',
        category: 'Documents',
        priority: 'high',
        university_id: uni.university_id,
      });
      await createTask.mutateAsync({
        title: `Request recommendations for ${university?.name || 'University'}`,
        description: 'Reach out to professors/managers for recommendation letters',
        category: 'Documents',
        priority: 'medium',
        university_id: uni.university_id,
      });
    } catch (error) {
      console.error('Lock error:', error);
    }
  };

  const handleUnlock = async (universityId: number) => {
    await unlockUniversity.mutateAsync(universityId);
    
    // Update stage if no more locked universities
    if (lockedUniversities.length <= 1) {
      await updateProfile.mutateAsync({ current_stage: 'shortlisting' });
    }
  };

  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'dream':
        return { bg: 'bg-primary/10', border: 'border-primary/30', text: 'text-primary' };
      case 'target':
        return { bg: 'bg-success/10', border: 'border-success/30', text: 'text-success' };
      case 'safe':
        return { bg: 'bg-warning/10', border: 'border-warning/30', text: 'text-warning' };
      default:
        return { bg: 'bg-muted', border: 'border-muted', text: 'text-muted-foreground' };
    }
  };

  const renderUniversitySection = (title: string, universities: typeof shortlist, category: string) => {
    const styles = getCategoryStyles(category);
    
    if (universities.length === 0) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${styles.bg.replace('/10', '')} ${styles.border}`} />
          <h2 className="font-display text-xl font-semibold">{title}</h2>
          <Badge variant="outline" className={styles.text}>
            {universities.length}
          </Badge>
        </div>

        <div className="grid gap-4">
          {universities.map(uni => {
            const university = (uni as any).universities;
            const locked = isLocked(uni.university_id);
            
            return (
              <div
                key={uni.id}
                className={`glass-card p-6 ${locked ? 'ring-2 ring-success' : ''}`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* University Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                        <GraduationCap className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-display text-lg font-semibold">
                          {university?.name || 'Unknown University'}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          {university?.city}, {university?.country}
                        </div>
                      </div>
                      {locked && (
                        <Badge className="bg-success/20 text-success border-success/30 ml-auto lg:ml-0">
                          <Lock className="w-3 h-3 mr-1" />
                          Locked
                        </Badge>
                      )}
                    </div>

                    {/* Stats Row */}
                    <div className="flex flex-wrap gap-4 mt-4 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <DollarSign className="w-4 h-4" />
                        ${((university?.tuition_min || 0) / 1000).toFixed(0)}k - ${((university?.tuition_max || 0) / 1000).toFixed(0)}k/yr
                      </div>
                      {uni.fit_score && (
                        <div className="flex items-center gap-1">
                          <Sparkles className="w-4 h-4 text-primary" />
                          <span>Fit Score: {uni.fit_score}%</span>
                        </div>
                      )}
                      {uni.risk_level && (
                        <div className={`flex items-center gap-1 ${
                          uni.risk_level === 'high' ? 'text-destructive' :
                          uni.risk_level === 'medium' ? 'text-warning' : 'text-success'
                        }`}>
                          <AlertCircle className="w-4 h-4" />
                          <span>{uni.risk_level} risk</span>
                        </div>
                      )}
                    </div>

                    {/* AI Reasoning */}
                    {uni.ai_reasoning && (
                      <p className="mt-3 text-sm text-muted-foreground">
                        {uni.ai_reasoning}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex lg:flex-col gap-2 lg:w-32">
                    {locked ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="flex-1">
                            <Unlock className="w-4 h-4 mr-2" />
                            Unlock
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Unlock this university?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Unlocking will remove your commitment to this university. 
                              Tasks created for this university will remain.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleUnlock(uni.university_id)}>
                              Unlock
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : (
                      <Button 
                        onClick={() => handleLock(uni)}
                        className="flex-1 gradient-bg text-white hover:opacity-90"
                        disabled={lockUniversity.isPending}
                      >
                        <Lock className="w-4 h-4 mr-2" />
                        Lock
                      </Button>
                    )}
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive flex-1">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove from shortlist?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove {university?.name} from your shortlist. 
                            You can add it back later from the Universities page.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => removeFromShortlist.mutate(uni.university_id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold mb-1">My Shortlist</h1>
            <p className="text-muted-foreground">
              Manage your selected universities and lock your choices
            </p>
          </div>
          <Link to="/universities">
            <Button variant="outline" className="gap-2">
              Add More Universities
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Lock Status Banner */}
        {lockedUniversities.length > 0 ? (
          <div className="glass-card p-6 bg-success/5 border-success/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-success" />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-lg font-semibold text-success">
                  {lockedUniversities.length} {lockedUniversities.length === 1 ? 'University' : 'Universities'} Locked!
                </h3>
                <p className="text-muted-foreground">
                  Application guidance is now available. Check your tasks for next steps.
                </p>
              </div>
              <Link to="/tasks">
                <Button className="gradient-bg text-white hover:opacity-90">
                  View Tasks
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        ) : shortlist.length > 0 ? (
          <div className="glass-card p-6 bg-primary/5 border-primary/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Lock className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold">Lock at least one university</h3>
                <p className="text-muted-foreground">
                  Locking commits you to a university and unlocks application guidance with tailored tasks.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Shortlist Content */}
        {loadingShortlist ? (
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="glass-card p-6 animate-pulse">
                <div className="h-6 bg-muted rounded w-1/3 mb-4" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : shortlist.length > 0 ? (
          <div className="space-y-8">
            {renderUniversitySection('Dream Universities', dreamUniversities, 'dream')}
            {renderUniversitySection('Target Universities', targetUniversities, 'target')}
            {renderUniversitySection('Safe Universities', safeUniversities, 'safe')}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
              <GraduationCap className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-display text-xl font-semibold mb-2">No universities shortlisted</h3>
            <p className="text-muted-foreground mb-6">
              Start exploring universities and add them to your shortlist
            </p>
            <Link to="/universities">
              <Button className="gradient-bg text-white hover:opacity-90">
                Discover Universities
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Shortlist;
