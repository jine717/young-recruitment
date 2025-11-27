import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, MessageSquare, Copy, Check, Sparkles, Plus, Pencil, Trash2 } from 'lucide-react';
import { 
  InterviewQuestion, 
  useInterviewQuestions, 
  useGenerateInterviewQuestions,
  useCreateInterviewQuestion,
  useUpdateInterviewQuestion,
  useDeleteInterviewQuestion
} from '@/hooks/useInterviewQuestions';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface InterviewQuestionsCardProps {
  applicationId: string;
}

const categoryLabels: Record<string, string> = {
  skills_verification: 'Skills',
  concern_probing: 'Concerns',
  cultural_fit: 'Culture',
  experience: 'Experience',
  motivation: 'Motivation',
};

const categoryColors: Record<string, string> = {
  skills_verification: 'bg-blue-100 text-blue-800',
  concern_probing: 'bg-amber-100 text-amber-800',
  cultural_fit: 'bg-purple-100 text-purple-800',
  experience: 'bg-green-100 text-green-800',
  motivation: 'bg-pink-100 text-pink-800',
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

const categories = ['skills_verification', 'concern_probing', 'cultural_fit', 'experience', 'motivation'];

interface QuestionFormData {
  question_text: string;
  category: string;
  reasoning: string;
  priority: number;
}

const defaultFormData: QuestionFormData = {
  question_text: '',
  category: 'skills_verification',
  reasoning: '',
  priority: 2,
};

export function InterviewQuestionsCard({ applicationId }: InterviewQuestionsCardProps) {
  const { data: questions, isLoading } = useInterviewQuestions(applicationId);
  const generateQuestions = useGenerateInterviewQuestions();
  const createQuestion = useCreateInterviewQuestion();
  const updateQuestion = useUpdateInterviewQuestion();
  const deleteQuestion = useDeleteInterviewQuestion();
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<InterviewQuestion | null>(null);
  const [formData, setFormData] = useState<QuestionFormData>(defaultFormData);

  const handleGenerate = async () => {
    try {
      await generateQuestions.mutateAsync(applicationId);
      toast({
        title: "Questions Generated",
        description: "Interview questions have been generated successfully.",
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate questions",
        variant: "destructive",
      });
    }
  };

  const handleCopy = async (question: InterviewQuestion) => {
    await navigator.clipboard.writeText(question.question_text);
    setCopiedId(question.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAll = async () => {
    if (!questions?.length) return;
    const text = questions.map((q, i) => `${i + 1}. ${q.question_text}`).join('\n\n');
    await navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "All questions copied to clipboard",
    });
  };

  const openAddDialog = () => {
    setEditingQuestion(null);
    setFormData(defaultFormData);
    setIsDialogOpen(true);
  };

  const openEditDialog = (question: InterviewQuestion) => {
    setEditingQuestion(question);
    setFormData({
      question_text: question.question_text,
      category: question.category,
      reasoning: question.reasoning || '',
      priority: question.priority,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.question_text.trim()) {
      toast({
        title: "Error",
        description: "Question text is required",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingQuestion) {
        await updateQuestion.mutateAsync({
          id: editingQuestion.id,
          question_text: formData.question_text,
          category: formData.category,
          reasoning: formData.reasoning || null,
          priority: formData.priority,
        });
        toast({ title: "Question updated" });
      } else {
        await createQuestion.mutateAsync({
          application_id: applicationId,
          question_text: formData.question_text,
          category: formData.category,
          reasoning: formData.reasoning || undefined,
          priority: formData.priority,
        });
        toast({ title: "Question added" });
      }
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save question",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (question: InterviewQuestion) => {
    try {
      await deleteQuestion.mutateAsync({ id: question.id, applicationId });
      toast({ title: "Question deleted" });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete question",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!questions?.length) {
    return (
      <>
        <Card className="border-dashed">
          <CardContent className="py-6">
            <div className="text-center">
              <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-3">
                No interview questions yet
              </p>
              <div className="flex gap-2 justify-center">
                <Button 
                  onClick={handleGenerate} 
                  disabled={generateQuestions.isPending}
                  size="sm"
                >
                  {generateQuestions.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate with AI
                    </>
                  )}
                </Button>
                <Button variant="outline" size="sm" onClick={openAddDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Manually
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        <QuestionDialog 
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          formData={formData}
          setFormData={setFormData}
          onSave={handleSave}
          isEditing={!!editingQuestion}
          isSaving={createQuestion.isPending || updateQuestion.isPending}
        />
      </>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Interview Questions ({questions.length})
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={openAddDialog}>
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
              <Button variant="outline" size="sm" onClick={handleCopyAll}>
                <Copy className="h-3 w-3 mr-1" />
                Copy All
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleGenerate}
                disabled={generateQuestions.isPending}
              >
                {generateQuestions.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="h-3 w-3 mr-1" />
                    Regenerate
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {questions.map((question, index) => (
            <div 
              key={question.id} 
              className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      Q{index + 1}
                    </span>
                    <Badge className={categoryColors[question.category] || 'bg-muted'} variant="secondary">
                      {categoryLabels[question.category] || question.category}
                    </Badge>
                    <Badge className={priorityColors[question.priority]} variant="secondary">
                      {priorityLabels[question.priority]}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium">{question.question_text}</p>
                  {question.reasoning && (
                    <p className="text-xs text-muted-foreground mt-1 italic">
                      {question.reasoning}
                    </p>
                  )}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => openEditDialog(question)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(question)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => handleCopy(question)}
                  >
                    {copiedId === question.id ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      <QuestionDialog 
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        formData={formData}
        setFormData={setFormData}
        onSave={handleSave}
        isEditing={!!editingQuestion}
        isSaving={createQuestion.isPending || updateQuestion.isPending}
      />
    </>
  );
}

interface QuestionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  formData: QuestionFormData;
  setFormData: (data: QuestionFormData) => void;
  onSave: () => void;
  isEditing: boolean;
  isSaving: boolean;
}

function QuestionDialog({ isOpen, onClose, formData, setFormData, onSave, isEditing, isSaving }: QuestionDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Question' : 'Add Question'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Question</label>
            <Textarea
              placeholder="Enter your interview question..."
              value={formData.question_text}
              onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {categoryLabels[cat]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <Select 
                value={String(formData.priority)} 
                onValueChange={(value) => setFormData({ ...formData, priority: Number(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Must Ask</SelectItem>
                  <SelectItem value="2">Recommended</SelectItem>
                  <SelectItem value="3">If Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Reasoning (optional)</label>
            <Input
              placeholder="Why ask this question?"
              value={formData.reasoning}
              onChange={(e) => setFormData({ ...formData, reasoning: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : isEditing ? 'Save Changes' : 'Add Question'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
