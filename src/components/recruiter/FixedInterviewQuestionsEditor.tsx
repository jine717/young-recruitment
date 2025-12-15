import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, ChevronDown, ChevronUp, Pencil, Trash2, ClipboardList, X, Check } from 'lucide-react';

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
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<FixedInterviewQuestion | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newQuestion, setNewQuestion] = useState<FixedInterviewQuestion | null>(null);

  const handleAddQuestion = () => {
    setNewQuestion({
      ...emptyQuestion,
      question_order: questions.length + 1,
    });
    setIsAddingNew(true);
    setEditingIndex(null);
    setEditingQuestion(null);
  };

  const handleEditQuestion = (question: FixedInterviewQuestion, index: number) => {
    setEditingQuestion({ ...question });
    setEditingIndex(index);
    setIsAddingNew(false);
    setNewQuestion(null);
  };

  const handleSaveNewQuestion = () => {
    if (!newQuestion) return;
    onChange([...questions, newQuestion]);
    setNewQuestion(null);
    setIsAddingNew(false);
  };

  const handleSaveEditQuestion = () => {
    if (!editingQuestion || editingIndex === null) return;
    onChange(
      questions.map((q, i) => (i === editingIndex ? editingQuestion : q))
    );
    setEditingIndex(null);
    setEditingQuestion(null);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingQuestion(null);
  };

  const handleCancelNew = () => {
    setIsAddingNew(false);
    setNewQuestion(null);
  };

  const handleDeleteQuestion = (questionOrder: number) => {
    const filtered = questions.filter((q) => q.question_order !== questionOrder);
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
    const renumbered = newQuestions.map((q, i) => ({ ...q, question_order: i + 1 }));
    onChange(renumbered);
  };

  const handleMoveDown = (index: number) => {
    if (index === questions.length - 1) return;
    const newQuestions = [...questions];
    [newQuestions[index], newQuestions[index + 1]] = [newQuestions[index + 1], newQuestions[index]];
    const renumbered = newQuestions.map((q, i) => ({ ...q, question_order: i + 1 }));
    onChange(renumbered);
  };

  const renderQuestionForm = (
    question: FixedInterviewQuestion,
    onUpdate: (updated: FixedInterviewQuestion) => void,
    onSave: () => void,
    onCancel: () => void,
    isNew: boolean
  ) => (
    <div className="p-4 border-2 border-[hsl(var(--young-gold))]/50 rounded-lg bg-[hsl(var(--young-gold))]/5 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[hsl(var(--young-gold))]">
          {isNew ? 'New Fixed Question' : `Editing Q${question.question_order}`}
        </span>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-8"
          >
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onSave}
            disabled={!question.question_text.trim()}
            className="h-8"
          >
            <Check className="h-4 w-4 mr-1" />
            {isNew ? 'Add' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`text-${question.question_order}`}>Question *</Label>
        <Textarea
          id={`text-${question.question_order}`}
          value={question.question_text}
          onChange={(e) => onUpdate({ ...question, question_text: e.target.value })}
          placeholder="Enter your interview question..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`category-${question.question_order}`}>Category</Label>
          <Select
            value={question.category}
            onValueChange={(value) => onUpdate({ ...question, category: value })}
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
          <Label htmlFor={`priority-${question.question_order}`}>Priority</Label>
          <Select
            value={question.priority.toString()}
            onValueChange={(value) => onUpdate({ ...question, priority: parseInt(value) })}
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
  );

  return (
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
                  editingIndex === index && editingQuestion ? (
                    <div key={question.id || `edit-${index}`}>
                      {renderQuestionForm(
                        editingQuestion,
                        setEditingQuestion,
                        handleSaveEditQuestion,
                        handleCancelEdit,
                        false
                      )}
                    </div>
                  ) : (
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
                          disabled={disabled || index === 0 || editingIndex !== null || isAddingNew}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleMoveDown(index)}
                          disabled={disabled || index === questions.length - 1 || editingIndex !== null || isAddingNew}
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
                          onClick={() => handleEditQuestion(question, index)}
                          disabled={disabled || editingIndex !== null || isAddingNew}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteQuestion(question.question_order)}
                          disabled={disabled || editingIndex !== null || isAddingNew}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                ))}
              </div>
            ) : !isAddingNew && (
              <div className="text-center py-8 text-muted-foreground">
                <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No fixed interview questions yet</p>
                <p className="text-sm">Add standard questions that will be used for all candidates</p>
              </div>
            )}

            {isAddingNew && newQuestion && (
              <div className="mt-3">
                {renderQuestionForm(
                  newQuestion,
                  setNewQuestion,
                  handleSaveNewQuestion,
                  handleCancelNew,
                  true
                )}
              </div>
            )}

            {!isAddingNew && editingIndex === null && (
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
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
