import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Loader2, MessageSquare, Copy, Check, Sparkles, Plus, Pencil, Trash2, StickyNote, ClipboardList, ExternalLink, ChevronDown } from 'lucide-react';
import { 
  InterviewQuestion, 
  useInterviewQuestions, 
  useGenerateInterviewQuestions,
  useCreateInterviewQuestion,
  useUpdateInterviewQuestion,
  useDeleteInterviewQuestion
} from '@/hooks/useInterviewQuestions';
import { useJobFixedQuestions, JobFixedQuestion } from '@/hooks/useJobFixedQuestions';
import { useFixedQuestionNotes, useUpsertFixedQuestionNote } from '@/hooks/useFixedQuestionNotes';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

interface InterviewQuestionsSectionProps {
  applicationId: string;
  jobId: string;
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

export function InterviewQuestionsSection({ applicationId, jobId }: InterviewQuestionsSectionProps) {
  const { data: aiQuestions, isLoading: aiLoading } = useInterviewQuestions(applicationId);
  const { data: fixedQuestions, isLoading: fixedLoading } = useJobFixedQuestions(jobId);
  const { data: fixedQuestionNotes, isLoading: fixedNotesLoading } = useFixedQuestionNotes(applicationId);
  const generateQuestions = useGenerateInterviewQuestions();
  const createQuestion = useCreateInterviewQuestion();
  const updateQuestion = useUpdateInterviewQuestion();
  const deleteQuestion = useDeleteInterviewQuestion();
  const upsertFixedNote = useUpsertFixedQuestionNote();
  const { toast } = useToast();
  
  const [isOpen, setIsOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<InterviewQuestion | null>(null);
  const [formData, setFormData] = useState<QuestionFormData>(defaultFormData);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [editingFixedNoteId, setEditingFixedNoteId] = useState<string | null>(null);
  const [fixedNoteText, setFixedNoteText] = useState('');
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

  const handleCopy = async (questionText: string, id: string) => {
    await navigator.clipboard.writeText(questionText);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAll = async () => {
    const allQuestions = [
      ...(aiQuestions || []).map((q, i) => `AI Q${i + 1}. ${q.question_text}`),
      ...(fixedQuestions || []).map((q, i) => `Fixed Q${i + 1}. ${q.question_text}`),
    ];
    if (!allQuestions.length) return;
    await navigator.clipboard.writeText(allQuestions.join('\n\n'));
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

  // Fixed question note handlers
  const getFixedQuestionNote = (fixedQuestionId: string) => {
    return fixedQuestionNotes?.find(n => n.fixed_question_id === fixedQuestionId);
  };

  const startEditingFixedNote = (fixedQuestionId: string) => {
    const existingNote = getFixedQuestionNote(fixedQuestionId);
    setEditingFixedNoteId(fixedQuestionId);
    setFixedNoteText(existingNote?.note_text || '');
  };

  const saveFixedNote = async (fixedQuestionId: string) => {
    try {
      await upsertFixedNote.mutateAsync({
        applicationId,
        fixedQuestionId,
        noteText: fixedNoteText.trim() || null,
      });
      setEditingFixedNoteId(null);
      setFixedNoteText('');
      toast({ title: "Note saved" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save note",
        variant: "destructive",
      });
    }
  };

  const cancelEditingFixedNote = () => {
    setEditingFixedNoteId(null);
    setFixedNoteText('');
  };

  const isLoading = aiLoading || fixedLoading || fixedNotesLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalQuestions = (aiQuestions?.length || 0) + (fixedQuestions?.length || 0);

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        {/* Collapsible Header */}
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-3 rounded-lg transition-colors mb-2">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Interview Questions
              {totalQuestions > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {totalQuestions}
                </Badge>
              )}
            </h3>
            <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          {/* Copy All button */}
          <div className="flex justify-end mb-4">
            <Button variant="outline" size="sm" onClick={handleCopyAll}>
              <Copy className="h-3 w-3 mr-1" />
              Copy All
            </Button>
          </div>

          {/* Two-column layout */}
          <div className="grid md:grid-cols-2 gap-4">
        {/* Left Column: AI-Generated Questions */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[hsl(var(--young-blue))]" />
                AI-Generated
                {aiQuestions?.length ? (
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-[hsl(var(--young-blue))]/20 text-[hsl(var(--young-blue))]">
                    {aiQuestions.length}
                  </span>
                ) : null}
              </CardTitle>
            </div>
            <p className="text-xs text-muted-foreground">
              Personalized for this candidate
            </p>
            <div className="flex gap-2 mt-2">
              <Button variant="outline" size="sm" onClick={openAddDialog}>
                <Plus className="h-3 w-3 mr-1" />
                Add
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
                    {aiQuestions?.length ? 'Regenerate' : 'Generate'}
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {!aiQuestions?.length ? (
              <div className="text-center py-6 text-sm text-muted-foreground">
                <Sparkles className="h-6 w-6 mx-auto mb-2 opacity-50" />
                <p>No AI questions yet</p>
                <p className="text-xs mt-1">Click "Generate" to create personalized questions</p>
              </div>
            ) : (
              aiQuestions.map((question, index) => (
                <AIQuestionItem
                  key={question.id}
                  question={question}
                  index={index}
                  copiedId={copiedId}
                  editingNoteId={editingNoteId}
                  noteText={noteText}
                  setNoteText={setNoteText}
                  onCopy={() => handleCopy(question.question_text, question.id)}
                  onEdit={() => openEditDialog(question)}
                  onDelete={() => handleDelete(question)}
                  onStartEditNote={() => startEditingNote(question)}
                  onSaveNote={() => saveNote(question.id)}
                  onCancelNote={cancelEditingNote}
                  isSavingNote={updateQuestion.isPending}
                />
              ))
            )}
          </CardContent>
        </Card>

        {/* Right Column: Fixed Questions */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-[hsl(var(--young-gold))]" />
                Fixed Questions
                {fixedQuestions?.length ? (
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-[hsl(var(--young-gold))]/20 text-[hsl(var(--young-gold))]">
                    {fixedQuestions.length}
                  </span>
                ) : null}
              </CardTitle>
            </div>
            <p className="text-xs text-muted-foreground">
              Standard for all candidates
            </p>
            <div className="mt-2">
              <Button variant="outline" size="sm" asChild>
                <Link to={`/dashboard/jobs/${jobId}/edit`}>
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Edit in Job Settings
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {!fixedQuestions?.length ? (
              <div className="text-center py-6 text-sm text-muted-foreground">
                <ClipboardList className="h-6 w-6 mx-auto mb-2 opacity-50" />
                <p>No fixed questions yet</p>
                <p className="text-xs mt-1">Add them in the Job Settings</p>
              </div>
            ) : (
              fixedQuestions.map((question, index) => (
                <FixedQuestionItem
                  key={question.id}
                  question={question}
                  index={index}
                  copiedId={copiedId}
                  onCopy={() => handleCopy(question.question_text, question.id)}
                  noteText={getFixedQuestionNote(question.id)?.note_text || null}
                  editingNoteId={editingFixedNoteId}
                  currentNoteText={fixedNoteText}
                  setNoteText={setFixedNoteText}
                  onStartEditNote={() => startEditingFixedNote(question.id)}
                  onSaveNote={() => saveFixedNote(question.id)}
                  onCancelNote={cancelEditingFixedNote}
                  isSavingNote={upsertFixedNote.isPending}
                />
              ))
            )}
          </CardContent>
        </Card>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Dialogs */}
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

// AI Question Item Component
interface AIQuestionItemProps {
  question: InterviewQuestion;
  index: number;
  copiedId: string | null;
  editingNoteId: string | null;
  noteText: string;
  setNoteText: (text: string) => void;
  onCopy: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStartEditNote: () => void;
  onSaveNote: () => void;
  onCancelNote: () => void;
  isSavingNote: boolean;
}

function AIQuestionItem({
  question,
  index,
  copiedId,
  editingNoteId,
  noteText,
  setNoteText,
  onCopy,
  onEdit,
  onDelete,
  onStartEditNote,
  onSaveNote,
  onCancelNote,
  isSavingNote,
}: AIQuestionItemProps) {
  return (
    <div className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-xs font-medium text-muted-foreground">Q{index + 1}</span>
            <Badge className={categoryColors[question.category] || 'bg-muted'} variant="secondary">
              {categoryLabels[question.category] || question.category}
            </Badge>
            <Badge className={priorityColors[question.priority]} variant="secondary">
              {priorityLabels[question.priority]}
            </Badge>
          </div>
          <p className="text-sm">{question.question_text}</p>
          {question.reasoning && (
            <p className="text-xs text-muted-foreground mt-1 italic">{question.reasoning}</p>
          )}
          
          {/* Recruiter Note */}
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
                  <Button size="sm" onClick={onSaveNote} disabled={isSavingNote}>
                    {isSavingNote ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={onCancelNote}>Cancel</Button>
                </div>
              </div>
            ) : question.recruiter_note ? (
              <div 
                className="mt-2 p-2 rounded bg-primary/5 border border-primary/10 cursor-pointer hover:bg-primary/10 transition-colors"
                onClick={onStartEditNote}
              >
                <div className="flex items-start gap-2">
                  <StickyNote className="h-3 w-3 mt-0.5 text-primary" />
                  <p className="text-xs text-foreground/80">{question.recruiter_note}</p>
                </div>
              </div>
            ) : (
              <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground" onClick={onStartEditNote}>
                <StickyNote className="h-3 w-3 mr-1" />
                Add note
              </Button>
            )}
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
            <Pencil className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={onDelete}>
            <Trash2 className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCopy}>
            {copiedId === question.id ? (
              <Check className="h-3 w-3 text-[hsl(var(--young-blue))]" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Fixed Question Item Component
interface FixedQuestionItemProps {
  question: JobFixedQuestion;
  index: number;
  copiedId: string | null;
  onCopy: () => void;
  noteText: string | null;
  editingNoteId: string | null;
  currentNoteText: string;
  setNoteText: (text: string) => void;
  onStartEditNote: () => void;
  onSaveNote: () => void;
  onCancelNote: () => void;
  isSavingNote: boolean;
}

function FixedQuestionItem({ 
  question, 
  index, 
  copiedId, 
  onCopy,
  noteText,
  editingNoteId,
  currentNoteText,
  setNoteText,
  onStartEditNote,
  onSaveNote,
  onCancelNote,
  isSavingNote,
}: FixedQuestionItemProps) {
  const isEditingThisNote = editingNoteId === question.id;
  
  return (
    <div className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-xs font-medium text-muted-foreground">Q{index + 1}</span>
            <Badge className={categoryColors[question.category] || 'bg-muted'} variant="secondary">
              {categoryLabels[question.category] || question.category}
            </Badge>
            <Badge className={priorityColors[question.priority]} variant="secondary">
              {priorityLabels[question.priority]}
            </Badge>
          </div>
          <p className="text-sm">{question.question_text}</p>
          
          {/* Recruiter Note */}
          <div className="mt-2">
            {isEditingThisNote ? (
              <div className="space-y-2">
                <Textarea
                  placeholder="Add your note for this question..."
                  value={currentNoteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={2}
                  className="text-sm"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={onSaveNote} disabled={isSavingNote}>
                    {isSavingNote ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={onCancelNote}>Cancel</Button>
                </div>
              </div>
            ) : noteText ? (
              <div 
                className="mt-2 p-2 rounded bg-primary/5 border border-primary/10 cursor-pointer hover:bg-primary/10 transition-colors"
                onClick={onStartEditNote}
              >
                <div className="flex items-start gap-2">
                  <StickyNote className="h-3 w-3 mt-0.5 text-primary" />
                  <p className="text-xs text-foreground/80">{noteText}</p>
                </div>
              </div>
            ) : (
              <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground" onClick={onStartEditNote}>
                <StickyNote className="h-3 w-3 mr-1" />
                Add note
              </Button>
            )}
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCopy}>
            {copiedId === question.id ? (
              <Check className="h-3 w-3 text-[hsl(var(--young-blue))]" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Question Dialog Component
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
                  {categories.map(cat => (
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
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            {isEditing ? 'Save Changes' : 'Add Question'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onGenerate} disabled={isGenerating}>
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
