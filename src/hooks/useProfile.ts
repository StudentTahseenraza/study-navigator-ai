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
    calculateProfileStrength,
  };
};
