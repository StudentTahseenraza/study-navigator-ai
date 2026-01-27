-- Create enum for application stages
CREATE TYPE public.user_stage AS ENUM ('onboarding', 'profile_building', 'discovering', 'shortlisting', 'locked', 'applying');

-- Create enum for university categories
CREATE TYPE public.university_category AS ENUM ('dream', 'target', 'safe');

-- Create enum for task status
CREATE TYPE public.task_status AS ENUM ('pending', 'in_progress', 'completed');

-- Create enum for exam status
CREATE TYPE public.exam_status AS ENUM ('not_started', 'preparing', 'scheduled', 'completed');

-- Create enum for sop status
CREATE TYPE public.sop_status AS ENUM ('not_started', 'draft', 'ready');

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT,
    email TEXT,
    avatar_url TEXT,
    -- Academic Background
    current_education_level TEXT,
    degree_major TEXT,
    graduation_year INTEGER,
    gpa DECIMAL(4,2),
    -- Study Goals
    intended_degree TEXT,
    field_of_study TEXT,
    target_intake_year INTEGER,
    preferred_countries TEXT[],
    -- Budget
    budget_min INTEGER,
    budget_max INTEGER,
    funding_plan TEXT,
    -- Exams & Readiness
    ielts_status exam_status DEFAULT 'not_started',
    ielts_score DECIMAL(3,1),
    toefl_status exam_status DEFAULT 'not_started',
    toefl_score INTEGER,
    gre_status exam_status DEFAULT 'not_started',
    gre_score INTEGER,
    gmat_status exam_status DEFAULT 'not_started',
    gmat_score INTEGER,
    sop_status sop_status DEFAULT 'not_started',
    -- Progress tracking
    current_stage user_stage DEFAULT 'onboarding',
    onboarding_completed BOOLEAN DEFAULT FALSE,
    profile_strength INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create universities table (public data)
CREATE TABLE public.universities (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    country TEXT NOT NULL,
    city TEXT,
    ranking INTEGER,
    logo_url TEXT,
    website_url TEXT,
    -- Program details
    programs TEXT[],
    tuition_min INTEGER,
    tuition_max INTEGER,
    -- Requirements
    min_gpa DECIMAL(4,2),
    min_ielts DECIMAL(3,1),
    min_toefl INTEGER,
    min_gre INTEGER,
    min_gmat INTEGER,
    -- Application details
    application_deadline DATE,
    intake_months TEXT[],
    acceptance_rate DECIMAL(5,2),
    -- Metadata
    description TEXT,
    requirements TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create university shortlist table
CREATE TABLE public.university_shortlist (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    university_id INTEGER REFERENCES public.universities(id) ON DELETE CASCADE NOT NULL,
    category university_category NOT NULL,
    fit_score INTEGER,
    risk_level TEXT,
    ai_reasoning TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, university_id)
);

-- Create locked universities table
CREATE TABLE public.locked_universities (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    university_id INTEGER REFERENCES public.universities(id) ON DELETE CASCADE NOT NULL,
    locked_at TIMESTAMPTZ DEFAULT now(),
    notes TEXT,
    UNIQUE(user_id, university_id)
);

-- Create AI tasks table
CREATE TABLE public.ai_tasks (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    university_id INTEGER REFERENCES public.universities(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    priority TEXT DEFAULT 'medium',
    status task_status DEFAULT 'pending',
    due_date DATE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create chat messages table for AI counsellor
CREATE TABLE public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.university_shortlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locked_universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create helper function to check profile ownership
CREATE OR REPLACE FUNCTION public.is_profile_owner(profile_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() = profile_user_id
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile" ON public.profiles
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for universities (public read)
CREATE POLICY "Anyone can view universities" ON public.universities
    FOR SELECT USING (true);

-- RLS Policies for university_shortlist
CREATE POLICY "Users can view own shortlist" ON public.university_shortlist
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert to own shortlist" ON public.university_shortlist
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shortlist" ON public.university_shortlist
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from own shortlist" ON public.university_shortlist
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for locked_universities
CREATE POLICY "Users can view own locked universities" ON public.locked_universities
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can lock universities" ON public.locked_universities
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own locked universities" ON public.locked_universities
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can unlock universities" ON public.locked_universities
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for ai_tasks
CREATE POLICY "Users can view own tasks" ON public.ai_tasks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tasks" ON public.ai_tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON public.ai_tasks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks" ON public.ai_tasks
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for chat_messages
CREATE POLICY "Users can view own messages" ON public.chat_messages
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messages" ON public.chat_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

-- Create trigger to auto-create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_tasks_updated_at
  BEFORE UPDATE ON public.ai_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample universities data
INSERT INTO public.universities (name, country, city, ranking, programs, tuition_min, tuition_max, min_gpa, min_ielts, min_toefl, min_gre, acceptance_rate, intake_months, description) VALUES
('Massachusetts Institute of Technology', 'USA', 'Cambridge', 1, ARRAY['Computer Science', 'Engineering', 'Data Science', 'MBA'], 55000, 75000, 3.8, 7.0, 100, 325, 3.96, ARRAY['September', 'January'], 'World-leading technology and engineering institution'),
('Stanford University', 'USA', 'Stanford', 2, ARRAY['Computer Science', 'Business', 'Engineering', 'Medicine'], 56000, 78000, 3.9, 7.0, 100, 330, 4.34, ARRAY['September'], 'Premier research university in Silicon Valley'),
('University of Oxford', 'UK', 'Oxford', 3, ARRAY['Business', 'Law', 'Medicine', 'Computer Science'], 35000, 50000, 3.7, 7.5, 110, NULL, 17.5, ARRAY['October'], 'World oldest English-speaking university'),
('University of Cambridge', 'UK', 'Cambridge', 4, ARRAY['Engineering', 'Natural Sciences', 'Computer Science', 'MBA'], 33000, 48000, 3.7, 7.5, 110, NULL, 21.0, ARRAY['October'], 'Historic institution known for academic excellence'),
('ETH Zurich', 'Switzerland', 'Zurich', 7, ARRAY['Engineering', 'Computer Science', 'Physics', 'Mathematics'], 1500, 3000, 3.5, 7.0, 100, NULL, 27.0, ARRAY['September'], 'Leading European technical university'),
('National University of Singapore', 'Singapore', 'Singapore', 11, ARRAY['Business', 'Computer Science', 'Engineering', 'Data Science'], 20000, 35000, 3.4, 6.5, 92, 320, 28.5, ARRAY['August', 'January'], 'Top-ranked Asian university'),
('University of Toronto', 'Canada', 'Toronto', 18, ARRAY['Computer Science', 'Engineering', 'Business', 'Medicine'], 45000, 60000, 3.3, 6.5, 89, 310, 43.0, ARRAY['September', 'January'], 'Canada leading research university'),
('University of Melbourne', 'Australia', 'Melbourne', 14, ARRAY['Business', 'Engineering', 'Medicine', 'Arts'], 30000, 45000, 3.2, 6.5, 79, NULL, 70.0, ARRAY['March', 'July'], 'Australia top-ranked university'),
('Technical University of Munich', 'Germany', 'Munich', 30, ARRAY['Engineering', 'Computer Science', 'Physics'], 500, 2000, 3.0, 6.5, 88, NULL, 35.0, ARRAY['October', 'April'], 'Germany leading technical university'),
('University of British Columbia', 'Canada', 'Vancouver', 34, ARRAY['Computer Science', 'Business', 'Engineering', 'Environmental Science'], 40000, 55000, 3.2, 6.5, 90, 308, 52.0, ARRAY['September', 'January'], 'Top Canadian research university in beautiful Vancouver'),
('Imperial College London', 'UK', 'London', 6, ARRAY['Engineering', 'Medicine', 'Business', 'Computer Science'], 38000, 55000, 3.6, 7.0, 100, NULL, 14.3, ARRAY['October'], 'World-class science and technology institution'),
('University of Edinburgh', 'UK', 'Edinburgh', 22, ARRAY['Computer Science', 'Business', 'Medicine', 'Arts'], 28000, 42000, 3.3, 6.5, 92, NULL, 43.0, ARRAY['September'], 'Scotland ancient and prestigious university'),
('RWTH Aachen University', 'Germany', 'Aachen', 87, ARRAY['Engineering', 'Computer Science', 'Natural Sciences'], 500, 1500, 2.8, 6.0, 80, NULL, 45.0, ARRAY['October', 'April'], 'Germany largest technical university'),
('Delft University of Technology', 'Netherlands', 'Delft', 47, ARRAY['Engineering', 'Architecture', 'Computer Science'], 15000, 22000, 3.0, 6.5, 90, NULL, 55.0, ARRAY['September'], 'Netherlands leading technical university'),
('University of Sydney', 'Australia', 'Sydney', 19, ARRAY['Business', 'Engineering', 'Medicine', 'Law'], 35000, 50000, 3.0, 6.5, 85, NULL, 68.0, ARRAY['March', 'July'], 'Australia first university with global reputation');

-- Create indexes for better performance
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_university_shortlist_user_id ON public.university_shortlist(user_id);
CREATE INDEX idx_locked_universities_user_id ON public.locked_universities(user_id);
CREATE INDEX idx_ai_tasks_user_id ON public.ai_tasks(user_id);
CREATE INDEX idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX idx_universities_country ON public.universities(country);