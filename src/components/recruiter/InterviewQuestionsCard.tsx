import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Loader2, MessageSquare, Copy, Check, Sparkles, Plus, Pencil, Trash2, ChevronDown, StickyNote } from 'lucide-react';
import { 
  InterviewQuestion, 
  useInterviewQuestions, 
  useGenerateInterviewQuestions,
  useCreateInterviewQuestion,
  useUpdateInterviewQuestion,
  useDeleteInterviewQuestion
} from '@/hooks/useInterviewQuestions';
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
  skills_verification: 'bg-[hsl(var(--young-blue))]/20 text-[hsl(var(--young-blue))]',
  concern_probing: 'bg-[hsl(var(--young-gold))]/20 text-[hsl(var(--young-gold))]',
  cultural_fit: 'bg-[hsl(var(--young-khaki))]/20 text-[hsl(var(--young-khaki))]',
  experience: 'bg-[hsl(var(--young-blue))]/10 text-[hsl(var(--young-blue))]',
  motivation: 'bg-[hsl(var(--young-gold))]/10 text-[hsl(var(--young-gold))]',
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
  const [isOpen, setIsOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [customInstructions, setCustomInstructions] = useState('');

  const openGenerateDialog = () => {
    setCustomInstructions('');
    setIsGenerateDialogOpen(true);
  };

  const handleGenerateWithInstructions = async () => {
    try {
      await generateQuestions.mutateAsync({
        applicationId,
        customInstructions: customInstructions.trim() || undefined,
      });
      setIsGenerateDialogOpen(false);
      setCustomInstructions('');
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

  const startEditingNote = (question: InterviewQuestion) => {
    setEditingNoteId(question.id);
    setNoteText(question.recruiter_note || '');
  };

  const saveNote = async (questionId: string) => {
    try {
      await updateQuestion.mutateAsync({
        id: questionId,
        recruiter_note: noteText.trim() || null,
      });
      setEditingNoteId(null);
      setNoteText('');
      toast({ title: "Note saved" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save note",
        variant: "destructive",
      });
    }
  };

  const cancelEditingNote = () => {
    setEditingNoteId(null);
    setNoteText('');
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
              <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground mb-3">
                No interview questions yet
              </p>
              <div className="flex gap-2 justify-center">
                <Button 
                  onClick={openGenerateDialog} 
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
        <GenerateQuestionsDialog
          isOpen={isGenerateDialogOpen}
          onClose={() => setIsGenerateDialogOpen(false)}
          customInstructions={customInstructions}
          setCustomInstructions={setCustomInstructions}
          onGenerate={handleGenerateWithInstructions}
          isGenerating={generateQuestions.isPending}
        />
      </>
    );
  }

  return (
    <>
      <Card>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CardHeader className="pb-3">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer hover:bg-muted/30 -mx-2 px-2 py-1 rounded-md transition-colors">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Interview Questions ({questions.length})
                </CardTitle>
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </div>
            </CollapsibleTrigger>
            <div className="flex gap-2 mt-2">
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
                onClick={openGenerateDialog}
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
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-3 pt-0">
              {questions.map((question, index) => (
                <div 
                  key={question.id} 
                  className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
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
                      
                      {/* Recruiter Note Section */}
                      <div className="mt-2">
                        {editingNoteId === question.id ? (
                          <div className="space-y-2">
                            <Textarea
                              placeholder="Add your note for this question..."
                              value={noteText}
                              onChange={(e) => setNoteText(e.target.value)}
                              rows={2}
                              className="text-sm"
                            />
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                onClick={() => saveNote(question.id)}
                                disabled={updateQuestion.isPending}
                              >
                                {updateQuestion.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
                              </Button>
                              <Button size="sm" variant="outline" onClick={cancelEditingNote}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : question.recruiter_note ? (
                          <div 
                            className="mt-2 p-2 rounded bg-primary/5 border border-primary/10 cursor-pointer hover:bg-primary/10 transition-colors"
                            onClick={() => startEditingNote(question)}
                          >
                            <div className="flex items-start gap-2">
                              <StickyNote className="h-3 w-3 mt-0.5 text-primary" />
                              <p className="text-xs text-foreground/80">{question.recruiter_note}</p>
                            </div>
                          </div>
                        ) : (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 text-xs text-muted-foreground mt-1"
                            onClick={() => startEditingNote(question)}
                          >
                            <StickyNote className="h-3 w-3 mr-1" />
                            Add note
                          </Button>
                        )}
                      </div>
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
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
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
                          <Check className="h-3 w-3 text-[hsl(var(--young-blue))]" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
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
      <GenerateQuestionsDialog
        isOpen={isGenerateDialogOpen}
        onClose={() => setIsGenerateDialogOpen(false)}
        customInstructions={customInstructions}
        setCustomInstructions={setCustomInstructions}
        onGenerate={handleGenerateWithInstructions}
        isGenerating={generateQuestions.isPending}
      />
    </>
  );
}

// Generate Questions Dialog Component
interface GenerateQuestionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customInstructions: string;
  setCustomInstructions: (value: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

function GenerateQuestionsDialog({ 
  isOpen, 
  onClose, 
  customInstructions, 
  setCustomInstructions, 
  onGenerate, 
  isGenerating 
}: GenerateQuestionsDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[hsl(var(--young-blue))]" />
            Generate AI Questions
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            AI will analyze the candidate's profile, CV, business case responses, 
            and AI evaluation to generate targeted interview questions.
          </p>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Custom Instructions (Optional)
            </label>
            <Textarea
              placeholder="E.g., 'Focus on leadership experience', 'Probe into the 2-year gap in employment', 'Ask about specific Python frameworks mentioned in CV'..."
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to generate questions using default criteria based on 
              the candidate's profile and job requirements.
            </p>
          </div>
        </div>
        
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={onGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Questions
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
                value={formData.priority.toString()} 
                onValueChange={(value) => setFormData({ ...formData, priority: parseInt(value) })}
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
          <div className="space-y-2">
            <label className="text-sm font-medium">Reasoning (Optional)</label>
            <Textarea
              placeholder="Why is this question important?"
              value={formData.reasoning}
              onChange={(e) => setFormData({ ...formData, reasoning: e.target.value })}
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEditing ? 'Update' : 'Add'} Question
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
