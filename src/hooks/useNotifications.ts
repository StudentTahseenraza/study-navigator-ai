import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

export type NotificationType = 'deadline' | 'reminder' | 'task' | 'document' | 'info' | 'success' | 'warning';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';
export type ReminderType = 'application_deadline' | 'document_deadline' | 'task_due' | 'custom';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  related_university_id: number | null;
  related_task_id: number | null;
  due_date: string | null;
  read_at: string | null;
  dismissed_at: string | null;
  created_at: string;
  metadata: Record<string, any> | null;
}

export interface DeadlineReminder {
  id: string;
  user_id: string;
  university_id: number | null;
  reminder_type: ReminderType;
  title: string;
  description: string | null;
  deadline_date: string;
  remind_days_before: number[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notifications = [], isLoading: loadingNotifications } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .is('dismissed_at', null)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!user?.id,
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch deadline reminders
  const { data: reminders = [], isLoading: loadingReminders } = useQuery({
    queryKey: ['deadline_reminders', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('deadline_reminders')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .gte('deadline_date', new Date().toISOString().split('T')[0])
        .order('deadline_date', { ascending: true });

      if (error) throw error;
      return data as DeadlineReminder[];
    },
    enabled: !!user?.id,
  });

  // Unread count
  const unreadCount = notifications.filter(n => !n.read_at).length;

  // Upcoming deadlines (next 7 days)
  const upcomingDeadlines = reminders.filter(r => {
    const deadline = new Date(r.deadline_date);
    const today = new Date();
    const daysUntil = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil >= 0 && daysUntil <= 7;
  });

  // Create notification
  const createNotification = useMutation({
    mutationFn: async (notification: Omit<Notification, 'id' | 'user_id' | 'created_at' | 'read_at' | 'dismissed_at'>) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          ...notification,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  // Mark as read
  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  // Mark all as read
  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .is('read_at', null);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      toast({
        title: 'All notifications marked as read',
      });
    },
  });

  // Dismiss notification
  const dismissNotification = useMutation({
    mutationFn: async (notificationId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('notifications')
        .update({ dismissed_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  // Create deadline reminder
  const createReminder = useMutation({
    mutationFn: async (reminder: Omit<DeadlineReminder, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('deadline_reminders')
        .insert({
          user_id: user.id,
          ...reminder,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deadline_reminders', user?.id] });
      toast({
        title: 'Reminder created',
        description: 'You will be notified before the deadline.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create reminder',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete reminder
  const deleteReminder = useMutation({
    mutationFn: async (reminderId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('deadline_reminders')
        .delete()
        .eq('id', reminderId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deadline_reminders', user?.id] });
      toast({
        title: 'Reminder deleted',
      });
    },
  });

  // Generate deadline notifications based on reminders
  const checkAndCreateDeadlineNotifications = async () => {
    if (!user?.id) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const reminder of reminders) {
      const deadline = new Date(reminder.deadline_date);
      const daysUntil = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (reminder.remind_days_before.includes(daysUntil)) {
        // Check if notification already exists for this deadline and day
        const existingNotification = notifications.find(
          n => n.metadata?.reminder_id === reminder.id && n.metadata?.days_before === daysUntil
        );

        if (!existingNotification) {
          await createNotification.mutateAsync({
            title: daysUntil === 0 ? '🚨 Deadline Today!' : `⏰ ${daysUntil} day${daysUntil > 1 ? 's' : ''} until deadline`,
            message: reminder.title + (reminder.description ? `: ${reminder.description}` : ''),
            type: 'deadline',
            priority: daysUntil <= 1 ? 'urgent' : daysUntil <= 3 ? 'high' : 'normal',
            related_university_id: reminder.university_id,
            related_task_id: null,
            due_date: reminder.deadline_date,
            metadata: { reminder_id: reminder.id, days_before: daysUntil },
          });
        }
      }
    }
  };

  return {
    notifications,
    reminders,
    unreadCount,
    upcomingDeadlines,
    loadingNotifications,
    loadingReminders,
    createNotification,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    createReminder,
    deleteReminder,
    checkAndCreateDeadlineNotifications,
  };
};
