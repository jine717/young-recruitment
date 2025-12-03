import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  useAITemplates,
  useUpdateAITemplate,
  useDeleteAITemplate,
  AITemplate,
} from '@/hooks/useAITemplates';
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
import { Loader2, Pencil, Trash2, ArrowLeft } from 'lucide-react';

interface ManageTemplatesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManageTemplatesDialog({
  open,
  onOpenChange,
}: ManageTemplatesDialogProps) {
  const { data: templates, isLoading } = useAITemplates();
  const updateTemplate = useUpdateAITemplate();
  const deleteTemplate = useDeleteAITemplate();

  const [editingTemplate, setEditingTemplate] = useState<AITemplate | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    prompt_content: '',
  });

  const handleEdit = (template: AITemplate) => {
    setEditingTemplate(template);
    setEditForm({
      name: template.name,
      description: template.description || '',
      prompt_content: template.prompt_content,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingTemplate || !editForm.name.trim()) return;

    await updateTemplate.mutateAsync({
      id: editingTemplate.id,
      name: editForm.name.trim(),
      description: editForm.description.trim() || null,
      prompt_content: editForm.prompt_content,
    });

    setEditingTemplate(null);
  };

  const handleDelete = async (id: string) => {
    await deleteTemplate.mutateAsync(id);
    setDeleteConfirm(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? (
                <button
                  onClick={() => setEditingTemplate(null)}
                  className="flex items-center gap-2 hover:text-primary transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Edit Template
                </button>
              ) : (
                'Manage Templates'
              )}
            </DialogTitle>
            <DialogDescription>
              {editingTemplate
                ? 'Update template details'
                : 'View, edit, or delete your AI evaluation templates'}
            </DialogDescription>
          </DialogHeader>

          {editingTemplate ? (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Template Name *</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-content">Instructions</Label>
                <Textarea
                  id="edit-content"
                  value={editForm.prompt_content}
                  onChange={(e) =>
                    setEditForm({ ...editForm, prompt_content: e.target.value })
                  }
                  rows={6}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setEditingTemplate(null)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  disabled={!editForm.name.trim() || updateTemplate.isPending}
                >
                  {updateTemplate.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Save Changes
                </Button>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : templates?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No templates yet. Save your first template from the job editor.
                </div>
              ) : (
                <div className="space-y-3">
                  {templates?.map((template) => (
                    <div
                      key={template.id}
                      className="border rounded-lg p-4 space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{template.name}</h4>
                          {template.description && (
                            <p className="text-sm text-muted-foreground">
                              {template.description}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(template)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteConfirm(template.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {template.prompt_content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this template? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteTemplate.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
