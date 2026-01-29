import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Upload, FileText, X } from 'lucide-react';
import { useDocuments, DocumentType } from '@/hooks/useDocuments';
import { useUniversities } from '@/hooks/useUniversities';

const documentTypeLabels: Record<DocumentType, string> = {
  transcript: 'Academic Transcript',
  sop_draft: 'Statement of Purpose Draft',
  recommendation_letter: 'Recommendation Letter',
  resume: 'Resume / CV',
  other: 'Other Document',
};

export const DocumentUpload = () => {
  const { uploadDocument } = useDocuments();
  const { lockedUniversities } = useUniversities();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>('transcript');
  const [universityId, setUniversityId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    await uploadDocument.mutateAsync({
      file: selectedFile,
      documentType,
      universityId: universityId ? parseInt(universityId) : undefined,
      notes: notes || undefined,
    });

    // Reset form
    setSelectedFile(null);
    setDocumentType('transcript');
    setUniversityId('');
    setNotes('');
    setOpen(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gradient-bg text-white">
          <Upload className="w-4 h-4 mr-2" />
          Upload Document
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-card border-border sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Upload Document</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              transition-colors
              ${dragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}
              ${selectedFile ? 'bg-success/10 border-success' : ''}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={handleFileSelect}
              className="hidden"
            />

            {selectedFile ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="w-8 h-8 text-success" />
                <div className="text-left">
                  <p className="font-medium truncate max-w-[200px]">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <>
                <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                <p className="font-medium mb-1">Drop your file here or click to browse</p>
                <p className="text-sm text-muted-foreground">
                  PDF, DOC, DOCX, JPG, PNG (max 10MB)
                </p>
              </>
            )}
          </div>

          {/* Document Type */}
          <div className="space-y-2">
            <Label>Document Type</Label>
            <Select value={documentType} onValueChange={(v) => setDocumentType(v as DocumentType)}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(documentTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* University (optional) */}
          {lockedUniversities.length > 0 && (
            <div className="space-y-2">
              <Label>Related University (Optional)</Label>
              <Select value={universityId} onValueChange={setUniversityId}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select a university" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {lockedUniversities.map((locked) => (
                    <SelectItem key={locked.university_id} value={locked.university_id.toString()}>
                      {(locked as any).universities?.name || `University ${locked.university_id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this document..."
              className="bg-secondary border-border resize-none"
              rows={2}
            />
          </div>

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploadDocument.isPending}
            className="w-full gradient-bg text-white"
          >
            {uploadDocument.isPending ? 'Uploading...' : 'Upload Document'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
