import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DocumentUpload } from '@/components/documents/DocumentUpload';
import { DocumentList } from '@/components/documents/DocumentList';
import { useDocuments, DocumentType } from '@/hooks/useDocuments';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  ScrollText,
  Award,
  Briefcase,
  Files,
  FolderOpen,
} from 'lucide-react';

const documentTypeConfig: Record<DocumentType, { label: string; icon: typeof FileText; color: string }> = {
  transcript: { label: 'Transcripts', icon: FileText, color: 'text-blue-400' },
  sop_draft: { label: 'SOP Drafts', icon: ScrollText, color: 'text-purple-400' },
  recommendation_letter: { label: 'Recommendations', icon: Award, color: 'text-amber-400' },
  resume: { label: 'Resume/CV', icon: Briefcase, color: 'text-green-400' },
  other: { label: 'Other', icon: Files, color: 'text-gray-400' },
};

export const Documents = () => {
  const { documents, documentsByType, loadingDocuments } = useDocuments();

  const totalSize = documents.reduce((acc, doc) => acc + doc.file_size, 0);
  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold mb-1">My Documents</h1>
            <p className="text-muted-foreground">
              Manage your application documents in one place
            </p>
          </div>
          <DocumentUpload />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {(Object.keys(documentTypeConfig) as DocumentType[]).map((type) => {
            const config = documentTypeConfig[type];
            const Icon = config.icon;
            const count = documentsByType[type]?.length || 0;

            return (
              <div key={type} className="glass-card p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-secondary ${config.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-xs text-muted-foreground">{config.label}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Card */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/20">
                <FolderOpen className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold">Storage Summary</h3>
                <p className="text-sm text-muted-foreground">
                  {documents.length} document{documents.length !== 1 ? 's' : ''} • {formatSize(totalSize)} used
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              10 MB limit per file
            </Badge>
          </div>
        </div>

        {/* Document Tabs */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="bg-secondary/50 p-1">
            <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              All Documents
            </TabsTrigger>
            {(Object.keys(documentTypeConfig) as DocumentType[]).map((type) => {
              const config = documentTypeConfig[type];
              const count = documentsByType[type]?.length || 0;
              if (count === 0) return null;
              
              return (
                <TabsTrigger 
                  key={type} 
                  value={type}
                  className="data-[state=active]:bg-primary data-[state=active]:text-white"
                >
                  {config.label} ({count})
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="all">
            <DocumentList />
          </TabsContent>

          {(Object.keys(documentTypeConfig) as DocumentType[]).map((type) => (
            <TabsContent key={type} value={type}>
              {documentsByType[type]?.length > 0 ? (
                <div className="space-y-3">
                  {documentsByType[type].map((doc) => (
                    <DocumentListItem key={doc.id} doc={doc} />
                  ))}
                </div>
              ) : (
                <div className="glass-card p-8 text-center">
                  <p className="text-muted-foreground">No {documentTypeConfig[type].label.toLowerCase()} uploaded yet.</p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

// Inline component for filtered views
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ExternalLink, Trash2, File, FileImage } from 'lucide-react';
import { UserDocument } from '@/hooks/useDocuments';
import { useState } from 'react';
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

const DocumentListItem = ({ doc }: { doc: UserDocument }) => {
  const { deleteDocument, getDocumentUrl } = useDocuments();
  const [showDelete, setShowDelete] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const FileIcon = doc.mime_type.includes('image') ? FileImage : doc.mime_type.includes('pdf') ? FileText : File;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const url = await getDocumentUrl(doc.file_path);
      if (url) window.open(url, '_blank');
    } finally {
      setDownloading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
      <div className="glass-card p-4 flex items-center gap-4 group hover:border-primary/30 transition-colors">
        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
          <FileIcon className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{doc.file_name}</p>
          <p className="text-xs text-muted-foreground">
            {formatFileSize(doc.file_size)} • {format(new Date(doc.uploaded_at), 'MMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" onClick={handleDownload} disabled={downloading}>
            <ExternalLink className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setShowDelete(true)} className="text-destructive">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent className="glass-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{doc.file_name}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDocument.mutateAsync(doc)}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Documents;
