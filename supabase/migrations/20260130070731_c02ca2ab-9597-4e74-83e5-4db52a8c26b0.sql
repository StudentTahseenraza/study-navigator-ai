-- Add application status tracking to locked_universities
ALTER TABLE public.locked_universities 
ADD COLUMN application_status text DEFAULT 'not_started' CHECK (application_status IN ('not_started', 'in_progress', 'submitted', 'accepted', 'rejected', 'waitlisted')),
ADD COLUMN applied_at timestamp with time zone,
ADD COLUMN application_portal_url text,
ADD COLUMN application_id text,
ADD COLUMN decision_date date;

-- Create an index for querying by application status
CREATE INDEX idx_locked_universities_status ON public.locked_universities(user_id, application_status);