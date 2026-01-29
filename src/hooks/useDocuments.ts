import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

export type DocumentType = 'transcript' | 'sop_draft' | 'recommendation_letter' | 'resume' | 'other';

export interface UserDocument {
  id: string;
  user_id: string;
  document_type: DocumentType;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  university_id: number | null;
  notes: string | null;
  uploaded_at: string;
  updated_at: string;
}

export const useDocuments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's documents
  const { data: documents = [], isLoading: loadingDocuments } = useQuery({
    queryKey: ['documents', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('user_documents')
        .select('*')
        .eq('user_id', user.id)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return data as UserDocument[];
    },
    enabled: !!user?.id,
  });

  // Upload document
  const uploadDocument = useMutation({
    mutationFn: async ({
      file,
      documentType,
      universityId,
      notes,
    }: {
      file: File;
      documentType: DocumentType;
      universityId?: number;
      notes?: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size must be less than 10MB');
      }

      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
      ];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Allowed: PDF, DOC, DOCX, JPG, PNG');
      }

      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${documentType}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('user-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Save document record
      const { data, error } = await supabase
        .from('user_documents')
        .insert({
          user_id: user.id,
          document_type: documentType,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          university_id: universityId || null,
          notes: notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', user?.id] });
      toast({
        title: 'Document uploaded',
        description: 'Your document has been uploaded successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete document
  const deleteDocument = useMutation({
    mutationFn: async (document: UserDocument) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('user-documents')
        .remove([document.file_path]);

      if (storageError) throw storageError;

      // Delete record
      const { error } = await supabase
        .from('user_documents')
        .delete()
        .eq('id', document.id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', user?.id] });
      toast({
        title: 'Document deleted',
        description: 'Your document has been removed.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Delete failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Get document download URL
  const getDocumentUrl = async (filePath: string) => {
    const { data } = await supabase.storage
      .from('user-documents')
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    return data?.signedUrl;
  };

  // Group documents by type
  const documentsByType = documents.reduce((acc, doc) => {
    if (!acc[doc.document_type]) {
      acc[doc.document_type] = [];
    }
    acc[doc.document_type].push(doc);
    return acc;
  }, {} as Record<DocumentType, UserDocument[]>);

  return {
    documents,
    documentsByType,
    loadingDocuments,
    uploadDocument,
    deleteDocument,
    getDocumentUrl,
  };
};
