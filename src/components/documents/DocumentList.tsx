import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  FileText,
  Download,
  Trash2,
  ExternalLink,
  File,
  FileImage,
} from 'lucide-react';
import { useDocuments, UserDocument, DocumentType } from '@/hooks/useDocuments';
import { format } from 'date-fns';

const documentTypeLabels: Record<DocumentType, string> = {
  transcript: 'Transcript',
  sop_draft: 'SOP Draft',
  recommendation_letter: 'Recommendation',
  resume: 'Resume',
  other: 'Other',
};

const documentTypeColors: Record<DocumentType, string> = {
  transcript: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  sop_draft: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  recommendation_letter: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  resume: 'bg-green-500/20 text-green-400 border-green-500/30',
  other: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const getFileIcon = (mimeType: string) => {
  if (mimeType.includes('image')) return FileImage;
  if (mimeType.includes('pdf')) return FileText;
  return File;
};

export const DocumentList = () => {
  const { documents, loadingDocuments, deleteDocument, getDocumentUrl } = useDocuments();
  const [deleteTarget, setDeleteTarget] = useState<UserDocument | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownload = async (doc: UserDocument) => {
    setDownloadingId(doc.id);
    try {
      const url = await getDocumentUrl(doc.file_path);
      if (url) {
        window.open(url, '_blank');
      }
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async () => {
    if (deleteTarget) {
      await deleteDocument.mutateAsync(deleteTarget);
      setDeleteTarget(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loadingDocuments) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-card p-4 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-muted rounded-lg" />
              <div className="flex-1">
                <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                <div className="h-3 bg-muted rounded w-1/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="font-display text-lg font-semibold mb-2">No documents yet</h3>
        <p className="text-muted-foreground text-sm">
          Upload your transcripts, SOP drafts, and recommendation letters to keep track of your application documents.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {documents.map((doc) => {
          const FileIcon = getFileIcon(doc.mime_type);
          
          return (
            <div
              key={doc.id}
              className="glass-card p-4 flex items-center gap-4 group hover:border-primary/30 transition-colors"
            >
              {/* Icon */}
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                <FileIcon className="w-5 h-5 text-primary" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium truncate">{doc.file_name}</span>
                  <Badge className={documentTypeColors[doc.document_type]}>
                    {documentTypeLabels[doc.document_type]}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{formatFileSize(doc.file_size)}</span>
                  <span>•</span>
                  <span>{format(new Date(doc.uploaded_at), 'MMM d, yyyy')}</span>
                  {doc.notes && (
                    <>
                      <span>•</span>
                      <span className="truncate max-w-[150px]">{doc.notes}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDownload(doc)}
                  disabled={downloadingId === doc.id}
                >
                  {downloadingId === doc.id ? (
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ExternalLink className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteTarget(doc)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="glass-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.file_name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
