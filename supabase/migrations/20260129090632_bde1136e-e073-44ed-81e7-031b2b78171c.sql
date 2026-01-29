
-- Create storage bucket for user documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-documents', 
  'user-documents', 
  false,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png']
);

-- Create documents tracking table
CREATE TABLE public.user_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('transcript', 'sop_draft', 'recommendation_letter', 'resume', 'other')),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  university_id INTEGER REFERENCES public.universities(id),
  notes TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on documents table
ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;

-- Users can view their own documents
CREATE POLICY "Users can view own documents"
ON public.user_documents
FOR SELECT
USING (auth.uid() = user_id);

-- Users can upload their own documents
CREATE POLICY "Users can insert own documents"
ON public.user_documents
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own documents
CREATE POLICY "Users can update own documents"
ON public.user_documents
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own documents
CREATE POLICY "Users can delete own documents"
ON public.user_documents
FOR DELETE
USING (auth.uid() = user_id);

-- Storage policies for user-documents bucket
-- Users can upload to their own folder
CREATE POLICY "Users can upload own documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'user-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can view their own documents
CREATE POLICY "Users can view own storage documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'user-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own documents
CREATE POLICY "Users can update own storage documents"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'user-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own documents
CREATE POLICY "Users can delete own storage documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'user-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add trigger for updated_at
CREATE TRIGGER update_user_documents_updated_at
BEFORE UPDATE ON public.user_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
