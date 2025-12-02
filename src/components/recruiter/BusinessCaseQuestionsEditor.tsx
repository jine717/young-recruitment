import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, ChevronDown, ChevronUp, Pencil, Trash2, GripVertical, FileText, Video } from 'lucide-react';

export interface BusinessCaseQuestion {
  id?: string;
  question_number: number;
  question_title: string;
  question_description: string;
  has_text_response: boolean;
  video_url: string | null;
}

interface BusinessCaseQuestionsEditorProps {
  questions: BusinessCaseQuestion[];
  onChange: (questions: BusinessCaseQuestion[]) => void;
  disabled?: boolean;
}

const emptyQuestion: Omit<BusinessCaseQuestion, 'question_number'> = {
  question_title: '',
  question_description: '',
  has_text_response: true,
  video_url: null,
};

export default function BusinessCaseQuestionsEditor({
  questions,
  onChange,
  disabled = false,
}: BusinessCaseQuestionsEditorProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [editingQuestion, setEditingQuestion] = useState<BusinessCaseQuestion | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleAddQuestion = () => {
    setEditingQuestion({
      ...emptyQuestion,
      question_number: questions.length + 1,
    });
    setIsCreating(true);
    setIsDialogOpen(true);
  };

  const handleEditQuestion = (question: BusinessCaseQuestion) => {
    setEditingQuestion({ ...question });
    setIsCreating(false);
    setIsDialogOpen(true);
  };

  const handleSaveQuestion = () => {
    if (!editingQuestion) return;

    if (isCreating) {
      onChange([...questions, editingQuestion]);
    } else {
      onChange(
        questions.map((q) =>
          q.question_number === editingQuestion.question_number ? editingQuestion : q
        )
      );
    }
    setIsDialogOpen(false);
    setEditingQuestion(null);
  };

  const handleDeleteQuestion = (questionNumber: number) => {
    const filtered = questions.filter((q) => q.question_number !== questionNumber);
    // Renumber questions
    const renumbered = filtered.map((q, index) => ({
      ...q,
      question_number: index + 1,
    }));
    onChange(renumbered);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newQuestions = [...questions];
    [newQuestions[index - 1], newQuestions[index]] = [newQuestions[index], newQuestions[index - 1]];
    // Renumber
    const renumbered = newQuestions.map((q, i) => ({ ...q, question_number: i + 1 }));
    onChange(renumbered);
  };

  const handleMoveDown = (index: number) => {
    if (index === questions.length - 1) return;
    const newQuestions = [...questions];
    [newQuestions[index], newQuestions[index + 1]] = [newQuestions[index + 1], newQuestions[index]];
    // Renumber
    const renumbered = newQuestions.map((q, i) => ({ ...q, question_number: i + 1 }));
    onChange(renumbered);
  };

  return (
    <>
      <Card>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Business Case Questions
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {questions.length === 0
                      ? 'No questions configured yet'
                      : `${questions.length} question${questions.length !== 1 ? 's' : ''} configured`}
                  </CardDescription>
                </div>
                {isOpen ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              {questions.length > 0 ? (
                <div className="space-y-3">
                  {questions.map((question, index) => (
                    <div
                      key={question.id || `new-${index}`}
                      className="flex items-start gap-3 p-4 border rounded-lg bg-muted/30"
                    >
                      <div className="flex flex-col gap-1 pt-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleMoveUp(index)}
                          disabled={disabled || index === 0}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleMoveDown(index)}
                          disabled={disabled || index === questions.length - 1}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-muted-foreground">
                            Q{question.question_number}
                          </span>
                          <h4 className="font-medium truncate">{question.question_title}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {question.question_description}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          {question.has_text_response && (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <FileText className="h-3 w-3" />
                              Text response
                            </span>
                          )}
                          {question.video_url && (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <Video className="h-3 w-3" />
                              Video explanation
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditQuestion(question)}
                          disabled={disabled}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteQuestion(question.question_number)}
                          disabled={disabled}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No business case questions yet</p>
                  <p className="text-sm">Add questions that candidates will answer during the application process</p>
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddQuestion}
                disabled={disabled}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {isCreating ? 'Add Question' : 'Edit Question'}
            </DialogTitle>
          </DialogHeader>
          {editingQuestion && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="question_title">Question Title *</Label>
                <Input
                  id="question_title"
                  value={editingQuestion.question_title}
                  onChange={(e) =>
                    setEditingQuestion({ ...editingQuestion, question_title: e.target.value })
                  }
                  placeholder="e.g. Problem Solving Scenario"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="question_description">Description *</Label>
                <Textarea
                  id="question_description"
                  value={editingQuestion.question_description}
                  onChange={(e) =>
                    setEditingQuestion({ ...editingQuestion, question_description: e.target.value })
                  }
                  placeholder="Describe the question or scenario the candidate needs to respond to..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="video_url">Video Explanation URL (optional)</Label>
                <Input
                  id="video_url"
                  value={editingQuestion.video_url || ''}
                  onChange={(e) =>
                    setEditingQuestion({
                      ...editingQuestion,
                      video_url: e.target.value || null,
                    })
                  }
                  placeholder="https://youtube.com/watch?v=..."
                />
                <p className="text-xs text-muted-foreground">
                  Add a video URL where a team member explains the question
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Text Response Required</Label>
                  <p className="text-xs text-muted-foreground">
                    Candidates must provide a written answer
                  </p>
                </div>
                <Switch
                  checked={editingQuestion.has_text_response}
                  onCheckedChange={(checked) =>
                    setEditingQuestion({ ...editingQuestion, has_text_response: checked })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveQuestion}
              disabled={
                !editingQuestion?.question_title.trim() ||
                !editingQuestion?.question_description.trim()
              }
            >
              {isCreating ? 'Add Question' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
