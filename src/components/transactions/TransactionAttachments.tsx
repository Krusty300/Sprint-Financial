'use client';

import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Paperclip, 
  X, 
  Download, 
  Eye, 
  Trash2,
  Image as ImageIcon,
  FileText,
  Plus,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TransactionAttachment } from '@/lib/types';

interface TransactionAttachmentsProps {
  attachments?: TransactionAttachment[];
  onAdd: (attachment: Omit<TransactionAttachment, 'id' | 'createdAt'>) => void;
  onRemove: (attachmentId: string) => void;
  readOnly?: boolean;
}

export function TransactionAttachments({ 
  attachments = [], 
  onAdd, 
  onRemove, 
  readOnly = false 
}: TransactionAttachmentsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      const isImageFile = file.type.startsWith('image/');
      reader.onload = (event) => {
        const attachment: Omit<TransactionAttachment, 'id' | 'createdAt'> = {
          name: file.name,
          type: isImageFile ? 'image' : 'document',
          data: event.target?.result as string,
          size: file.size,
        };
        onAdd(attachment);
      };
      
      if (isImageFile) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onAdd]);

  const handleAddNote = useCallback(() => {
    const attachment: Omit<TransactionAttachment, 'id' | 'createdAt'> = {
      name: 'Note',
      type: 'note',
      content: '',
    };
    onAdd(attachment);
  }, [onAdd]);

  const hasAttachments = attachments && attachments.length > 0;

  const getAttachmentIcon = (type: TransactionAttachment['type']) => {
    switch (type) {
      case 'image':
        return ImageIcon;
      case 'document':
        return FileText;
      case 'note':
        return Paperclip;
      default:
        return FileText;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="relative">
      {/* Attachments Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "h-6 px-2 text-xs gap-1 transition-all",
          hasAttachments && "text-primary bg-primary/10 hover:bg-primary/20"
        )}
      >
        <Paperclip className="h-3 w-3" />
        {hasAttachments ? `${attachments.length}` : 'Attach'}
        {isExpanded ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
      </Button>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx,.txt"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Expanded Attachments Panel */}
      {isExpanded && (
        <div className="absolute top-full left-0 mt-1 w-96 z-50">
          <div className="bg-background border rounded-lg shadow-lg p-3 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Attachments</span>
              </div>
              {!readOnly && (
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-6 w-6 p-0"
                    title="Upload file"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleAddNote}
                    className="h-6 w-6 p-0"
                    title="Add note"
                  >
                    <FileText className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

            {/* Attachments List */}
            {hasAttachments ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {attachments.map((attachment) => {
                  const Icon = getAttachmentIcon(attachment.type);
                  return (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{attachment.name}</p>
                          {attachment.size && (
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(attachment.size)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {attachment.type === 'image' && attachment.data && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              // Open image in new tab
                              const win = window.open();
                              win?.document.write(
                                `<img src="${attachment.data}" style="max-width:100%;margin:auto;display:block;" />`
                              );
                            }}
                            className="h-6 w-6 p-0"
                            title="View"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        )}
                        {attachment.data && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              // Download attachment
                              const link = document.createElement('a');
                              link.href = attachment.data || '';
                              link.download = attachment.name;
                              link.click();
                            }}
                            className="h-6 w-6 p-0"
                            title="Download"
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        )}
                        {!readOnly && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onRemove(attachment.id)}
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            title="Remove"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 text-sm text-muted-foreground">
                <Paperclip className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No attachments yet</p>
                {!readOnly && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Attachment
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
