import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { useUniversities } from '@/hooks/useUniversities';
import { useTasks } from '@/hooks/useTasks';

export type ApplicationStatus = 'not_started' | 'in_progress' | 'submitted' | 'accepted' | 'rejected' | 'waitlisted';

export interface ApplicationProgress {
  universityId: number;
  universityName: string;
  status: ApplicationStatus;
  appliedAt: string | null;
  decisionDate: string | null;
  applicationPortalUrl: string | null;
  applicationId: string | null;
  totalTasks: number;
  completedTasks: number;
  progressPercentage: number;
  canApply: boolean;
}

export const useApplications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { lockedUniversities, loadingLocked } = useUniversities();
  const { tasks, isLoading: loadingTasks } = useTasks();

  // Calculate application progress for each locked university
  const applicationProgress: ApplicationProgress[] = lockedUniversities.map(locked => {
    const university = (locked as any).universities;
    const universityTasks = tasks.filter(t => t.university_id === locked.university_id);
    const completedTasks = universityTasks.filter(t => t.status === 'completed').length;
    const totalTasks = universityTasks.length;
    const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    return {
      universityId: locked.university_id,
      universityName: university?.name || 'Unknown University',
      status: ((locked as any).application_status || 'not_started') as ApplicationStatus,
      appliedAt: (locked as any).applied_at || null,
      decisionDate: (locked as any).decision_date || null,
      applicationPortalUrl: (locked as any).application_portal_url || null,
      applicationId: (locked as any).application_id || null,
      totalTasks,
      completedTasks,
      progressPercentage,
      canApply: progressPercentage >= 80, // Allow apply when 80%+ tasks complete
    };
  });

  // Update application status
  const updateApplicationStatus = useMutation({
    mutationFn: async ({ 
      universityId, 
      status,
      applicationPortalUrl,
      applicationId,
      decisionDate,
    }: { 
      universityId: number; 
      status: ApplicationStatus;
      applicationPortalUrl?: string;
      applicationId?: string;
      decisionDate?: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const updateData: Record<string, any> = {
        application_status: status,
      };
      
      if (status === 'submitted') {
        updateData.applied_at = new Date().toISOString();
      }
      
      if (applicationPortalUrl !== undefined) {
        updateData.application_portal_url = applicationPortalUrl;
      }
      
      if (applicationId !== undefined) {
        updateData.application_id = applicationId;
      }
      
      if (decisionDate !== undefined) {
        updateData.decision_date = decisionDate;
      }
      
      const { data, error } = await supabase
        .from('locked_universities')
        .update(updateData)
        .eq('user_id', user.id)
        .eq('university_id', universityId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['locked_universities', user?.id] });
      
      const statusMessages: Record<ApplicationStatus, string> = {
        'not_started': 'Application reset',
        'in_progress': 'Application marked as in progress',
        'submitted': 'Application submitted! 🎉',
        'accepted': 'Congratulations on your acceptance! 🎊',
        'rejected': 'Application status updated',
        'waitlisted': 'Added to waitlist',
      };
      
      toast({
        title: statusMessages[variables.status],
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating application',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Get applications by status
  const notStartedApps = applicationProgress.filter(a => a.status === 'not_started');
  const inProgressApps = applicationProgress.filter(a => a.status === 'in_progress');
  const submittedApps = applicationProgress.filter(a => a.status === 'submitted');
  const decidedApps = applicationProgress.filter(a => 
    a.status === 'accepted' || a.status === 'rejected' || a.status === 'waitlisted'
  );

  return {
    applicationProgress,
    notStartedApps,
    inProgressApps,
    submittedApps,
    decidedApps,
    isLoading: loadingLocked || loadingTasks,
    updateApplicationStatus,
  };
};
