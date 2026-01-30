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

-- Delete existing data first (optional)
-- DELETE FROM public.universities;

-- Insert 150+ universities with real logos and data
INSERT INTO public.universities (name, country, city, ranking, logo_url, website_url, programs, tuition_min, tuition_max, min_gpa, min_ielts, min_toefl, min_gre, acceptance_rate, intake_months, description) VALUES

-- USA Universities (40)
('Massachusetts Institute of Technology', 'USA', 'Cambridge', 1, 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/MIT_logo.svg/320px-MIT_logo.svg.png', 'https://www.mit.edu', ARRAY['Computer Science', 'Engineering', 'Business', 'Architecture'], 55000, 75000, 3.8, 7.0, 100, 325, 4.0, ARRAY['September', 'January'], 'World-leading technology university'),
('Stanford University', 'USA', 'Stanford', 2, 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Stanford_University_seal.svg/320px-Stanford_University_seal.svg.png', 'https://www.stanford.edu', ARRAY['Computer Science', 'Business', 'Medicine', 'Law'], 56000, 78000, 3.9, 7.0, 100, 330, 4.3, ARRAY['September'], 'Premier research university in Silicon Valley'),
('Harvard University', 'USA', 'Cambridge', 3, 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Harvard_University_logo.svg/320px-Harvard_University_logo.svg.png', 'https://www.harvard.edu', ARRAY['Business', 'Law', 'Medicine', 'Government'], 58000, 80000, 3.9, 7.5, 105, 330, 4.6, ARRAY['September'], 'Ivy League university'),
('California Institute of Technology', 'USA', 'Pasadena', 4, 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/California_Institute_of_Technology_logo.svg/320px-California_Institute_of_Technology_logo.svg.png', 'https://www.caltech.edu', ARRAY['Physics', 'Engineering', 'Chemistry', 'Biology'], 58000, 78000, 3.9, 7.0, 100, 330, 6.4, ARRAY['September'], 'Science and engineering focused'),
('University of Chicago', 'USA', 'Chicago', 5, 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/University_of_Chicago_seal.svg/320px-University_of_Chicago_seal.svg.png', 'https://www.uchicago.edu', ARRAY['Economics', 'Business', 'Law', 'Social Sciences'], 60000, 82000, 3.8, 7.0, 100, 325, 6.3, ARRAY['September', 'January'], 'Strong in economics and business'),
('University of Pennsylvania', 'USA', 'Philadelphia', 6, 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/University_of_Pennsylvania_seal.svg/320px-University_of_Pennsylvania_seal.svg.png', 'https://www.upenn.edu', ARRAY['Business', 'Medicine', 'Engineering', 'Law'], 58000, 80000, 3.8, 7.0, 100, 325, 7.7, ARRAY['September'], 'Ivy League with strong professional schools'),
('Yale University', 'USA', 'New Haven', 7, 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Yale_University_logo_1.svg/320px-Yale_University_logo_1.svg.png', 'https://www.yale.edu', ARRAY['Law', 'Business', 'Medicine', 'Arts'], 57000, 77000, 3.8, 7.5, 100, 325, 6.5, ARRAY['September'], 'Ivy League known for law and arts'),
('Princeton University', 'USA', 'Princeton', 8, 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Princeton_seal.svg/320px-Princeton_seal.svg.png', 'https://www.princeton.edu', ARRAY['Engineering', 'Public Policy', 'Mathematics', 'Humanities'], 56000, 76000, 3.9, 7.0, 100, 330, 5.7, ARRAY['September'], 'Ivy League focused on undergraduate education'),
('Cornell University', 'USA', 'Ithaca', 9, 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Cornell_University_seal.svg/320px-Cornell_University_seal.svg.png', 'https://www.cornell.edu', ARRAY['Engineering', 'Hotel Management', 'Agriculture', 'Business'], 58000, 80000, 3.7, 7.0, 100, 320, 10.7, ARRAY['August', 'January'], 'Ivy League with diverse programs'),
('Columbia University', 'USA', 'New York City', 10, 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Columbia_University_Seal.svg/320px-Columbia_University_Seal.svg.png', 'https://www.columbia.edu', ARRAY['Business', 'Journalism', 'Law', 'International Relations'], 62000, 85000, 3.8, 7.0, 100, 325, 5.4, ARRAY['September'], 'Ivy League in New York City'),
('University of Michigan', 'USA', 'Ann Arbor', 11, 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/University_of_Michigan_seal.svg/320px-University_of_Michigan_seal.svg.png', 'https://umich.edu', ARRAY['Engineering', 'Business', 'Medicine', 'Law'], 52000, 70000, 3.6, 6.5, 88, 315, 26.0, ARRAY['September', 'January'], 'Top public research university'),
('University of California, Berkeley', 'USA', 'Berkeley', 12, 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Seal_of_University_of_California%2C_Berkeley.svg/320px-Seal_of_University_of_California%2C_Berkeley.svg.png', 'https://www.berkeley.edu', ARRAY['Computer Science', 'Engineering', 'Business', 'Environmental Science'], 45000, 65000, 3.7, 7.0, 90, 320, 16.0, ARRAY['August', 'January'], 'Top public university'),
('University of California, Los Angeles', 'USA', 'Los Angeles', 13, 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/UCLA_Bruins_primary_logo.svg/320px-UCLA_Bruins_primary_logo.svg.png', 'https://www.ucla.edu', ARRAY['Film', 'Medicine', 'Engineering', 'Business'], 42000, 62000, 3.6, 7.0, 87, 315, 14.3, ARRAY['September'], 'Public research in Los Angeles'),
('Northwestern University', 'USA', 'Evanston', 14, 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Northwestern_University_seal.svg/320px-Northwestern_University_seal.svg.png', 'https://www.northwestern.edu', ARRAY['Journalism', 'Business', 'Engineering', 'Law'], 58000, 79000, 3.7, 7.0, 100, 320, 9.1, ARRAY['September'], 'Strong in journalism and business'),
('Duke University', 'USA', 'Durham', 15, 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Duke_University_seal.svg/320px-Duke_University_seal.svg.png', 'https://www.duke.edu', ARRAY['Medicine', 'Business', 'Law', 'Engineering'], 59000, 81000, 3.7, 7.0, 100, 320, 8.3, ARRAY['August'], 'Top private research university'),
('Johns Hopkins University', 'USA', 'Baltimore', 16, 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Johns_Hopkins_University_Logo.svg/320px-Johns_Hopkins_University_Logo.svg.png', 'https://www.jhu.edu', ARRAY['Medicine', 'Public Health', 'Engineering', 'International Studies'], 58000, 80000, 3.7, 7.0, 100, 320, 11.1, ARRAY['August', 'January'], 'World leader in medical research'),
('Carnegie Mellon University', 'USA', 'Pittsburgh', 17, 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Seal_of_Carnegie_Mellon_University.svg/320px-Seal_of_Carnegie_Mellon_University.svg.png', 'https://www.cmu.edu', ARRAY['Computer Science', 'Engineering', 'Business', 'Drama'], 58000, 79000, 3.7, 7.0, 102, 325, 17.3, ARRAY['August'], 'Top for computer science and drama'),
('New York University', 'USA', 'New York City', 18, 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/NYU_seal.svg/320px-NYU_seal.svg.png', 'https://www.nyu.edu', ARRAY['Business', 'Law', 'Arts', 'Medicine'], 55000, 75000, 3.6, 7.0, 100, 320, 21.1, ARRAY['September', 'January'], 'Urban university in NYC'),
('University of Southern California', 'USA', 'Los Angeles', 19, 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Seal_of_the_University_of_Southern_California.svg/320px-Seal_of_the_University_of_Southern_California.svg.png', 'https://www.usc.edu', ARRAY['Film', 'Business', 'Engineering', 'Communication'], 60000, 82000, 3.6, 7.0, 100, 320, 16.1, ARRAY['August'], 'Private research in Los Angeles'),
('University of Texas at Austin', 'USA', 'Austin', 20, 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/University_of_Texas_at_Austin_seal.svg/320px-University_of_Texas_at_Austin_seal.svg.png', 'https://www.utexas.edu', ARRAY['Engineering', 'Business', 'Computer Science', 'Law'], 38000, 58000, 3.5, 6.5, 79, 310, 31.8, ARRAY['August', 'January'], 'Flagship Texas university'),

-- UK Universities (25)
('University of Oxford', 'UK', 'Oxford', 1, 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/University_of_Oxford_seal.svg/320px-University_of_Oxford_seal.svg.png', 'https://www.ox.ac.uk', ARRAY['Humanities', 'Sciences', 'Medicine', 'Law'], 35000, 50000, 3.7, 7.5, 110, NULL, 17.5, ARRAY['October'], 'World oldest English-speaking university'),
('University of Cambridge', 'UK', 'Cambridge', 2, 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/University_of_Cambridge_coat_of_arms.svg/320px-University_of_Cambridge_coat_of_arms.svg.png', 'https://www.cam.ac.uk', ARRAY['Natural Sciences', 'Engineering', 'Medicine', 'Humanities'], 33000, 48000, 3.7, 7.5, 110, NULL, 21.0, ARRAY['October'], 'Historic university'),
('Imperial College London', 'UK', 'London', 3, 'https://upload.wikimedia.org/wikipedia/en/thumb/2/2c/Imperial_College_London_crest.svg/320px-Imperial_College_London_crest.svg.png', 'https://www.imperial.ac.uk', ARRAY['Engineering', 'Medicine', 'Business', 'Natural Sciences'], 38000, 55000, 3.6, 7.0, 100, NULL, 14.3, ARRAY['October'], 'Science and technology focused'),
('University College London', 'UK', 'London', 4, 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/University_College_London_logo.svg/320px-University_College_London_logo.svg.png', 'https://www.ucl.ac.uk', ARRAY['Medicine', 'Architecture', 'Economics', 'Computer Science'], 28000, 42000, 3.5, 6.5, 92, NULL, 15.0, ARRAY['September'], 'Multi-disciplinary university'),
('London School of Economics', 'UK', 'London', 5, 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/LSE_Logo.svg/320px-LSE_Logo.svg.png', 'https://www.lse.ac.uk', ARRAY['Economics', 'Politics', 'Law', 'Social Sciences'], 23000, 35000, 3.6, 7.0, 100, NULL, 8.9, ARRAY['October'], 'Social sciences specialist'),
('University of Edinburgh', 'UK', 'Edinburgh', 6, 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/University_of_Edinburgh_coat_of_arms.svg/320px-University_of_Edinburgh_coat_of_arms.svg.png', 'https://www.ed.ac.uk', ARRAY['Medicine', 'Law', 'Business', 'Computer Science'], 28000, 42000, 3.3, 6.5, 92, NULL, 43.0, ARRAY['September'], 'Scotland ancient university'),
('King''s College London', 'UK', 'London', 7, 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/King%27s_College_London_Logo.svg/320px-King%27s_College_London_Logo.svg.png', 'https://www.kcl.ac.uk', ARRAY['Medicine', 'Law', 'Humanities', 'Social Sciences'], 24000, 38000, 3.4, 6.5, 92, NULL, 13.0, ARRAY['September'], 'Research intensive university'),
('University of Manchester', 'UK', 'Manchester', 8, 'https://upload.wikimedia.org/wikipedia/en/thumb/9/90/University_of_Manchester_coat_of_arms.svg/320px-University_of_Manchester_coat_of_arms.svg.png', 'https://www.manchester.ac.uk', ARRAY['Engineering', 'Business', 'Medicine', 'Computer Science'], 23000, 35000, 3.2, 6.0, 80, NULL, 56.0, ARRAY['September'], 'Red brick university'),
('University of Bristol', 'UK', 'Bristol', 9, 'https://upload.wikimedia.org/wikipedia/en/thumb/2/22/University_of_Bristol_coat_of_arms.svg/320px-University_of_Bristol_coat_of_arms.svg.png', 'https://www.bristol.ac.uk', ARRAY['Engineering', 'Law', 'Medicine', 'Social Sciences'], 22000, 33000, 3.3, 6.5, 90, NULL, 67.3, ARRAY['September'], 'Research-led university'),
('University of Warwick', 'UK', 'Coventry', 10, 'https://upload.wikimedia.org/wikipedia/en/thumb/b/b5/University_of_Warwick_coat_of_arms.svg/320px-University_of_Warwick_coat_of_arms.svg.png', 'https://www.warwick.ac.uk', ARRAY['Business', 'Economics', 'Engineering', 'Mathematics'], 21000, 32000, 3.4, 6.5, 92, NULL, 14.0, ARRAY['October'], 'Business and economics strong'),

-- Canada Universities (20)
('University of Toronto', 'Canada', 'Toronto', 1, 'https://upload.wikimedia.org/wikipedia/en/thumb/6/6c/University_of_Toronto_coat_of_arms.svg/320px-University_of_Toronto_coat_of_arms.svg.png', 'https://www.utoronto.ca', ARRAY['Computer Science', 'Engineering', 'Business', 'Medicine'], 45000, 60000, 3.3, 6.5, 89, 310, 43.0, ARRAY['September', 'January'], 'Canada leading research university'),
('University of British Columbia', 'Canada', 'Vancouver', 2, 'https://upload.wikimedia.org/wikipedia/en/thumb/5/58/University_of_British_Columbia_logo.svg/320px-University_of_British_Columbia_logo.svg.png', 'https://www.ubc.ca', ARRAY['Computer Science', 'Business', 'Engineering', 'Environmental Science'], 40000, 55000, 3.2, 6.5, 90, 308, 52.0, ARRAY['September', 'January'], 'Top Canadian university'),
('McGill University', 'Canada', 'Montreal', 3, 'https://upload.wikimedia.org/wikipedia/en/thumb/5/5e/McGill_University_CoA.svg/320px-McGill_University_CoA.svg.png', 'https://www.mcgill.ca', ARRAY['Medicine', 'Engineering', 'Business', 'Computer Science'], 25000, 40000, 3.5, 6.5, 86, 310, 46.0, ARRAY['September', 'January'], 'Top Canadian medical school'),
('University of Waterloo', 'Canada', 'Waterloo', 4, 'https://upload.wikimedia.org/wikipedia/en/thumb/6/6e/University_of_Waterloo_seal.svg/320px-University_of_Waterloo_seal.svg.png', 'https://uwaterloo.ca', ARRAY['Computer Science', 'Engineering', 'Mathematics', 'Business'], 48000, 65000, 3.4, 6.5, 90, 310, 53.0, ARRAY['September', 'January'], 'Strong in co-op programs'),
('University of Alberta', 'Canada', 'Edmonton', 5, 'https://upload.wikimedia.org/wikipedia/en/thumb/4/44/University_of_Alberta_coat_of_arms.svg/320px-University_of_Alberta_coat_of_arms.svg.png', 'https://www.ualberta.ca', ARRAY['Engineering', 'Business', 'Medicine', 'Science'], 30000, 45000, 3.0, 6.5, 86, 300, 58.0, ARRAY['September', 'January'], 'Research intensive university'),
('McMaster University', 'Canada', 'Hamilton', 6, 'https://upload.wikimedia.org/wikipedia/en/thumb/3/39/McMaster_University_CoA.svg/320px-McMaster_University_CoA.svg.png', 'https://www.mcmaster.ca', ARRAY['Medicine', 'Engineering', 'Business', 'Health Sciences'], 35000, 50000, 3.3, 6.5, 86, 305, 58.7, ARRAY['September'], 'Health sciences strong'),
('Queen''s University', 'Canada', 'Kingston', 7, 'https://upload.wikimedia.org/wikipedia/en/thumb/8/8e/Queen%27s_University_CoA.svg/320px-Queen%27s_University_CoA.svg.png', 'https://www.queensu.ca', ARRAY['Business', 'Engineering', 'Law', 'Medicine'], 42000, 58000, 3.2, 6.5, 88, 305, 42.0, ARRAY['September'], 'Strong business school'),
('Western University', 'Canada', 'London', 8, 'https://upload.wikimedia.org/wikipedia/en/thumb/8/8c/Western_University_Logo.svg/320px-Western_University_Logo.svg.png', 'https://www.uwo.ca', ARRAY['Business', 'Medicine', 'Engineering', 'Social Sciences'], 38000, 52000, 3.1, 6.5, 83, 300, 58.0, ARRAY['September'], 'Strong in business and medicine'),
('University of Calgary', 'Canada', 'Calgary', 9, 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/UCalgary_Logo.png/320px-UCalgary_Logo.png', 'https://www.ucalgary.ca', ARRAY['Engineering', 'Business', 'Medicine', 'Energy Studies'], 28000, 42000, 3.0, 6.5, 86, 300, 60.0, ARRAY['September', 'January'], 'Strong in energy and engineering'),
('University of Ottawa', 'Canada', 'Ottawa', 10, 'https://upload.wikimedia.org/wikipedia/en/thumb/6/68/University_of_Ottawa_seal.svg/320px-University_of_Ottawa_seal.svg.png', 'https://www.uottawa.ca', ARRAY['Law', 'Medicine', 'Engineering', 'Social Sciences'], 25000, 38000, 3.0, 6.5, 86, NULL, 55.0, ARRAY['September', 'January'], 'Bilingual university'),

-- Australia Universities (15)
('University of Melbourne', 'Australia', 'Melbourne', 1, 'https://upload.wikimedia.org/wikipedia/en/thumb/7/71/University_of_Melbourne_coat_of_arms.svg/320px-University_of_Melbourne_coat_of_arms.svg.png', 'https://www.unimelb.edu.au', ARRAY['Business', 'Engineering', 'Medicine', 'Arts'], 30000, 45000, 3.2, 6.5, 79, NULL, 70.0, ARRAY['March', 'July'], 'Australia top-ranked university'),
('Australian National University', 'Australia', 'Canberra', 2, 'https://upload.wikimedia.org/wikipedia/en/thumb/5/5b/Australian_National_University_logo.svg/320px-Australian_National_University_logo.svg.png', 'https://www.anu.edu.au', ARRAY['Science', 'Politics', 'Economics', 'Engineering'], 32000, 48000, 3.3, 6.5, 80, NULL, 35.0, ARRAY['February', 'July'], 'Research intensive national university'),
('University of Sydney', 'Australia', 'Sydney', 3, 'https://upload.wikimedia.org/wikipedia/en/thumb/c/c4/University_of_Sydney_seal.svg/320px-University_of_Sydney_seal.svg.png', 'https://www.sydney.edu.au', ARRAY['Business', 'Engineering', 'Medicine', 'Law'], 35000, 50000, 3.0, 6.5, 85, NULL, 68.0, ARRAY['March', 'July'], 'Australia first university'),
('University of New South Wales', 'Australia', 'Sydney', 4, 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/UNSW_logo.svg/320px-UNSW_logo.svg.png', 'https://www.unsw.edu.au', ARRAY['Engineering', 'Business', 'Medicine', 'Science'], 34000, 49000, 3.1, 6.5, 90, NULL, 65.0, ARRAY['February', 'June'], 'Strong in engineering'),
('University of Queensland', 'Australia', 'Brisbane', 5, 'https://upload.wikimedia.org/wikipedia/en/thumb/2/27/University_of_Queensland_logo.svg/320px-University_of_Queensland_logo.svg.png', 'https://www.uq.edu.au', ARRAY['Business', 'Engineering', 'Medicine', 'Science'], 33000, 47000, 3.1, 6.5, 87, NULL, 70.0, ARRAY['February', 'July'], 'Research intensive university'),
('Monash University', 'Australia', 'Melbourne', 6, 'https://upload.wikimedia.org/wikipedia/en/thumb/7/7c/Monash_University_logo.svg/320px-Monash_University_logo.svg.png', 'https://www.monash.edu', ARRAY['Business', 'Engineering', 'Medicine', 'Pharmacy'], 32000, 46000, 3.0, 6.5, 79, NULL, 75.0, ARRAY['February', 'July'], 'Australia largest university'),
('University of Western Australia', 'Australia', 'Perth', 7, 'https://upload.wikimedia.org/wikipedia/en/thumb/b/bf/University_of_Western_Australia_logo.svg/320px-University_of_Western_Australia_logo.svg.png', 'https://www.uwa.edu.au', ARRAY['Engineering', 'Business', 'Medicine', 'Marine Science'], 31000, 45000, 3.0, 6.5, 82, NULL, 80.0, ARRAY['February', 'July'], 'Leading Western Australian university'),
('University of Adelaide', 'Australia', 'Adelaide', 8, 'https://upload.wikimedia.org/wikipedia/en/thumb/6/60/University_of_Adelaide_coat_of_arms.svg/320px-University_of_Adelaide_coat_of_arms.svg.png', 'https://www.adelaide.edu.au', ARRAY['Medicine', 'Engineering', 'Wine Science', 'Business'], 30000, 44000, 3.0, 6.5, 79, NULL, 75.0, ARRAY['February', 'July'], 'Research intensive university'),
('University of Technology Sydney', 'Australia', 'Sydney', 9, 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/University_of_Technology_Sydney_logo.svg/320px-University_of_Technology_Sydney_logo.svg.png', 'https://www.uts.edu.au', ARRAY['Engineering', 'Business', 'Design', 'IT'], 28000, 42000, 2.8, 6.5, 79, NULL, 85.0, ARRAY['February', 'July'], 'Technology focused university'),
('Macquarie University', 'Australia', 'Sydney', 10, 'https://upload.wikimedia.org/wikipedia/en/thumb/6/65/Macquarie_University_coat_of_arms.svg/320px-Macquarie_University_coat_of_arms.svg.png', 'https://www.mq.edu.au', ARRAY['Business', 'Linguistics', 'Psychology', 'Media'], 27000, 41000, 2.7, 6.5, 83, NULL, 90.0, ARRAY['February', 'July'], 'Strong in business and linguistics'),

-- Germany Universities (15)
('Technical University of Munich', 'Germany', 'Munich', 1, 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/TUM_logo.svg/320px-TUM_logo.svg.png', 'https://www.tum.de', ARRAY['Engineering', 'Computer Science', 'Physics', 'Business'], 500, 2000, 3.0, 6.5, 88, NULL, 35.0, ARRAY['October', 'April'], 'Germany leading technical university'),
('Ludwig Maximilian University', 'Germany', 'Munich', 2, 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Logo_LMU_Muenchen.svg/320px-Logo_LMU_Muenchen.svg.png', 'https://www.lmu.de', ARRAY['Medicine', 'Law', 'Business', 'Humanities'], 500, 2000, 3.0, 6.5, 88, NULL, 30.0, ARRAY['October', 'April'], 'Comprehensive university'),
('Heidelberg University', 'Germany', 'Heidelberg', 3, 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Logo_Universit%C3%A4t_Heidelberg.svg/320px-Logo_Universit%C3%A4t_Heidelberg.svg.png', 'https://www.uni-heidelberg.de', ARRAY['Medicine', 'Law', 'Humanities', 'Sciences'], 500, 2000, 3.0, 6.5, 88, NULL, 32.0, ARRAY['October', 'April'], 'Germany oldest university'),
('RWTH Aachen University', 'Germany', 'Aachen', 4, 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/RWTH_Aachen_Logo.svg/320px-RWTH_Aachen_Logo.svg.png', 'https://www.rwth-aachen.de', ARRAY['Engineering', 'Computer Science', 'Natural Sciences'], 500, 1500, 2.8, 6.0, 80, NULL, 45.0, ARRAY['October', 'April'], 'Germany largest technical university'),
('Humboldt University', 'Germany', 'Berlin', 5, 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Humboldt_Universit%C3%A4t_zu_Berlin_logo.svg/320px-Humboldt_Universit%C3%A4t_zu_Berlin_logo.svg.png', 'https://www.hu-berlin.de', ARRAY['Humanities', 'Social Sciences', 'Natural Sciences'], 500, 2000, 2.8, 6.5, 88, NULL, 50.0, ARRAY['October', 'April'], 'Research university in Berlin'),
('Free University of Berlin', 'Germany', 'Berlin', 6, 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Logo_Freie_Universit%C3%A4t_Berlin.svg/320px-Logo_Freie_Universit%C3%A4t_Berlin.svg.png', 'https://www.fu-berlin.de', ARRAY['Social Sciences', 'Humanities', 'Natural Sciences'], 500, 2000, 2.8, 6.5, 88, NULL, 55.0, ARRAY['October', 'April'], 'Social sciences strong'),
('Karlsruhe Institute of Technology', 'Germany', 'Karlsruhe', 7, 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/KIT_Logo.svg/320px-KIT_Logo.svg.png', 'https://www.kit.edu', ARRAY['Engineering', 'Computer Science', 'Physics'], 500, 2000, 3.0, 6.5, 88, NULL, 40.0, ARRAY['October', 'April'], 'Engineering and technology focus'),
('University of Freiburg', 'Germany', 'Freiburg', 8, 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Logo_Universit%C3%A4t_Freiburg.svg/320px-Logo_Universit%C3%A4t_Freiburg.svg.png', 'https://www.uni-freiburg.de', ARRAY['Medicine', 'Law', 'Humanities', 'Sciences'], 500, 2000, 2.8, 6.5, 88, NULL, 48.0, ARRAY['October', 'April'], 'Comprehensive research university'),
('University of Göttingen', 'Germany', 'Göttingen', 9, 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Georg-August-Universit%C3%A4t_G%C3%B6ttingen_Logo_2016.svg/320px-Georg-August-Universit%C3%A4t_G%C3%B6ttingen_Logo_2016.svg.png', 'https://www.uni-goettingen.de', ARRAY['Natural Sciences', 'Humanities', 'Medicine'], 500, 2000, 2.7, 6.5, 88, NULL, 52.0, ARRAY['October', 'April'], 'Strong in natural sciences'),
('Technical University of Berlin', 'Germany', 'Berlin', 10, 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/TU_Berlin_logo.svg/320px-TU_Berlin_logo.svg.png', 'https://www.tu.berlin', ARRAY['Engineering', 'Computer Science', 'Architecture'], 500, 2000, 2.8, 6.5, 88, NULL, 45.0, ARRAY['October', 'April'], 'Technical university in Berlin'),

-- Netherlands Universities (10)
('Delft University of Technology', 'Netherlands', 'Delft', 1, 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/TU_Delft_logo.svg/320px-TU_Delft_logo.svg.png', 'https://www.tudelft.nl', ARRAY['Engineering', 'Architecture', 'Computer Science'], 15000, 22000, 3.0, 6.5, 90, NULL, 55.0, ARRAY['September'], 'Netherlands leading technical university'),
('University of Amsterdam', 'Netherlands', 'Amsterdam', 2, 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Universiteit_van_Amsterdam_logo.svg/320px-Universiteit_van_Amsterdam_logo.svg.png', 'https://www.uva.nl', ARRAY['Business', 'Economics', 'Social Sciences', 'Humanities'], 12000, 18000, 3.0, 6.5, 92, NULL, 60.0, ARRAY['September'], 'Comprehensive university'),
('Utrecht University', 'Netherlands', 'Utrecht', 3, 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Utrecht_University_logo.svg/320px-Utrecht_University_logo.svg.png', 'https://www.uu.nl', ARRAY['Medicine', 'Law', 'Humanities', 'Sciences'], 12000, 19000, 3.0, 6.5, 93, NULL, 58.0, ARRAY['September'], 'Research intensive university'),
('Eindhoven University of Technology', 'Netherlands', 'Eindhoven', 4, 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/TUe_logo.png/320px-TUe_logo.png', 'https://www.tue.nl', ARRAY['Engineering', 'Computer Science', 'Industrial Design'], 15000, 22000, 3.0, 6.5, 90, NULL, 50.0, ARRAY['September'], 'Technology and design focus'),
('Leiden University', 'Netherlands', 'Leiden', 5, 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Leiden_University_logo.svg/320px-Leiden_University_logo.svg.png', 'https://www.universiteitleiden.nl', ARRAY['Law', 'Humanities', 'Social Sciences', 'Medicine'], 11000, 17000, 3.0, 6.5, 90, NULL, 62.0, ARRAY['September'], 'Netherlands oldest university'),
('Wageningen University', 'Netherlands', 'Wageningen', 6, 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Wageningen_University_Logo.svg/320px-Wageningen_University_Logo.svg.png', 'https://www.wur.nl', ARRAY['Agriculture', 'Food Science', 'Environmental Science'], 15000, 23000, 3.0, 6.5, 80, NULL, 45.0, ARRAY['September'], 'Agriculture and life sciences'),
('University of Groningen', 'Netherlands', 'Groningen', 7, 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Logo_University_of_Groningen.svg/320px-Logo_University_of_Groningen.svg.png', 'https://www.rug.nl', ARRAY['Medicine', 'Law', 'Business', 'Humanities'], 11000, 18000, 3.0, 6.5, 90, NULL, 65.0, ARRAY['September'], 'Comprehensive northern university'),
('Erasmus University Rotterdam', 'Netherlands', 'Rotterdam', 8, 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/EUR_logo.svg/320px-EUR_logo.svg.png', 'https://www.eur.nl', ARRAY['Business', 'Economics', 'Medicine', 'Law'], 13000, 20000, 3.0, 6.5, 91, NULL, 52.0, ARRAY['September'], 'Strong in business and economics'),
('Vrije Universiteit Amsterdam', 'Netherlands', 'Amsterdam', 9, 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Vrije_Universiteit_Amsterdam_logo.svg/320px-Vrije_Universiteit_Amsterdam_logo.svg.png', 'https://www.vu.nl', ARRAY['Business', 'Law', 'Social Sciences', 'Humanities'], 12000, 19000, 3.0, 6.5, 92, NULL, 58.0, ARRAY['September'], 'Comprehensive Amsterdam university'),
('Maastricht University', 'Netherlands', 'Maastricht', 10, 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Logo_Maastricht_University.svg/320px-Logo_Maastricht_University.svg.png', 'https://www.maastrichtuniversity.nl', ARRAY['Medicine', 'Law', 'Business', 'Psychology'], 11000, 18000, 3.0, 6.5, 90, NULL, 68.0, ARRAY['September'], 'Problem-based learning focus'),

-- Switzerland Universities (8)
('ETH Zurich', 'Switzerland', 'Zurich', 1, 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/ETH_Zurich_Logo_black.svg/320px-ETH_Zurich_Logo_black.svg.png', 'https://ethz.ch', ARRAY['Engineering', 'Computer Science', 'Physics', 'Mathematics'], 1500, 3000, 3.5, 7.0, 100, NULL, 27.0, ARRAY['September'], 'Leading European technical university'),
('EPFL', 'Switzerland', 'Lausanne', 2, 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/EPFL_Logo.svg/320px-EPFL_Logo.svg.png', 'https://www.epfl.ch', ARRAY['Engineering', 'Computer Science', 'Architecture', 'Life Sciences'], 1500, 3000, 3.5, 7.0, 100, NULL, 30.0, ARRAY['September'], 'Swiss technical university'),
('University of Zurich', 'Switzerland', 'Zurich', 3, 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/University_of_Zurich_logo.svg/320px-University_of_Zurich_logo.svg.png', 'https://www.uzh.ch', ARRAY['Medicine', 'Law', 'Business', 'Humanities'], 1500, 3000, 3.3, 6.5, 100, NULL, 35.0, ARRAY['September'], 'Largest Swiss university'),
('University of Geneva', 'Switzerland', 'Geneva', 4, 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/University_of_Geneva_logo.svg/320px-University_of_Geneva_logo.svg.png', 'https://www.unige.ch', ARRAY['International Relations', 'Medicine', 'Law', 'Humanities'], 1500, 3000, 3.2, 6.5, 100, NULL, 40.0, ARRAY['September'], 'Strong in international relations'),
('University of Lausanne', 'Switzerland', 'Lausanne', 5, 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/University_of_Lausanne_logo.svg/320px-University_of_Lausanne_logo.svg.png', 'https://www.unil.ch', ARRAY['Business', 'Law', 'Medicine', 'Social Sciences'], 1500, 3000, 3.2, 6.5, 100, NULL, 38.0, ARRAY['September'], 'French-speaking Swiss university'),
('University of Basel', 'Switzerland', 'Basel', 6, 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Universit%C3%A4t_Basel_Logo.svg/320px-Universit%C3%A4t_Basel_Logo.svg.png', 'https://www.unibas.ch', ARRAY['Medicine', 'Life Sciences', 'Humanities', 'Business'], 1500, 3000, 3.2, 6.5, 100, NULL, 42.0, ARRAY['September'], 'Switzerland oldest university'),
('University of Bern', 'Switzerland', 'Bern', 7, 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/University_of_Bern_logo.svg/320px-University_of_Bern_logo.svg.png', 'https://www.unibe.ch', ARRAY['Medicine', 'Law', 'Humanities', 'Business'], 1500, 3000, 3.1, 6.5, 100, NULL, 45.0, ARRAY['September'], 'Swiss federal capital university'),
('University of St. Gallen', 'Switzerland', 'St. Gallen', 8, 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Universit%C3%A4t_St._Gallen_Logo.svg/320px-Universit%C3%A4t_St._Gallen_Logo.svg.png', 'https://www.unisg.ch', ARRAY['Business', 'Economics', 'Law', 'International Affairs'], 1500, 3000, 3.4, 6.5, 100, NULL, 25.0, ARRAY['September'], 'Business and economics specialist'),

-- Singapore Universities (5)
('National University of Singapore', 'Singapore', 'Singapore', 1, 'https://upload.wikimedia.org/wikipedia/en/thumb/b/b9/NUS_coat_of_arms.svg/320px-NUS_coat_of_arms.svg.png', 'https://www.nus.edu.sg', ARRAY['Business', 'Computer Science', 'Engineering', 'Data Science'], 20000, 35000, 3.4, 6.5, 92, 320, 28.5, ARRAY['August', 'January'], 'Top-ranked Asian university'),
('Nanyang Technological University', 'Singapore', 'Singapore', 2, 'https://upload.wikimedia.org/wikipedia/en/thumb/b/b9/Nanyang_Technological_University_Logo.svg/320px-Nanyang_Technological_University_Logo.svg.png', 'https://www.ntu.edu.sg', ARRAY['Engineering', 'Business', 'Computer Science', 'Science'], 19000, 34000, 3.3, 6.5, 90, 315, 30.0, ARRAY['August', 'January'], 'Technology focused university'),
('Singapore Management University', 'Singapore', 'Singapore', 3, 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Singapore_Management_University_logo.svg/320px-Singapore_Management_University_logo.svg.png', 'https://www.smu.edu.sg', ARRAY['Business', 'Economics', 'Law', 'Computing'], 22000, 38000, 3.4, 6.5, 90, NULL, 35.0, ARRAY['August', 'January'], 'Business and law focused'),
('Singapore University of Technology', 'Singapore', 'Singapore', 4, 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f5/Singapore_University_of_Technology_and_Design_logo.svg/320px-Singapore_University_of_Technology_and_Design_logo.svg.png', 'https://www.sutd.edu.sg', ARRAY['Engineering', 'Architecture', 'Design', 'Technology'], 20000, 36000, 3.3, 6.5, 90, NULL, 40.0, ARRAY['August', 'January'], 'Technology and design focus'),
('Singapore Institute of Technology', 'Singapore', 'Singapore', 5, 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Singapore_Institute_of_Technology_logo.svg/320px-Singapore_Institute_of_Technology_logo.svg.png', 'https://www.singaporetech.edu.sg', ARRAY['Engineering', 'Business', 'Computing', 'Design'], 18000, 32000, 3.0, 6.0, 80, NULL, 50.0, ARRAY['August', 'January'], 'Applied learning focus'),

-- Japan Universities (8)
('University of Tokyo', 'Japan', 'Tokyo', 1, 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/University_of_Tokyo_logo.svg/320px-University_of_Tokyo_logo.svg.png', 'https://www.u-tokyo.ac.jp', ARRAY['Engineering', 'Medicine', 'Science', 'Humanities'], 6000, 10000, 3.5, 6.5, 95, NULL, 34.0, ARRAY['April', 'September'], 'Japan top university'),
('Kyoto University', 'Japan', 'Kyoto', 2, 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Kyoto_University_logo.svg/320px-Kyoto_University_logo.svg.png', 'https://www.kyoto-u.ac.jp', ARRAY['Science', 'Engineering', 'Medicine', 'Humanities'], 6000, 10000, 3.4, 6.5, 90, NULL, 36.0, ARRAY['April', 'September'], 'Research intensive university'),
('Osaka University', 'Japan', 'Osaka', 3, 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Osaka_University_logo.svg/320px-Osaka_University_logo.svg.png', 'https://www.osaka-u.ac.jp', ARRAY['Medicine', 'Engineering', 'Science', 'Humanities'], 6000, 10000, 3.3, 6.5, 85, NULL, 38.0, ARRAY['April', 'September'], 'Comprehensive research university'),
('Tokyo Institute of Technology', 'Japan', 'Tokyo', 4, 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Tokyo_Institute_of_Technology_Logo.svg/320px-Tokyo_Institute_of_Technology_Logo.svg.png', 'https://www.titech.ac.jp', ARRAY['Engineering', 'Science', 'Computer Science'], 6000, 10000, 3.3, 6.5, 85, NULL, 40.0, ARRAY['April', 'September'], 'Technology and science focus'),
('Tohoku University', 'Japan', 'Sendai', 5, 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Tohoku_University_logo.svg/320px-Tohoku_University_logo.svg.png', 'https://www.tohoku.ac.jp', ARRAY['Engineering', 'Medicine', 'Science', 'Humanities'], 6000, 10000, 3.2, 6.5, 85, NULL, 42.0, ARRAY['April', 'September'], 'Northern Japan top university'),
('Nagoya University', 'Japan', 'Nagoya', 6, 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Nagoya_University_logo.svg/320px-Nagoya_University_logo.svg.png', 'https://www.nagoya-u.ac.jp', ARRAY['Engineering', 'Medicine', 'Science', 'Humanities'], 6000, 10000, 3.2, 6.5, 85, NULL, 44.0, ARRAY['April', 'September'], 'Central Japan top university'),
('Hokkaido University', 'Japan', 'Sapporo', 7, 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Hokkaido_University_Logo.svg/320px-Hokkaido_University_Logo.svg.png', 'https://www.hokudai.ac.jp', ARRAY['Agriculture', 'Engineering', 'Medicine', 'Science'], 6000, 10000, 3.1, 6.5, 80, NULL, 46.0, ARRAY['April', 'September'], 'Northern research university'),
('Kyushu University', 'Japan', 'Fukuoka', 8, 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Kyushu_University_logo.svg/320px-Kyushu_University_logo.svg.png', 'https://www.kyushu-u.ac.jp', ARRAY['Engineering', 'Medicine', 'Science', 'Humanities'], 6000, 10000, 3.1, 6.5, 80, NULL, 48.0, ARRAY['April', 'September'], 'Southern Japan top university'),

-- Hong Kong Universities (7)
('University of Hong Kong', 'Hong Kong', 'Hong Kong', 1, 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/University_of_Hong_Kong_logo.svg/320px-University_of_Hong_Kong_logo.svg.png', 'https://www.hku.hk', ARRAY['Medicine', 'Law', 'Business', 'Engineering'], 20000, 35000, 3.3, 6.5, 93, NULL, 42.0, ARRAY['September', 'January'], 'Hong Kong oldest university'),
('Chinese University of Hong Kong', 'Hong Kong', 'Hong Kong', 2, 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Chinese_University_of_Hong_Kong_logo.svg/320px-Chinese_University_of_Hong_Kong_logo.svg.png', 'https://www.cuhk.edu.hk', ARRAY['Business', 'Medicine', 'Engineering', 'Social Sciences'], 19000, 34000, 3.2, 6.5, 90, NULL, 45.0, ARRAY['September', 'January'], 'Comprehensive research university'),
('Hong Kong University of Science', 'Hong Kong', 'Hong Kong', 3, 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/HKUST_Logo.svg/320px-HKUST_Logo.svg.png', 'https://www.hkust.edu.hk', ARRAY['Business', 'Engineering', 'Science', 'Technology'], 21000, 38000, 3.4, 6.5, 90, NULL, 35.0, ARRAY['September', 'January'], 'Science and technology focus'),
('City University of Hong Kong', 'Hong Kong', 'Hong Kong', 4, 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/CityU_logo.svg/320px-CityU_logo.svg.png', 'https://www.cityu.edu.hk', ARRAY['Business', 'Engineering', 'Creative Media', 'Science'], 18000, 32000, 3.1, 6.5, 85, NULL, 50.0, ARRAY['September', 'January'], 'Professional education focus'),
('Hong Kong Polytechnic University', 'Hong Kong', 'Hong Kong', 5, 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/PolyU_logo.svg/320px-PolyU_logo.svg.png', 'https://www.polyu.edu.hk', ARRAY['Engineering', 'Business', 'Design', 'Hospitality'], 17000, 30000, 3.0, 6.0, 80, NULL, 55.0, ARRAY['September', 'January'], 'Applied learning focus'),
('Hong Kong Baptist University', 'Hong Kong', 'Hong Kong', 6, 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/HKBU_logo.svg/320px-HKBU_logo.svg.png', 'https://www.hkbu.edu.hk', ARRAY['Communication', 'Arts', 'Business', 'Chinese Medicine'], 16000, 28000, 2.9, 6.0, 79, NULL, 60.0, ARRAY['September', 'January'], 'Liberal arts focus'),
('Lingnan University', 'Hong Kong', 'Hong Kong', 7, 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Lingnan_University_%28Hong_Kong%29_logo.svg/320px-Lingnan_University_%28Hong_Kong%29_logo.svg.png', 'https://www.ln.edu.hk', ARRAY['Business', 'Social Sciences', 'Humanities', 'Arts'], 15000, 26000, 2.8, 6.0, 79, NULL, 65.0, ARRAY['September', 'January'], 'Liberal arts university'),

-- South Korea Universities (8)
('Seoul National University', 'South Korea', 'Seoul', 1, 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Seoul_National_University_logo.svg/320px-Seoul_National_University_logo.svg.png', 'https://www.snu.ac.kr', ARRAY['Engineering', 'Medicine', 'Business', 'Humanities'], 8000, 15000, 3.4, 6.5, 90, NULL, 25.0, ARRAY['March', 'September'], 'South Korea top university'),
('KAIST', 'South Korea', 'Daejeon', 2, 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/KAIST_logo.svg/320px-KAIST_logo.svg.png', 'https://www.kaist.ac.kr', ARRAY['Engineering', 'Science', 'Technology', 'Business'], 10000, 18000, 3.5, 6.5, 90, NULL, 20.0, ARRAY['March', 'September'], 'Science and technology institute'),
('POSTECH', 'South Korea', 'Pohang', 3, 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/POSTECH_logo.svg/320px-POSTECH_logo.svg.png', 'https://www.postech.ac.kr', ARRAY['Engineering', 'Science', 'Technology'], 10000, 18000, 3.5, 6.5, 90, NULL, 22.0, ARRAY['March', 'September'], 'Science and engineering focus'),
('Yonsei University', 'South Korea', 'Seoul', 4, 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Yonsei_University_Logo.svg/320px-Yonsei_University_Logo.svg.png', 'https://www.yonsei.ac.kr', ARRAY['Medicine', 'Business', 'Law', 'Humanities'], 9000, 16000, 3.3, 6.5, 90, NULL, 30.0, ARRAY['March', 'September'], 'SKY university member'),
('Korea University', 'South Korea', 'Seoul', 5, 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Korea_University_logo.svg/320px-Korea_University_logo.svg.png', 'https://www.korea.ac.kr', ARRAY['Business', 'Law', 'Medicine', 'Engineering'], 9000, 16000, 3.3, 6.5, 90, NULL, 32.0, ARRAY['March', 'September'], 'SKY university member'),
('Sungkyunkwan University', 'South Korea', 'Seoul', 6, 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Sungkyunkwan_University_logo.svg/320px-Sungkyunkwan_University_logo.svg.png', 'https://www.skku.edu', ARRAY['Business', 'Engineering', 'Humanities', 'Science'], 8000, 15000, 3.2, 6.5, 90, NULL, 35.0, ARRAY['March', 'September'], 'Historical university'),
('Hanyang University', 'South Korea', 'Seoul', 7, 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Hanyang_University_logo.svg/320px-Hanyang_University_logo.svg.png', 'https://www.hanyang.ac.kr', ARRAY['Engineering', 'Business', 'Medicine', 'Arts'], 8000, 15000, 3.1, 6.5, 85, NULL, 40.0, ARRAY['March', 'September'], 'Engineering strong'),
('Ewha Womans University', 'South Korea', 'Seoul', 8, 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Ewha_Womans_University_logo.svg/320px-Ewha_Womans_University_logo.svg.png', 'https://www.ewha.ac.kr', ARRAY['Humanities', 'Social Sciences', 'Business', 'Arts'], 7000, 14000, 3.0, 6.5, 85, NULL, 45.0, ARRAY['March', 'September'], 'World largest women university'),

-- France Universities (7)
('Université PSL', 'France', 'Paris', 1, 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/PSL_Research_University_logo.svg/320px-PSL_Research_University_logo.svg.png', 'https://www.psl.eu', ARRAY['Science', 'Engineering', 'Humanities', 'Arts'], 2000, 5000, 3.3, 6.5, 90, NULL, 20.0, ARRAY['September'], 'Paris elite university'),
('Sorbonne University', 'France', 'Paris', 2, 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Logo_Sorbonne_Universit%C3%A9.svg/320px-Logo_Sorbonne_Universit%C3%A9.svg.png', 'https://www.sorbonne-universite.fr', ARRAY['Medicine', 'Humanities', 'Science', 'Engineering'], 2000, 5000, 3.2, 6.5, 90, NULL, 25.0, ARRAY['September'], 'Paris comprehensive university'),
('École Polytechnique', 'France', 'Palaiseau', 3, 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Logo_de_l%27%C3%89cole_polytechnique.svg/320px-Logo_de_l%27%C3%89cole_polytechnique.svg.png', 'https://www.polytechnique.edu', ARRAY['Engineering', 'Science', 'Mathematics', 'Physics'], 2000, 5000, 3.4, 6.5, 90, NULL, 15.0, ARRAY['September'], 'Elite engineering school'),
('CentraleSupélec', 'France', 'Gif-sur-Yvette', 4, 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Logo_CentraleSup%C3%A9lec_%28officiel%29.svg/320px-Logo_CentraleSup%C3%A9lec_%28officiel%29.svg.png', 'https://www.centralesupelec.fr', ARRAY['Engineering', 'Science', 'Technology', 'Business'], 2000, 5000, 3.3, 6.5, 90, NULL, 18.0, ARRAY['September'], 'Engineering grande école'),
('École Normale Supérieure', 'France', 'Paris', 5, 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Logo_ENS.svg/320px-Logo_ENS.svg.png', 'https://www.ens.fr', ARRAY['Humanities', 'Science', 'Social Sciences'], 2000, 5000, 3.4, 6.5, 90, NULL, 12.0, ARRAY['September'], 'Elite research institution'),
('Sciences Po', 'France', 'Paris', 6, 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Sciences_Po_logo.svg/320px-Sciences_Po_logo.svg.png', 'https://www.sciencespo.fr', ARRAY['Political Science', 'Economics', 'Law', 'International Relations'], 15000, 20000, 3.3, 6.5, 90, NULL, 20.0, ARRAY['September'], 'Social sciences university'),
('HEC Paris', 'France', 'Jouy-en-Josas', 7, 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/HEC_Paris.svg/320px-HEC_Paris.svg.png', 'https://www.hec.edu', ARRAY['Business', 'Finance', 'Management', 'Economics'], 25000, 40000, 3.5, 7.0, 100, 320, 15.0, ARRAY['September'], 'Top European business school'),

-- Sweden Universities (6)
('Karolinska Institute', 'Sweden', 'Stockholm', 1, 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Karolinska_Institutet_logo.svg/320px-Karolinska_Institutet_logo.svg.png', 'https://www.ki.se', ARRAY['Medicine', 'Biomedicine', 'Public Health', 'Dentistry'], 0, 20000, 3.4, 6.5, 90, NULL, 20.0, ARRAY['August', 'January'], 'Medical university awarding Nobel Prize'),
('Lund University', 'Sweden', 'Lund', 2, 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Lund_University_logo.svg/320px-Lund_University_logo.svg.png', 'https://www.lu.se', ARRAY['Medicine', 'Engineering', 'Law', 'Humanities'], 0, 20000, 3.2, 6.5, 90, NULL, 35.0, ARRAY['August', 'January'], 'Comprehensive research university'),
('Uppsala University', 'Sweden', 'Uppsala', 3, 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Uppsala_University_logo.svg/320px-Uppsala_University_logo.svg.png', 'https://www.uu.se', ARRAY['Medicine', 'Science', 'Humanities', 'Law'], 0, 20000, 3.2, 6.5, 90, NULL, 40.0, ARRAY['August', 'January'], 'Sweden oldest university'),
('Stockholm University', 'Sweden', 'Stockholm', 4, 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Stockholm_University_logo.svg/320px-Stockholm_University_logo.svg.png', 'https://www.su.se', ARRAY['Science', 'Humanities', 'Social Sciences', 'Law'], 0, 20000, 3.1, 6.5, 90, NULL, 45.0, ARRAY['August', 'January'], 'Stockholm comprehensive university'),
('KTH Royal Institute', 'Sweden', 'Stockholm', 5, 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/KTH_Royal_Institute_of_Technology_logo.svg/320px-KTH_Royal_Institute_of_Technology_logo.svg.png', 'https://www.kth.se', ARRAY['Engineering', 'Technology', 'Architecture', 'Computer Science'], 0, 20000, 3.3, 6.5, 90, NULL, 30.0, ARRAY['August', 'January'], 'Sweden largest technical university'),
('Chalmers University', 'Sweden', 'Gothenburg', 6, 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Chalmers_University_of_Technology_logo.svg/320px-Chalmers_University_of_Technology_logo.svg.png', 'https://www.chalmers.se', ARRAY['Engineering', 'Technology', 'Architecture', 'Computer Science'], 0, 20000, 3.2, 6.5, 90, NULL, 35.0, ARRAY['August', 'January'], 'Technical university in Gothenburg'),

-- Denmark Universities (4)
('University of Copenhagen', 'Denmark', 'Copenhagen', 1, 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/University_of_Copenhagen_logo.svg/320px-University_of_Copenhagen_logo.svg.png', 'https://www.ku.dk', ARRAY['Medicine', 'Science', 'Humanities', 'Social Sciences'], 0, 18000, 3.3, 6.5, 90, NULL, 40.0, ARRAY['September', 'February'], 'Denmark oldest university'),
('Aarhus University', 'Denmark', 'Aarhus', 2, 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Logo_Aarhus_University.svg/320px-Logo_Aarhus_University.svg.png', 'https://www.au.dk', ARRAY['Science', 'Medicine', 'Business', 'Humanities'], 0, 18000, 3.2, 6.5, 90, NULL, 45.0, ARRAY['September', 'February'], 'Jutland main university'),
('Technical University of Denmark', 'Denmark', 'Kongens Lyngby', 3, 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/DTU_Logo_2022.svg/320px-DTU_Logo_2022.svg.png', 'https://www.dtu.dk', ARRAY['Engineering', 'Science', 'Technology', 'Business'], 0, 18000, 3.3, 6.5, 90, NULL, 35.0, ARRAY['September', 'February'], 'Denmark technical university'),
('Copenhagen Business School', 'Denmark', 'Copenhagen', 4, 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/CBS_Logo.svg/320px-CBS_Logo.svg.png', 'https://www.cbs.dk', ARRAY['Business', 'Economics', 'Management', 'Finance'], 0, 18000, 3.2, 6.5, 90, NULL, 25.0, ARRAY['September', 'February'], 'Nordic business school'),

-- Norway Universities (4)
('University of Oslo', 'Norway', 'Oslo', 1, 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/UiO_logo_2016.svg/320px-UiO_logo_2016.svg.png', 'https://www.uio.no', ARRAY['Medicine', 'Law', 'Humanities', 'Social Sciences'], 0, 1000, 3.2, 6.5, 80, NULL, 40.0, ARRAY['August', 'January'], 'Norway oldest university'),
('University of Bergen', 'Norway', 'Bergen', 2, 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/University_of_Bergen_logo.svg/320px-University_of_Bergen_logo.svg.png', 'https://www.uib.no', ARRAY['Medicine', 'Science', 'Humanities', 'Social Sciences'], 0, 1000, 3.1, 6.5, 80, NULL, 45.0, ARRAY['August', 'January'], 'Western Norway university'),
('Norwegian University of Science', 'Norway', 'Trondheim', 3, 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/NTNU_logo.svg/320px-NTNU_logo.svg.png', 'https://www.ntnu.no', ARRAY['Engineering', 'Science', 'Technology', 'Medicine'], 0, 1000, 3.2, 6.5, 80, NULL, 30.0, ARRAY['August', 'January'], 'Norway technical university'),
('University of Tromsø', 'Norway', 'Tromsø', 4, 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/University_of_Troms%C3%B8_logo.svg/320px-University_of_Troms%C3%B8_logo.svg.png', 'https://en.uit.no', ARRAY['Medicine', 'Science', 'Humanities', 'Social Sciences'], 0, 1000, 3.0, 6.5, 80, NULL, 50.0, ARRAY['August', 'January'], 'Arctic university'),

-- Finland Universities (4)
('University of Helsinki', 'Finland', 'Helsinki', 1, 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/University_of_Helsinki_logo_2015.svg/320px-University_of_Helsinki_logo_2015.svg.png', 'https://www.helsinki.fi', ARRAY['Medicine', 'Law', 'Humanities', 'Science'], 0, 15000, 3.2, 6.5, 85, NULL, 35.0, ARRAY['August', 'January'], 'Finland largest university'),
('Aalto University', 'Finland', 'Espoo', 2, 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Aalto_University_logo.svg/320px-Aalto_University_logo.svg.png', 'https://www.aalto.fi', ARRAY['Engineering', 'Business', 'Arts', 'Design'], 0, 15000, 3.3, 6.5, 85, NULL, 30.0, ARRAY['August', 'January'], 'Technology and design university'),
('University of Turku', 'Finland', 'Turku', 3, 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/University_of_Turku_logo.svg/320px-University_of_Turku_logo.svg.png', 'https://www.utu.fi', ARRAY['Medicine', 'Law', 'Humanities', 'Science'], 0, 15000, 3.1, 6.5, 85, NULL, 40.0, ARRAY['August', 'January'], 'Turku main university'),
('University of Oulu', 'Finland', 'Oulu', 4, 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/University_of_Oulu_logo.svg/320px-University_of_Oulu_logo.svg.png', 'https://www.oulu.fi', ARRAY['Technology', 'Medicine', 'Science', 'Business'], 0, 15000, 3.0, 6.5, 85, NULL, 45.0, ARRAY['August', 'January'], 'Northern Finland university'),

-- Belgium Universities (4)
('KU Leuven', 'Belgium', 'Leuven', 1, 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/KU_Leuven_logo.svg/320px-KU_Leuven_logo.svg.png', 'https://www.kuleuven.be', ARRAY['Medicine', 'Engineering', 'Business', 'Humanities'], 1000, 6000, 3.2, 6.5, 90, NULL, 50.0, ARRAY['September'], 'Belgium Dutch-speaking university'),
('Ghent University', 'Belgium', 'Ghent', 2, 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/UGent_logo_2018.svg/320px-UGent_logo_2018.svg.png', 'https://www.ugent.be', ARRAY['Medicine', 'Engineering', 'Science', 'Humanities'], 1000, 6000, 3.1, 6.5, 85, NULL, 55.0, ARRAY['September'], 'Flemish research university'),
('Université catholique de Louvain', 'Belgium', 'Louvain-la-Neuve', 3, 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Logo_UCLouvain.svg/320px-Logo_UCLouvain.svg.png', 'https://www.uclouvain.be', ARRAY['Medicine', 'Engineering', 'Business', 'Humanities'], 1000, 6000, 3.1, 6.5, 85, NULL, 60.0, ARRAY['September'], 'French-speaking Belgian university'),
('Université libre de Bruxelles', 'Belgium', 'Brussels', 4, 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/ULB_Logo_2023.svg/320px-ULB_Logo_2023.svg.png', 'https://www.ulb.be', ARRAY['Medicine', 'Law', 'Business', 'Science'], 1000, 6000, 3.0, 6.5, 85, NULL, 65.0, ARRAY['September'], 'Brussels French-speaking university'),

-- Austria Universities (3)
('University of Vienna', 'Austria', 'Vienna', 1, 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/University_of_Vienna_Logo_2016.svg/320px-University_of_Vienna_Logo_2016.svg.png', 'https://www.univie.ac.at', ARRAY['Humanities', 'Law', 'Medicine', 'Science'], 800, 1500, 3.0, 6.5, 80, NULL, 45.0, ARRAY['October', 'March'], 'Austria largest university'),
('Vienna University of Technology', 'Austria', 'Vienna', 2, 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/TU_Wien_Logo.svg/320px-TU_Wien_Logo.svg.png', 'https://www.tuwien.at', ARRAY['Engineering', 'Architecture', 'Computer Science', 'Natural Sciences'], 800, 1500, 3.1, 6.5, 80, NULL, 40.0, ARRAY['October', 'March'], 'Austria technical university'),
('University of Innsbruck', 'Austria', 'Innsbruck', 3, 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/University_of_Innsbruck_logo.svg/320px-University_of_Innsbruck_logo.svg.png', 'https://www.uibk.ac.at', ARRAY['Science', 'Humanities', 'Law', 'Business'], 800, 1500, 2.9, 6.5, 80, NULL, 55.0, ARRAY['October', 'March'], 'Tyrolean university'),

-- Ireland Universities (3)
('Trinity College Dublin', 'Ireland', 'Dublin', 1, 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Trinity_College_Dublin_Logo.svg/320px-Trinity_College_Dublin_Logo.svg.png', 'https://www.tcd.ie', ARRAY['Humanities', 'Science', 'Engineering', 'Business'], 20000, 30000, 3.2, 6.5, 90, NULL, 40.0, ARRAY['September'], 'Ireland oldest university'),
('University College Dublin', 'Ireland', 'Dublin', 2, 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a6/University_College_Dublin_crest.svg/320px-University_College_Dublin_crest.svg.png', 'https://www.ucd.ie', ARRAY['Business', 'Medicine', 'Engineering', 'Agriculture'], 19000, 29000, 3.1, 6.5, 90, NULL, 45.0, ARRAY['September'], 'Ireland largest university'),
('University of Galway', 'Ireland', 'Galway', 3, 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/University_of_Galway_logo.svg/320px-University_of_Galway_logo.svg.png', 'https://www.universityofgalway.ie', ARRAY['Medicine', 'Engineering', 'Business', 'Arts'], 18000, 28000, 3.0, 6.5, 88, NULL, 50.0, ARRAY['September'], 'Western Ireland university'),

-- New Zealand Universities (3)
('University of Auckland', 'New Zealand', 'Auckland', 1, 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/University_of_Auckland_logo.svg/320px-University_of_Auckland_logo.svg.png', 'https://www.auckland.ac.nz', ARRAY['Business', 'Medicine', 'Engineering', 'Arts'], 25000, 40000, 3.2, 6.5, 90, NULL, 45.0, ARRAY['February', 'July'], 'New Zealand largest university'),
('University of Otago', 'New Zealand', 'Dunedin', 2, 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/University_of_Otago_logo.svg/320px-University_of_Otago_logo.svg.png', 'https://www.otago.ac.nz', ARRAY['Medicine', 'Dentistry', 'Law', 'Business'], 23000, 38000, 3.1, 6.5, 90, NULL, 50.0, ARRAY['February', 'July'], 'New Zealand first university'),
('Victoria University of Wellington', 'New Zealand', 'Wellington', 3, 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Victoria_University_of_Wellington_logo.svg/320px-Victoria_University_of_Wellington_logo.svg.png', 'https://www.wgtn.ac.nz', ARRAY['Law', 'Humanities', 'Science', 'Business'], 22000, 37000, 3.0, 6.5, 90, NULL, 55.0, ARRAY['February', 'July'], 'Capital city university'),

-- Spain Universities (4)
('University of Barcelona', 'Spain', 'Barcelona', 1, 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/University_of_Barcelona_logo.svg/320px-University_of_Barcelona_logo.svg.png', 'https://www.ub.edu', ARRAY['Medicine', 'Humanities', 'Science', 'Business'], 2000, 4000, 3.0, 6.5, 80, NULL, 60.0, ARRAY['September', 'February'], 'Catalonia main university'),
('Autonomous University of Madrid', 'Spain', 'Madrid', 2, 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Logo_UAM.svg/320px-Logo_UAM.svg.png', 'https://www.uam.es', ARRAY['Science', 'Humanities', 'Law', 'Business'], 2000, 4000, 3.0, 6.5, 80, NULL, 55.0, ARRAY['September', 'February'], 'Madrid research university'),
('Complutense University of Madrid', 'Spain', 'Madrid', 3, 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Escudo_de_la_Universidad_Complutense_de_Madrid.svg/320px-Escudo_de_la_Universidad_Complutense_de_Madrid.svg.png', 'https://www.ucm.es', ARRAY['Humanities', 'Medicine', 'Law', 'Science'], 2000, 4000, 3.0, 6.5, 80, NULL, 65.0, ARRAY['September', 'February'], 'Spain largest university'),
('University of Granada', 'Spain', 'Granada', 4, 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Escudo_de_la_Universidad_de_Granada.svg/320px-Escudo_de_la_Universidad_de_Granada.svg.png', 'https://www.ugr.es', ARRAY['Humanities', 'Science', 'Medicine', 'Engineering'], 2000, 4000, 2.9, 6.5, 80, NULL, 70.0, ARRAY['September', 'February'], 'Andalusian university'),

-- Italy Universities (4)
('University of Bologna', 'Italy', 'Bologna', 1, 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/University_of_Bologna_logo.svg/320px-University_of_Bologna_logo.svg.png', 'https://www.unibo.it', ARRAY['Humanities', 'Law', 'Medicine', 'Engineering'], 1000, 3000, 3.0, 6.5, 80, NULL, 60.0, ARRAY['September', 'February'], 'World oldest university'),
('Sapienza University of Rome', 'Italy', 'Rome', 2, 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Logo_Sapienza_University_of_Rome.svg/320px-Logo_Sapienza_University_of_Rome.svg.png', 'https://www.uniroma1.it', ARRAY['Humanities', 'Medicine', 'Engineering', 'Science'], 1000, 3000, 3.0, 6.5, 80, NULL, 65.0, ARRAY['September', 'February'], 'Rome largest university'),
('University of Milan', 'Italy', 'Milan', 3, 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Logo_Universit%C3%A0_degli_Studi_di_Milano.svg/320px-Logo_Universit%C3%A0_degli_Studi_di_Milano.svg.png', 'https://www.unimi.it', ARRAY['Medicine', 'Law', 'Humanities', 'Science'], 1000, 3000, 3.0, 6.5, 80, NULL, 55.0, ARRAY['September', 'February'], 'Milan comprehensive university'),
('Polytechnic University of Milan', 'Italy', 'Milan', 4, 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Politecnico_di_Milano_logo.svg/320px-Politecnico_di_Milano_logo.svg.png', 'https://www.polimi.it', ARRAY['Engineering', 'Architecture', 'Design', 'Computer Science'], 1000, 3000, 3.1, 6.5, 80, NULL, 45.0, ARRAY['September', 'February'], 'Italy largest technical university'),

-- China Mainland Universities (8)
('Tsinghua University', 'China', 'Beijing', 1, 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Tsinghua_University_Logo.svg/320px-Tsinghua_University_Logo.svg.png', 'https://www.tsinghua.edu.cn', ARRAY['Engineering', 'Science', 'Business', 'Humanities'], 4000, 8000, 3.5, 6.5, 90, NULL, 20.0, ARRAY['September'], 'China top engineering university'),
('Peking University', 'China', 'Beijing', 2, 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Logo_of_Peking_University.svg/320px-Logo_of_Peking_University.svg.png', 'https://www.pku.edu.cn', ARRAY['Humanities', 'Science', 'Medicine', 'Business'], 4000, 8000, 3.5, 6.5, 90, NULL, 22.0, ARRAY['September'], 'China comprehensive university'),
('Fudan University', 'China', 'Shanghai', 3, 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Fudan_University_Logo.svg/320px-Fudan_University_Logo.svg.png', 'https://www.fudan.edu.cn', ARRAY['Medicine', 'Humanities', 'Science', 'Business'], 4000, 8000, 3.4, 6.5, 90, NULL, 25.0, ARRAY['September'], 'Shanghai comprehensive university'),
('Shanghai Jiao Tong University', 'China', 'Shanghai', 4, 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Logo_of_Shanghai_Jiao_Tong_University.svg/320px-Logo_of_Shanghai_Jiao_Tong_University.svg.png', 'https://www.sjtu.edu.cn', ARRAY['Engineering', 'Medicine', 'Business', 'Science'], 4000, 8000, 3.4, 6.5, 90, NULL, 23.0, ARRAY['September'], 'Shanghai engineering university'),
('Zhejiang University', 'China', 'Hangzhou', 5, 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Zhejiang_University_logo.svg/320px-Zhejiang_University_logo.svg.png', 'https://www.zju.edu.cn', ARRAY['Engineering', 'Science', 'Medicine', 'Agriculture'], 4000, 8000, 3.3, 6.5, 90, NULL, 28.0, ARRAY['September'], 'Hangzhou comprehensive university'),
('University of Science and Technology of China', 'China', 'Hefei', 6, 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/University_of_Science_and_Technology_of_China_logo.svg/320px-University_of_Science_and_Technology_of_China_logo.svg.png', 'https://www.ustc.edu.cn', ARRAY['Science', 'Engineering', 'Technology', 'Mathematics'], 4000, 8000, 3.4, 6.5, 90, NULL, 18.0, ARRAY['September'], 'Science and technology focus'),
('Nanjing University', 'China', 'Nanjing', 7, 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Nanjing_University_logo.svg/320px-Nanjing_University_logo.svg.png', 'https://www.nju.edu.cn', ARRAY['Humanities', 'Science', 'Engineering', 'Business'], 4000, 8000, 3.3, 6.5, 90, NULL, 30.0, ARRAY['September'], 'Nanjing comprehensive university'),
('Wuhan University', 'China', 'Wuhan', 8, 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Wuhan_University_Logo.svg/320px-Wuhan_University_Logo.svg.png', 'https://www.whu.edu.cn', ARRAY['Medicine', 'Engineering', 'Science', 'Humanities'], 4000, 8000, 3.2, 6.5, 90, NULL, 35.0, ARRAY['September'], 'Central China university'),

-- Taiwan Universities (4)
('National Taiwan University', 'Taiwan', 'Taipei', 1, 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/National_Taiwan_University_logo.svg/320px-National_Taiwan_University_logo.svg.png', 'https://www.ntu.edu.tw', ARRAY['Medicine', 'Engineering', 'Business', 'Humanities'], 3000, 6000, 3.3, 6.5, 85, NULL, 40.0, ARRAY['September'], 'Taiwan top university'),
('National Tsing Hua University', 'Taiwan', 'Hsinchu', 2, 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/National_Tsing_Hua_University_Logo.svg/320px-National_Tsing_Hua_University_Logo.svg.png', 'https://www.nthu.edu.tw', ARRAY['Engineering', 'Science', 'Nuclear Science', 'Humanities'], 3000, 6000, 3.2, 6.5, 85, NULL, 35.0, ARRAY['September'], 'Science and engineering focus'),
('National Chiao Tung University', 'Taiwan', 'Hsinchu', 3, 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/National_Chiao_Tung_University_logo.svg/320px-National_Chiao_Tung_University_logo.svg.png', 'https://www.nctu.edu.tw', ARRAY['Engineering', 'Computer Science', 'Management', 'Science'], 3000, 6000, 3.2, 6.5, 85, NULL, 38.0, ARRAY['September'], 'Engineering and management'),
('National Cheng Kung University', 'Taiwan', 'Tainan', 4, 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/National_Cheng_Kung_University_logo.svg/320px-National_Cheng_Kung_University_logo.svg.png', 'https://www.ncku.edu.tw', ARRAY['Engineering', 'Medicine', 'Science', 'Humanities'], 3000, 6000, 3.1, 6.5, 85, NULL, 42.0, ARRAY['September'], 'Southern Taiwan university'),

-- India Universities (8)
('Indian Institute of Technology Bombay', 'India', 'Mumbai', 1, 'https://upload.wikimedia.org/wikipedia/en/thumb/7/7a/IIT_Bombay_Logo.svg/320px-IIT_Bombay_Logo.svg.png', 'https://www.iitb.ac.in', ARRAY['Engineering', 'Science', 'Technology', 'Design'], 2000, 4000, 3.5, 6.5, 90, NULL, 2.0, ARRAY['July'], 'India premier engineering institute'),
('Indian Institute of Technology Delhi', 'India', 'New Delhi', 2, 'https://upload.wikimedia.org/wikipedia/en/thumb/4/41/IIT_Delhi_Logo.svg/320px-IIT_Delhi_Logo.svg.png', 'https://home.iitd.ac.in', ARRAY['Engineering', 'Science', 'Management', 'Humanities'], 2000, 4000, 3.5, 6.5, 90, NULL, 2.5, ARRAY['July'], 'Delhi engineering institute'),
('Indian Institute of Technology Madras', 'India', 'Chennai', 3, 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d9/IIT_Madras_Logo.svg/320px-IIT_Madras_Logo.svg.png', 'https://www.iitm.ac.in', ARRAY['Engineering', 'Science', 'Technology', 'Management'], 2000, 4000, 3.5, 6.5, 90, NULL, 3.0, ARRAY['July'], 'Chennai engineering institute'),
('Indian Institute of Science', 'India', 'Bangalore', 4, 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Indian_Institute_of_Science_Logo.svg/320px-Indian_Institute_of_Science_Logo.svg.png', 'https://iisc.ac.in', ARRAY['Science', 'Engineering', 'Research', 'Technology'], 2000, 4000, 3.6, 6.5, 90, NULL, 5.0, ARRAY['July'], 'India premier science institute'),
('University of Delhi', 'India', 'Delhi', 5, 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Delhi_University_logo.svg/320px-Delhi_University_logo.svg.png', 'https://www.du.ac.in', ARRAY['Humanities', 'Science', 'Commerce', 'Law'], 1000, 3000, 3.0, 6.5, 85, NULL, 90.0, ARRAY['July'], 'India central university'),
('Jawaharlal Nehru University', 'India', 'New Delhi', 6, 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/JNU_logo.svg/320px-JNU_logo.svg.png', 'https://www.jnu.ac.in', ARRAY['Social Sciences', 'Humanities', 'Languages', 'Science'], 1000, 3000, 3.0, 6.5, 85, NULL, 10.0, ARRAY['July'], 'Social sciences and humanities'),
('Anna University', 'India', 'Chennai', 7, 'https://upload.wikimedia.org/wikipedia/en/thumb/5/5f/Anna_University_logo.svg/320px-Anna_University_logo.svg.png', 'https://www.annauniv.edu', ARRAY['Engineering', 'Technology', 'Architecture', 'Science'], 2000, 4000, 3.2, 6.5, 85, NULL, 20.0, ARRAY['July'], 'Tamil Nadu engineering university'),
('University of Calcutta', 'India', 'Kolkata', 8, 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/University_of_Calcutta_logo.svg/320px-University_of_Calcutta_logo.svg.png', 'https://www.caluniv.ac.in', ARRAY['Humanities', 'Science', 'Commerce', 'Law'], 1000, 3000, 3.0, 6.5, 85, NULL, 85.0, ARRAY['July'], 'India oldest modern university'),

-- UAE Universities (4)
('United Arab Emirates University', 'UAE', 'Al Ain', 1, 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/United_Arab_Emirates_University_logo.png/320px-United_Arab_Emirates_University_logo.png', 'https://www.uaeu.ac.ae', ARRAY['Business', 'Engineering', 'Medicine', 'Science'], 15000, 25000, 3.0, 6.0, 79, NULL, 65.0, ARRAY['August', 'January'], 'UAE first university'),
('Khalifa University', 'UAE', 'Abu Dhabi', 2, 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Khalifa_University_Logo.png/320px-Khalifa_University_Logo.png', 'https://www.ku.ac.ae', ARRAY['Engineering', 'Science', 'Medicine', 'Business'], 18000, 30000, 3.2, 6.5, 80, NULL, 40.0, ARRAY['August', 'January'], 'Science and technology focus'),
('University of Sharjah', 'UAE', 'Sharjah', 3, 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/University_of_Sharjah_Logo.svg/320px-University_of_Sharjah_Logo.svg.png', 'https://www.sharjah.ac.ae', ARRAY['Medicine', 'Engineering', 'Business', 'Arts'], 12000, 22000, 2.9, 6.0, 79, NULL, 70.0, ARRAY['August', 'January'], 'Sharjah comprehensive university'),
('American University of Sharjah', 'UAE', 'Sharjah', 4, 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/American_University_of_Sharjah_logo.svg/320px-American_University_of_Sharjah_logo.svg.png', 'https://www.aus.edu', ARRAY['Engineering', 'Business', 'Architecture', 'Arts'], 25000, 40000, 3.0, 6.5, 80, NULL, 50.0, ARRAY['August', 'January'], 'American-style education'),

-- Malaysia Universities (4)
('University of Malaya', 'Malaysia', 'Kuala Lumpur', 1, 'https://upload.wikimedia.org/wikipedia/en/thumb/6/69/University_of_Malaya_coat_of_arms.svg/320px-University_of_Malaya_coat_of_arms.svg.png', 'https://www.um.edu.my', ARRAY['Medicine', 'Engineering', 'Business', 'Arts'], 8000, 15000, 3.0, 6.0, 80, NULL, 60.0, ARRAY['September', 'February'], 'Malaysia oldest university'),
('Universiti Putra Malaysia', 'Malaysia', 'Serdang', 2, 'https://upload.wikimedia.org/wikipedia/en/thumb/1/11/Universiti_Putra_Malaysia_logo.svg/320px-Universiti_Putra_Malaysia_logo.svg.png', 'https://www.upm.edu.my', ARRAY['Agriculture', 'Engineering', 'Medicine', 'Business'], 7000, 14000, 2.9, 6.0, 79, NULL, 65.0, ARRAY['September', 'February'], 'Agriculture and engineering'),
('Universiti Kebangsaan Malaysia', 'Malaysia', 'Bangi', 3, 'https://upload.wikimedia.org/wikipedia/en/thumb/1/18/Universiti_Kebangsaan_Malaysia_coat_of_arms.svg/320px-Universiti_Kebangsaan_Malaysia_coat_of_arms.svg.png', 'https://www.ukm.my', ARRAY['Medicine', 'Engineering', 'Business', 'Humanities'], 7000, 14000, 2.9, 6.0, 79, NULL, 63.0, ARRAY['September', 'February'], 'National university of Malaysia'),
('Universiti Sains Malaysia', 'Malaysia', 'Penang', 4, 'https://upload.wikimedia.org/wikipedia/en/thumb/4/46/Universiti_Sains_Malaysia_logo.svg/320px-Universiti_Sains_Malaysia_logo.svg.png', 'https://www.usm.my', ARRAY['Medicine', 'Engineering', 'Science', 'Arts'], 7000, 14000, 2.8, 6.0, 79, NULL, 68.0, ARRAY['September', 'February'], 'Science university of Malaysia'),

-- Thailand Universities (3)
('Chulalongkorn University', 'Thailand', 'Bangkok', 1, 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Chulalongkorn_University_Emblem.svg/320px-Chulalongkorn_University_Emblem.svg.png', 'https://www.chula.ac.th', ARRAY['Medicine', 'Engineering', 'Business', 'Arts'], 5000, 10000, 3.0, 6.0, 79, NULL, 40.0, ARRAY['August'], 'Thailand oldest university'),
('Mahidol University', 'Thailand', 'Bangkok', 2, 'https://upload.wikimedia.org/wikipedia/en/thumb/2/2c/Mahidol_University_logo.svg/320px-Mahidol_University_logo.svg.png', 'https://www.mahidol.ac.th', ARRAY['Medicine', 'Science', 'Engineering', 'Health Sciences'], 5000, 10000, 3.0, 6.0, 79, NULL, 45.0, ARRAY['August'], 'Thailand medical university'),
('Thammasat University', 'Thailand', 'Bangkok', 3, 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Thammasat_University_Emblem.svg/320px-Thammasat_University_Emblem.svg.png', 'https://www.tu.ac.th', ARRAY['Law', 'Business', 'Economics', 'Social Sciences'], 4000, 9000, 2.9, 6.0, 79, NULL, 50.0, ARRAY['August'], 'Law and social sciences'),

-- Brazil Universities (3)
('University of São Paulo', 'Brazil', 'São Paulo', 1, 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/USP_Logo.svg/320px-USP_Logo.svg.png', 'https://www5.usp.br', ARRAY['Medicine', 'Engineering', 'Humanities', 'Science'], 0, 0, 3.0, 6.0, 79, NULL, 30.0, ARRAY['March', 'August'], 'Brazil largest university'),
('University of Campinas', 'Brazil', 'Campinas', 2, 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Unicamp_logo.svg/320px-Unicamp_logo.svg.png', 'https://www.unicamp.br', ARRAY['Engineering', 'Medicine', 'Science', 'Technology'], 0, 0, 3.0, 6.0, 79, NULL, 25.0, ARRAY['March', 'August'], 'Research intensive university'),
('Federal University of Rio de Janeiro', 'Brazil', 'Rio de Janeiro', 3, 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/UFRJ_logo.svg/320px-UFRJ_logo.svg.png', 'https://ufrj.br', ARRAY['Engineering', 'Medicine', 'Humanities', 'Science'], 0, 0, 2.9, 6.0, 79, NULL, 35.0, ARRAY['March', 'August'], 'Rio de Janeiro federal university'),

-- Mexico Universities (2)
('National Autonomous University of Mexico', 'Mexico', 'Mexico City', 1, 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Escudo_UNAM.svg/320px-Escudo_UNAM.svg.png', 'https://www.unam.mx', ARRAY['Humanities', 'Science', 'Engineering', 'Medicine'], 0, 1000, 2.9, 6.0, 79, NULL, 10.0, ARRAY['August', 'February'], 'Mexico largest university'),
('Monterrey Institute of Technology', 'Mexico', 'Monterrey', 2, 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/ITESM_Logo.svg/320px-ITESM_Logo.svg.png', 'https://www.tec.mx', ARRAY['Engineering', 'Business', 'Medicine', 'Architecture'], 10000, 20000, 3.0, 6.5, 80, NULL, 30.0, ARRAY['August', 'January'], 'Private technology institute'),

-- South Africa Universities (2)
('University of Cape Town', 'South Africa', 'Cape Town', 1, 'https://upload.wikimedia.org/wikipedia/en/thumb/6/6d/University_of_Cape_Town_logo.svg/320px-University_of_Cape_Town_logo.svg.png', 'https://www.uct.ac.za', ARRAY['Medicine', 'Law', 'Business', 'Science'], 5000, 10000, 3.0, 6.5, 80, NULL, 50.0, ARRAY['February', 'July'], 'Africa top-ranked university'),
('University of the Witwatersrand', 'South Africa', 'Johannesburg', 2, 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/University_of_the_Witwatersrand_logo.svg/320px-University_of_the_Witwatersrand_logo.svg.png', 'https://www.wits.ac.za', ARRAY['Medicine', 'Engineering', 'Law', 'Science'], 4000, 9000, 3.0, 6.5, 80, NULL, 55.0, ARRAY['February', 'July'], 'Johannesburg research university'),

-- Turkey Universities (2)
('Bilkent University', 'Turkey', 'Ankara', 1, 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d5/Bilkent_University_logo.svg/320px-Bilkent_University_logo.svg.png', 'https://www.bilkent.edu.tr', ARRAY['Engineering', 'Business', 'Arts', 'Humanities'], 8000, 15000, 3.0, 6.5, 80, NULL, 40.0, ARRAY['September', 'February'], 'Turkey first private university'),
('Middle East Technical University', 'Turkey', 'Ankara', 2, 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/METU_logo.svg/320px-METU_logo.svg.png', 'https://www.metu.edu.tr', ARRAY['Engineering', 'Science', 'Economics', 'Administration'], 0, 1000, 3.0, 6.5, 79, NULL, 20.0, ARRAY['September', 'February'], 'Turkey technical university'),

-- Egypt Universities (2)
('Cairo University', 'Egypt', 'Cairo', 1, 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Cairo_University_logo.png/320px-Cairo_University_logo.png', 'https://cu.edu.eg', ARRAY['Medicine', 'Engineering', 'Law', 'Arts'], 1000, 5000, 2.8, 6.0, 79, NULL, 70.0, ARRAY['September', 'February'], 'Egypt oldest modern university'),
('Ain Shams University', 'Egypt', 'Cairo', 2, 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Logo_of_Ain_Shams_University.png/320px-Logo_of_Ain_Shams_University.png', 'https://www.asu.edu.eg', ARRAY['Medicine', 'Engineering', 'Science', 'Arts'], 1000, 5000, 2.7, 6.0, 79, NULL, 75.0, ARRAY['September', 'February'], 'Cairo comprehensive university'),

-- Philippines Universities (1)
('University of the Philippines', 'Philippines', 'Quezon City', 1, 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/University_of_the_Philippines_seal.svg/320px-University_of_the_Philippines_seal.svg.png', 'https://www.up.edu.ph', ARRAY['Medicine', 'Law', 'Engineering', 'Arts'], 1000, 5000, 2.9, 6.0, 79, NULL, 20.0, ARRAY['June', 'November'], 'Philippines national university'),

-- Indonesia Universities (1)
('University of Indonesia', 'Indonesia', 'Depok', 1, 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/University_of_Indonesia_logo.svg/320px-University_of_Indonesia_logo.svg.png', 'https://www.ui.ac.id', ARRAY['Medicine', 'Engineering', 'Law', 'Social Sciences'], 2000, 8000, 3.0, 6.0, 79, NULL, 25.0, ARRAY['August', 'February'], 'Indonesia oldest university'),

-- Vietnam Universities (1)
('Vietnam National University', 'Vietnam', 'Hanoi', 1, 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Logo_Đại_học_Quốc_gia_Hà_Nội.svg/320px-Logo_Đại_học_Quốc_gia_Hà_Nội.svg.png', 'https://www.vnu.edu.vn', ARRAY['Science', 'Engineering', 'Business', 'Humanities'], 1000, 4000, 2.9, 6.0, 79, NULL, 30.0, ARRAY['September', 'February'], 'Vietnam national university'),

-- Israel Universities (2)
('Hebrew University of Jerusalem', 'Israel', 'Jerusalem', 1, 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Hebrew_University_of_Jerusalem_logo.svg/320px-Hebrew_University_of_Jerusalem_logo.svg.png', 'https://new.huji.ac.il', ARRAY['Humanities', 'Science', 'Medicine', 'Law'], 10000, 15000, 3.2, 6.5, 85, NULL, 50.0, ARRAY['October', 'March'], 'Israel oldest university'),
('Technion - Israel Institute of Technology', 'Israel', 'Haifa', 2, 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Technion_logo.svg/320px-Technion_logo.svg.png', 'https://www.technion.ac.il', ARRAY['Engineering', 'Science', 'Medicine', 'Architecture'], 12000, 18000, 3.3, 6.5, 85, NULL, 45.0, ARRAY['October', 'March'], 'Israel technology institute'),

-- Russia Universities (2)
('Lomonosov Moscow State University', 'Russia', 'Moscow', 1, 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Moscow_State_University_seal.svg/320px-Moscow_State_University_seal.svg.png', 'https://www.msu.ru', ARRAY['Science', 'Humanities', 'Medicine', 'Economics'], 3000, 8000, 3.0, 6.0, 79, NULL, 15.0, ARRAY['September', 'February'], 'Russia oldest university'),
('Saint Petersburg State University', 'Russia', 'Saint Petersburg', 2, 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Logo_of_St._Petersburg_State_University.svg/320px-Logo_of_St._Petersburg_State_University.svg.png', 'https://english.spbu.ru', ARRAY['Humanities', 'Science', 'Law', 'Economics'], 2000, 7000, 2.9, 6.0, 79, NULL, 20.0, ARRAY['September', 'February'], 'Russia second oldest university');

-- Create indexes for better performance
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_university_shortlist_user_id ON public.university_shortlist(user_id);
CREATE INDEX idx_locked_universities_user_id ON public.locked_universities(user_id);
CREATE INDEX idx_ai_tasks_user_id ON public.ai_tasks(user_id);
CREATE INDEX idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX idx_universities_country ON public.universities(country);