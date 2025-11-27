import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, MessageSquare, Copy, Check, Sparkles } from 'lucide-react';
import { InterviewQuestion, useInterviewQuestions, useGenerateInterviewQuestions } from '@/hooks/useInterviewQuestions';
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

export function InterviewQuestionsCard({ applicationId }: InterviewQuestionsCardProps) {
  const { data: questions, isLoading } = useInterviewQuestions(applicationId);
  const generateQuestions = useGenerateInterviewQuestions();
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!questions?.length) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-6">
          <div className="text-center">
            <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-3">
              No interview questions generated yet
            </p>
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
                  Generate Questions
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Interview Questions ({questions.length})
          </CardTitle>
          <div className="flex gap-2">
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
            className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
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
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 shrink-0"
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
        ))}
      </CardContent>
    </Card>
  );
}
