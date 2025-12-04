import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { StickyNote, Plus, Trash2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import {
  useRecruiterNotes,
  useAddRecruiterNote,
  useDeleteRecruiterNote,
} from '@/hooks/useRecruiterNotes';
import { useToast } from '@/hooks/use-toast';

interface RecruiterNotesProps {
  applicationId: string;
}

export function RecruiterNotes({ applicationId }: RecruiterNotesProps) {
  const [newNote, setNewNote] = useState('');
  const { toast } = useToast();

  const { data: notes, isLoading } = useRecruiterNotes(applicationId);
  const addNote = useAddRecruiterNote();
  const deleteNote = useDeleteRecruiterNote();

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      await addNote.mutateAsync({ applicationId, noteText: newNote.trim() });
      setNewNote('');
      toast({ title: 'Note added successfully' });
    } catch (error) {
      toast({
        title: 'Error adding note',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote.mutateAsync({ noteId, applicationId });
      toast({ title: 'Note deleted' });
    } catch (error) {
      toast({
        title: 'Error deleting note',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <StickyNote className="w-4 h-4" />
          Recruiter Notes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new note */}
        <div className="space-y-2">
          <Textarea
            placeholder="Add a note about this candidate..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={3}
          />
          <Button
            onClick={handleAddNote}
            disabled={!newNote.trim() || addNote.isPending}
            size="sm"
            variant="outline"
          >
            {addNote.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Add Note
          </Button>
        </div>

        {/* Notes list */}
        <div className="space-y-3">
          {isLoading ? (
            <>
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </>
          ) : notes?.length === 0 ? (
            <div className="text-center py-6">
              <StickyNote className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">
                No notes yet. Add your first note above.
              </p>
            </div>
          ) : (
            notes?.map((note) => (
              <div
                key={note.id}
                className="p-3 bg-muted/30 rounded-lg space-y-2"
              >
                <div className="flex items-start justify-between">
                  <p className="text-sm whitespace-pre-wrap flex-1">
                    {note.note_text}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteNote(note.id)}
                    disabled={deleteNote.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(note.created_at), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
