import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, ChevronDown, ChevronUp, Pencil, Trash2, ClipboardList } from 'lucide-react';

export interface FixedInterviewQuestion {
  id?: string;
  question_order: number;
  question_text: string;
  category: string;
  priority: number;
}

interface FixedInterviewQuestionsEditorProps {
  questions: FixedInterviewQuestion[];
  onChange: (questions: FixedInterviewQuestion[]) => void;
  disabled?: boolean;
}

const categoryLabels: Record<string, string> = {
  skills_verification: 'Skills',
  concern_probing: 'Concerns',
  cultural_fit: 'Culture',
  experience: 'Experience',
  motivation: 'Motivation',
  general: 'General',
};

const categoryColors: Record<string, string> = {
  skills_verification: 'bg-[hsl(var(--young-blue))]/20 text-[hsl(var(--young-blue))]',
  concern_probing: 'bg-[hsl(var(--young-gold))]/20 text-[hsl(var(--young-gold))]',
  cultural_fit: 'bg-[hsl(var(--young-khaki))]/20 text-[hsl(var(--young-khaki))]',
  experience: 'bg-[hsl(var(--young-blue))]/10 text-[hsl(var(--young-blue))]',
  motivation: 'bg-[hsl(var(--young-gold))]/10 text-[hsl(var(--young-gold))]',
  general: 'bg-muted text-muted-foreground',
};

const priorityLabels: Record<number, string> = {
  1: 'Must Ask',
  2: 'Recommended',
  3: 'If Time',
};

const priorityColors: Record<number, string> = {
  1: 'bg-destructive/10 text-destructive',
  2: 'bg-primary/10 text-primary',
  3: 'bg-muted text-muted-foreground',
};

const categories = [
  { value: 'general', label: 'General' },
  { value: 'skills_verification', label: 'Skills Verification' },
  { value: 'cultural_fit', label: 'Cultural Fit' },
  { value: 'experience', label: 'Experience' },
  { value: 'motivation', label: 'Motivation' },
  { value: 'concern_probing', label: 'Concerns' },
];

const emptyQuestion: Omit<FixedInterviewQuestion, 'question_order'> = {
  question_text: '',
  category: 'general',
  priority: 2,
};

export default function FixedInterviewQuestionsEditor({
  questions,
  onChange,
  disabled = false,
}: FixedInterviewQuestionsEditorProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [editingQuestion, setEditingQuestion] = useState<FixedInterviewQuestion | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleAddQuestion = () => {
    setEditingQuestion({
      ...emptyQuestion,
      question_order: questions.length + 1,
    });
    setIsCreating(true);
    setIsDialogOpen(true);
  };

  const handleEditQuestion = (question: FixedInterviewQuestion) => {
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
          q.question_order === editingQuestion.question_order ? editingQuestion : q
        )
      );
    }
    setIsDialogOpen(false);
    setEditingQuestion(null);
  };

  const handleDeleteQuestion = (questionOrder: number) => {
    const filtered = questions.filter((q) => q.question_order !== questionOrder);
    // Renumber questions
    const renumbered = filtered.map((q, index) => ({
      ...q,
      question_order: index + 1,
    }));
    onChange(renumbered);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newQuestions = [...questions];
    [newQuestions[index - 1], newQuestions[index]] = [newQuestions[index], newQuestions[index - 1]];
    // Renumber
    const renumbered = newQuestions.map((q, i) => ({ ...q, question_order: i + 1 }));
    onChange(renumbered);
  };

  const handleMoveDown = (index: number) => {
    if (index === questions.length - 1) return;
    const newQuestions = [...questions];
    [newQuestions[index], newQuestions[index + 1]] = [newQuestions[index + 1], newQuestions[index]];
    // Renumber
    const renumbered = newQuestions.map((q, i) => ({ ...q, question_order: i + 1 }));
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
                    <ClipboardList className="h-5 w-5 text-[hsl(var(--young-gold))]" />
                    Fixed Interview Questions
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {questions.length === 0
                      ? 'No fixed questions configured yet'
                      : `${questions.length} question${questions.length !== 1 ? 's' : ''} - same for all candidates`}
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
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="text-sm font-semibold text-muted-foreground">
                            Q{question.question_order}
                          </span>
                          <Badge className={categoryColors[question.category] || 'bg-muted'} variant="secondary">
                            {categoryLabels[question.category] || question.category}
                          </Badge>
                          <Badge className={priorityColors[question.priority]} variant="secondary">
                            {priorityLabels[question.priority]}
                          </Badge>
                        </div>
                        <p className="text-sm">{question.question_text}</p>
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
                          onClick={() => handleDeleteQuestion(question.question_order)}
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
                  <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No fixed interview questions yet</p>
                  <p className="text-sm">Add standard questions that will be used for all candidates</p>
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
                Add Fixed Question
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {isCreating ? 'Add Fixed Question' : 'Edit Fixed Question'}
            </DialogTitle>
          </DialogHeader>
          {editingQuestion && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="question_text">Question *</Label>
                <Textarea
                  id="question_text"
                  value={editingQuestion.question_text}
                  onChange={(e) =>
                    setEditingQuestion({ ...editingQuestion, question_text: e.target.value })
                  }
                  placeholder="Enter your interview question..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={editingQuestion.category}
                    onValueChange={(value) =>
                      setEditingQuestion({ ...editingQuestion, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={editingQuestion.priority.toString()}
                    onValueChange={(value) =>
                      setEditingQuestion({ ...editingQuestion, priority: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">{priorityLabels[1]}</SelectItem>
                      <SelectItem value="2">{priorityLabels[2]}</SelectItem>
                      <SelectItem value="3">{priorityLabels[3]}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
              disabled={!editingQuestion?.question_text.trim()}
            >
              {isCreating ? 'Add Question' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
