import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesUpdate } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'>;
type ProfileUpdate = TablesUpdate<'profiles'>;

export const useProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Profile | null;
    },
    enabled: !!user?.id,
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: ProfileUpdate) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      toast({
        title: 'Profile updated',
        description: 'Your changes have been saved.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating profile',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // NEW FUNCTION: Update stage based on user progress
  const updateStage = useMutation({
    mutationFn: async ({ 
      shortlistCount = 0, 
      lockedCount = 0, 
      taskCompletion = 0, 
      submittedApps = 0 
    }: {
      shortlistCount?: number;
      lockedCount?: number;
      taskCompletion?: number; // percentage 0-100
      submittedApps?: number; // number of submitted applications
    }) => {
      if (!user?.id || !profile) throw new Error('Not authenticated or profile not loaded');
      
      let newStage = profile.current_stage;
      const currentStage = profile.current_stage;
      
      // Define stage progression logic
      switch (currentStage) {
        case 'profile_building':
          // Move to discovering once profile is built
          if (profile.onboarding_completed) {
            newStage = 'discovering';
          }
          break;
          
        case 'discovering':
          // Move to shortlisting if user has shortlisted universities
          if (shortlistCount > 0) {
            newStage = 'shortlisting';
          }
          break;
          
        case 'shortlisting':
          // Move to locked if user has locked universities
          if (lockedCount > 0) {
            newStage = 'locked';
          }
          break;
          
        case 'locked':
          // Move to applying if user has completed significant tasks for locked universities
          if (taskCompletion >= 50) { // At least 50% tasks completed
            newStage = 'applying';
          }
          break;
          
        case 'applying':
          // Stay in applying stage - you might want to add a 'completed' stage later
          // For now, just update the current stage data
          break;
          
        default:
          // Default to current stage
          newStage = currentStage;
      }
      
      // Only update if stage changed
      if (newStage !== currentStage) {
        const { data, error } = await supabase
          .from('profiles')
          .update({ current_stage: newStage })
          .eq('user_id', user.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
      
      return profile;
    },
    onSuccess: (updatedProfile) => {
      if (updatedProfile && updatedProfile.current_stage !== profile?.current_stage) {
        queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
        toast({
          title: 'Progress updated!',
          description: `You've advanced to ${getStageLabel(updatedProfile.current_stage)} stage.`,
        });
      }
    },
    onError: (error: Error) => {
      console.error('Error updating stage:', error);
    },
  });

  // Helper function to get stage label
  const getStageLabel = (stage: string): string => {
    switch (stage) {
      case 'onboarding': return 'Onboarding';
      case 'profile_building': return 'Profile Building';
      case 'discovering': return 'Discovering Universities';
      case 'shortlisting': return 'Shortlisting';
      case 'locked': return 'Universities Locked';
      case 'applying': return 'Applying';
      default: return 'Getting Started';
    }
  };

  // Function to manually trigger stage check
  const checkAndUpdateStage = async ({
    shortlistCount,
    lockedCount,
    taskCompletion,
    submittedApps,
  }: {
    shortlistCount?: number;
    lockedCount?: number;
    taskCompletion?: number;
    submittedApps?: number;
  }) => {
    return updateStage.mutateAsync({
      shortlistCount,
      lockedCount,
      taskCompletion,
      submittedApps,
    });
  };

  const calculateProfileStrength = (p: Profile | null): number => {
    if (!p) return 0;
    
    let score = 0;
    const checks = [
      p.full_name,
      p.current_education_level,
      p.degree_major,
      p.graduation_year,
      p.intended_degree,
      p.field_of_study,
      p.target_intake_year,
      p.preferred_countries?.length,
      p.budget_max,
      p.funding_plan,
      p.ielts_status !== 'not_started' || p.toefl_status !== 'not_started',
      p.sop_status !== 'not_started',
    ];
    
    checks.forEach(check => {
      if (check) score += 1;
    });
    
    return Math.round((score / checks.length) * 100);
  };

  return {
    profile,
    isLoading,
    error,
    updateProfile,
    updateStage,
    checkAndUpdateStage,
    getStageLabel,
    calculateProfileStrength,
  };
};