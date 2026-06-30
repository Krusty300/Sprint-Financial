'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { 
  MessageSquare, 
  X, 
  Save, 
  Edit, 
  Plus,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TransactionNotesProps {
  notes?: string;
  onSave: (notes: string) => void;
  readOnly?: boolean;
}

export function TransactionNotes({ notes = '', onSave, readOnly = false }: TransactionNotesProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [localNotes, setLocalNotes] = useState(notes);

  const handleSave = useCallback(() => {
    onSave(localNotes);
    setIsEditing(false);
  }, [localNotes, onSave]);

  const handleCancel = useCallback(() => {
    setLocalNotes(notes);
    setIsEditing(false);
  }, [notes]);

  const hasNotes = localNotes && localNotes.trim().length > 0;
  const notePreview = localNotes ? localNotes.slice(0, 50) + (localNotes.length > 50 ? '...' : '') : '';

  return (
    <div className="relative">
      {/* Notes Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "h-6 px-2 text-xs gap-1 transition-all",
          hasNotes && "text-primary bg-primary/10 hover:bg-primary/20"
        )}
      >
        <MessageSquare className="h-3 w-3" />
        {hasNotes ? 'Notes' : 'Add Note'}
        {isExpanded ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
      </Button>

      {/* Expanded Notes Panel */}
      {isExpanded && (
        <div className="absolute top-full left-0 mt-1 w-80 z-50">
          <div className="bg-background border rounded-lg shadow-lg p-3 space-y-2">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Transaction Notes</span>
              </div>
              {!readOnly && (
                <div className="flex gap-1">
                  {isEditing ? (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCancel}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleSave}
                        className="h-6 w-6 p-0 text-primary"
                      >
                        <Save className="h-3 w-3" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsEditing(true)}
                      className="h-6 w-6 p-0"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Notes Content */}
            {isEditing ? (
              <textarea
                value={localNotes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setLocalNotes(e.target.value)}
                placeholder="Add notes about this transaction..."
                className="min-h-[80px] w-full text-sm p-2 rounded-md border border-input bg-background"
                autoFocus
              />
            ) : (
              <div className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                {hasNotes ? localNotes : (
                  <span className="italic">No notes added yet</span>
                )}
              </div>
            )}

            {/* Note Preview Badge */}
            {!isEditing && hasNotes && (
              <div className="text-xs text-muted-foreground">
                {localNotes.length} characters
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
