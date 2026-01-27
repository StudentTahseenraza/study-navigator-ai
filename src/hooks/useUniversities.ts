import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type University = Tables<'universities'>;
type UniversityShortlist = Tables<'university_shortlist'>;
type LockedUniversity = Tables<'locked_universities'>;

export const useUniversities = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all universities
  const { data: universities = [], isLoading: loadingUniversities } = useQuery({
    queryKey: ['universities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('universities')
        .select('*')
        .order('ranking', { ascending: true });
      
      if (error) throw error;
      return data as University[];
    },
  });

  // Fetch user's shortlist
  const { data: shortlist = [], isLoading: loadingShortlist } = useQuery({
    queryKey: ['shortlist', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('university_shortlist')
        .select('*, universities(*)')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch user's locked universities
  const { data: lockedUniversities = [], isLoading: loadingLocked } = useQuery({
    queryKey: ['locked_universities', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('locked_universities')
        .select('*, universities(*)')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Add to shortlist
  const addToShortlist = useMutation({
    mutationFn: async ({ 
      universityId, 
      category, 
      fitScore, 
      riskLevel,
      aiReasoning 
    }: { 
      universityId: number; 
      category: 'dream' | 'target' | 'safe';
      fitScore?: number;
      riskLevel?: string;
      aiReasoning?: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('university_shortlist')
        .insert({
          user_id: user.id,
          university_id: universityId,
          category,
          fit_score: fitScore,
          risk_level: riskLevel,
          ai_reasoning: aiReasoning,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shortlist', user?.id] });
      toast({
        title: 'University shortlisted',
        description: 'Added to your shortlist.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Remove from shortlist
  const removeFromShortlist = useMutation({
    mutationFn: async (universityId: number) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('university_shortlist')
        .delete()
        .eq('user_id', user.id)
        .eq('university_id', universityId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shortlist', user?.id] });
      toast({
        title: 'Removed from shortlist',
      });
    },
  });

  // Lock university
  const lockUniversity = useMutation({
    mutationFn: async ({ universityId, notes }: { universityId: number; notes?: string }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('locked_universities')
        .insert({
          user_id: user.id,
          university_id: universityId,
          notes,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locked_universities', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      toast({
        title: 'University locked!',
        description: 'You can now access application guidance.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Unlock university
  const unlockUniversity = useMutation({
    mutationFn: async (universityId: number) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('locked_universities')
        .delete()
        .eq('user_id', user.id)
        .eq('university_id', universityId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locked_universities', user?.id] });
      toast({
        title: 'University unlocked',
        description: 'You can now modify your selection.',
      });
    },
  });

  const isShortlisted = (universityId: number) => 
    shortlist.some(s => s.university_id === universityId);

  const isLocked = (universityId: number) => 
    lockedUniversities.some(l => l.university_id === universityId);

  return {
    universities,
    shortlist,
    lockedUniversities,
    loadingUniversities,
    loadingShortlist,
    loadingLocked,
    addToShortlist,
    removeFromShortlist,
    lockUniversity,
    unlockUniversity,
    isShortlisted,
    isLocked,
  };
};
