
-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deadline', 'reminder', 'task', 'document', 'info', 'success', 'warning')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  related_university_id INTEGER REFERENCES public.universities(id),
  related_task_id INTEGER REFERENCES public.ai_tasks(id) ON DELETE SET NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own notifications
CREATE POLICY "Users can insert own notifications"
ON public.notifications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own notifications (mark as read/dismissed)
CREATE POLICY "Users can update own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
ON public.notifications
FOR DELETE
USING (auth.uid() = user_id);

-- Create deadline reminders table for scheduling
CREATE TABLE public.deadline_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  university_id INTEGER REFERENCES public.universities(id),
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('application_deadline', 'document_deadline', 'task_due', 'custom')),
  title TEXT NOT NULL,
  description TEXT,
  deadline_date DATE NOT NULL,
  remind_days_before INTEGER[] NOT NULL DEFAULT ARRAY[30, 14, 7, 3, 1],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.deadline_reminders ENABLE ROW LEVEL SECURITY;

-- Users can manage their own reminders
CREATE POLICY "Users can view own reminders"
ON public.deadline_reminders FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reminders"
ON public.deadline_reminders FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminders"
ON public.deadline_reminders FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reminders"
ON public.deadline_reminders FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_deadline_reminders_updated_at
BEFORE UPDATE ON public.deadline_reminders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster notification queries
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX idx_notifications_due_date ON public.notifications(user_id, due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_deadline_reminders_user ON public.deadline_reminders(user_id, deadline_date);
