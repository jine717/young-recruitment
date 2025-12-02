import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
  useJobBusinessCases,
  useCreateBusinessCase,
  useUpdateBusinessCase,
  useDeleteBusinessCase,
} from '@/hooks/useBusinessCasesMutation';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import { Plus, Trash2, ArrowLeft, ArrowUp, ArrowDown, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface QuestionForm {
  id?: string;
  question_title: string;
  question_description: string;
  video_url: string;
  has_text_response: boolean;
}

export default function RecruiterBusinessCase() {
  const { id: jobId } = useParams();
  const navigate = useNavigate();
  const { user, hasAccess, isLoading: roleLoading } = useRoleCheck(['recruiter', 'admin']);

  const { data: job } = useQuery({
    queryKey: ['recruiter-job', jobId],
    queryFn: async () => {
      if (!jobId) return null;
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!jobId,
  });

  const { data: questions, isLoading } = useJobBusinessCases(jobId);
  const createQuestion = useCreateBusinessCase();
  const updateQuestion = useUpdateBusinessCase();
  const deleteQuestion = useDeleteBusinessCase();

  const [editingQuestion, setEditingQuestion] = useState<QuestionForm | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);

  const handleSaveQuestion = async () => {
    if (!editingQuestion || !jobId) return;

    const questionNumber = editingQuestion.id
      ? questions?.find((q) => q.id === editingQuestion.id)?.question_number || 1
      : (questions?.length || 0) + 1;

    const data = {
      job_id: jobId,
      question_number: questionNumber,
      question_title: editingQuestion.question_title,
      question_description: editingQuestion.question_description,
      video_url: editingQuestion.video_url || null,
      has_text_response: editingQuestion.has_text_response,
    };

    if (editingQuestion.id) {
      await updateQuestion.mutateAsync({ id: editingQuestion.id, ...data });
    } else {
      await createQuestion.mutateAsync(data);
    }

    setEditingQuestion(null);
    setIsAddingNew(false);
  };

  const handleDeleteQuestion = (id: string) => {
    setQuestionToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (questionToDelete && jobId) {
      await deleteQuestion.mutateAsync({ id: questionToDelete, jobId });
      setDeleteDialogOpen(false);
      setQuestionToDelete(null);
    }
  };

  const handleMoveQuestion = async (index: number, direction: 'up' | 'down') => {
    if (!questions || !jobId) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= questions.length) return;

    const currentQuestion = questions[index];
    const swapQuestion = questions[newIndex];

    await updateQuestion.mutateAsync({
      id: currentQuestion.id,
      job_id: jobId,
      question_number: swapQuestion.question_number,
      question_title: currentQuestion.question_title,
      question_description: currentQuestion.question_description,
      video_url: currentQuestion.video_url || null,
      has_text_response: currentQuestion.has_text_response,
    });

    await updateQuestion.mutateAsync({
      id: swapQuestion.id,
      job_id: jobId,
      question_number: currentQuestion.question_number,
      question_title: swapQuestion.question_title,
      question_description: swapQuestion.question_description,
      video_url: swapQuestion.video_url || null,
      has_text_response: swapQuestion.has_text_response,
    });
  };

  const startAddNew = () => {
    setIsAddingNew(true);
    setEditingQuestion({
      question_title: '',
      question_description: '',
      video_url: '',
      has_text_response: false,
    });
  };

  const startEdit = (question: any) => {
    setIsAddingNew(false);
    setEditingQuestion({
      id: question.id,
      question_title: question.question_title,
      question_description: question.question_description,
      video_url: question.video_url || '',
      has_text_response: question.has_text_response,
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">Please sign in to access this page</p>
            <Button asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (roleLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">You don't have permission to access this page.</p>
            <Button asChild>
              <Link to="/">Go Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="font-display text-3xl tracking-tight">YOUNG RECRUITMENT</Link>
          <div className="flex items-center gap-6">
            <Link to="/jobs" className="text-muted-foreground hover:text-foreground transition-colors">
              Open Positions
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="pt-32 pb-8 px-6">
        <div className="container mx-auto max-w-4xl">
          <Link to="/dashboard/jobs" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Jobs
          </Link>
          
          <h1 className="font-display text-4xl md:text-5xl mb-2">BUSINESS CASE</h1>
          <p className="text-xl text-muted-foreground">
            {job?.title || 'Loading...'} - Configure questions for candidates
          </p>
        </div>
      </section>

      {/* Questions */}
      <section className="pb-20 px-6">
        <div className="container mx-auto max-w-4xl space-y-4">
          {questions?.map((question, index) => (
            <Card key={question.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Question {question.question_number}: {question.question_title}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleMoveQuestion(index, 'up')}
                      disabled={index === 0}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleMoveQuestion(index, 'down')}
                      disabled={index === questions.length - 1}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteQuestion(question.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {editingQuestion?.id === question.id ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Question Title</Label>
                      <Input
                        value={editingQuestion.question_title}
                        onChange={(e) =>
                          setEditingQuestion({
                            ...editingQuestion,
                            question_title: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={editingQuestion.question_description}
                        onChange={(e) =>
                          setEditingQuestion({
                            ...editingQuestion,
                            question_description: e.target.value,
                          })
                        }
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Video URL (optional)</Label>
                      <Input
                        value={editingQuestion.video_url}
                        onChange={(e) =>
                          setEditingQuestion({
                            ...editingQuestion,
                            video_url: e.target.value,
                          })
                        }
                        placeholder="https://..."
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={editingQuestion.has_text_response}
                        onCheckedChange={(checked) =>
                          setEditingQuestion({
                            ...editingQuestion,
                            has_text_response: checked,
                          })
                        }
                      />
                      <Label>Allow text response</Label>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveQuestion} disabled={updateQuestion.isPending}>
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                      <Button variant="outline" onClick={() => setEditingQuestion(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-muted-foreground">{question.question_description}</p>
                    {question.video_url && (
                      <p className="text-sm text-muted-foreground">
                        Video: {question.video_url}
                      </p>
                    )}
                    <p className="text-sm">
                      {question.has_text_response ? '✓ Text response enabled' : 'Video response only'}
                    </p>
                    <Button variant="outline" size="sm" onClick={() => startEdit(question)}>
                      Edit
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {isAddingNew && editingQuestion && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">New Question</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Question Title *</Label>
                  <Input
                    value={editingQuestion.question_title}
                    onChange={(e) =>
                      setEditingQuestion({
                        ...editingQuestion,
                        question_title: e.target.value,
                      })
                    }
                    placeholder="e.g. Problem Solving Approach"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description *</Label>
                  <Textarea
                    value={editingQuestion.question_description}
                    onChange={(e) =>
                      setEditingQuestion({
                        ...editingQuestion,
                        question_description: e.target.value,
                      })
                    }
                    placeholder="Describe what you want the candidate to answer..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Video URL (optional)</Label>
                  <Input
                    value={editingQuestion.video_url}
                    onChange={(e) =>
                      setEditingQuestion({
                        ...editingQuestion,
                        video_url: e.target.value,
                      })
                    }
                    placeholder="https://... (team member explanation video)"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingQuestion.has_text_response}
                    onCheckedChange={(checked) =>
                      setEditingQuestion({
                        ...editingQuestion,
                        has_text_response: checked,
                      })
                    }
                  />
                  <Label>Allow text response (in addition to video)</Label>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveQuestion}
                    disabled={
                      createQuestion.isPending ||
                      !editingQuestion.question_title ||
                      !editingQuestion.question_description
                    }
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Add Question
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAddingNew(false);
                      setEditingQuestion(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {!isAddingNew && (
            <Button variant="outline" onClick={startAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Button>
          )}
        </div>
      </section>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this question? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
