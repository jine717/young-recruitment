import { useState } from 'react';
import { format } from 'date-fns';
import { MessageSquare, Mail, Plus, Trash2, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useRecruiterNotes, useAddRecruiterNote, useDeleteRecruiterNote } from '@/hooks/useRecruiterNotes';
import { useNotificationLogs } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';

interface ActivityTimelineProps {
  applicationId: string;
}

type ActivityItem = {
  id: string;
  type: 'note' | 'notification';
  content: string;
  date: string;
  meta?: string;
};

export function ActivityTimeline({ applicationId }: ActivityTimelineProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  const { data: notes = [], isLoading: notesLoading } = useRecruiterNotes(applicationId);
  const { data: notifications = [], isLoading: notificationsLoading } = useNotificationLogs(applicationId);
  const addNote = useAddRecruiterNote();
  const deleteNote = useDeleteRecruiterNote();

  const isLoading = notesLoading || notificationsLoading;

  // Combine and sort by date
  const activities: ActivityItem[] = [
    ...notes.map(note => ({
      id: note.id,
      type: 'note' as const,
      content: note.note_text,
      date: note.created_at,
    })),
    ...notifications.map(notif => ({
      id: notif.id,
      type: 'notification' as const,
      content: notif.subject,
      date: notif.sent_at,
      meta: notif.status,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    await addNote.mutateAsync({ applicationId, noteText: newNote });
    setNewNote('');
    setIsAddingNote(false);
  };

  const handleDeleteNote = async (noteId: string) => {
    await deleteNote.mutateAsync({ noteId, applicationId });
  };

  return (
    <Card className="shadow-young-sm hover-lift transition-all duration-200">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer hover:bg-muted/30 -mx-2 px-2 py-1 rounded-md transition-colors">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Activity
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {activities.length}
                </span>
                <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
              </div>
            </div>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-3">
            {/* Add Note Section */}
            {isAddingNote ? (
              <div className="space-y-2">
                <Textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note..."
                  className="min-h-[60px] text-sm"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddNote} disabled={addNote.isPending}>
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setIsAddingNote(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setIsAddingNote(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Note
              </Button>
            )}

            {/* Timeline */}
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-12 bg-muted/30 rounded animate-pulse" />
                ))}
              </div>
            ) : activities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No activity yet
              </p>
            ) : (
              <div className="space-y-1 max-h-[300px] overflow-y-auto">
                {activities.map((item) => (
                  <div
                    key={item.id}
                    className="group flex items-start gap-2 p-2 rounded-md hover:bg-muted/30 transition-colors"
                  >
                    <div className={cn(
                      "mt-0.5 p-1 rounded",
                      item.type === 'note' ? 'bg-young-blue/10 text-young-blue' : 'bg-young-gold/10 text-young-gold'
                    )}>
                      {item.type === 'note' ? (
                        <MessageSquare className="w-3 h-3" />
                      ) : (
                        <Mail className="w-3 h-3" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{item.content}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(item.date), 'MMM d, HH:mm')}
                        {item.meta && ` • ${item.meta}`}
                      </p>
                    </div>
                    {item.type === 'note' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteNote(item.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
