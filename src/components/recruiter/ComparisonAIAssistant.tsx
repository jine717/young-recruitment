import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { FloatingPanel } from '@/components/ui/floating-panel';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Send, Trash2, RefreshCw, Users, Trophy } from 'lucide-react';
import { useComparisonAIAssistant, ComparisonContext } from '@/hooks/useComparisonAIAssistant';
import { AIAssistantChat } from './AIAssistantChat';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

interface ComparisonAIAssistantProps {
  comparisonContext: ComparisonContext;
}

export const ComparisonAIAssistant = ({ comparisonContext }: ComparisonAIAssistantProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  
  const { 
    messages, 
    isLoading, 
    error, 
    sendMessage, 
    clearConversation,
  } = useComparisonAIAssistant({ comparisonContext });
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Generate comparison-specific suggested questions
  const suggestedQuestions = useMemo(() => {
    const topCandidate = comparisonContext.result.recommendation.top_choice;
    const alternative = comparisonContext.result.recommendation.alternative;
    const rankings = comparisonContext.result.rankings;
    
    const questions: string[] = [
      `Why did you recommend ${topCandidate} over the other candidates?`,
      `What specific evidence supports choosing ${topCandidate}?`,
      `What are the key risks with ${topCandidate} and how can we address them?`,
    ];
    
    if (alternative && alternative !== 'None') {
      questions.push(`In what scenarios would ${alternative} be a better choice?`);
    }
    
    if (rankings.length > 2) {
      const lastCandidate = rankings[rankings.length - 1].candidate_name;
      questions.push(`What would ${lastCandidate} need to improve to be competitive?`);
    }
    
    if (comparisonContext.result.business_case_analysis?.length) {
      questions.push('Compare their business case responses - who showed the best problem-solving?');
    }
    
    if (comparisonContext.result.interview_performance_analysis?.length) {
      questions.push('How did interview performance affect the final rankings?');
    }
    
    questions.push('What interview questions would help differentiate these candidates further?');
    
    return questions.slice(0, 5);
  }, [comparisonContext]);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (error) {
      toast({
        variant: 'destructive',
        title: error.includes('Rate limit') ? 'Too many requests' : 
               error.includes('usage limit') ? 'Usage limit reached' : 'Error',
        description: error,
      });
    }
  }, [error, toast]);

  const handleSubmit = useCallback(async (message?: string) => {
    const content = message || input;
    if (!content.trim() || isLoading) return;
    
    setInput('');
    setLastFailedMessage(content);
    setSelectedSuggestionIndex(-1);
    await sendMessage(content);
    
    if (!error) {
      setLastFailedMessage(null);
    }
  }, [input, isLoading, sendMessage, error]);

  const handleRetry = () => {
    if (lastFailedMessage) {
      handleSubmit(lastFailedMessage);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (messages.length === 0 && selectedSuggestionIndex >= 0) {
        handleSubmit(suggestedQuestions[selectedSuggestionIndex]);
      } else {
        handleSubmit();
      }
      return;
    }

    if (messages.length === 0 && !input.trim()) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestedQuestions.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : suggestedQuestions.length - 1
        );
      }
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    handleSubmit(question);
  };

  const hasError = error && messages.length > 0 && 
    messages[messages.length - 1]?.content?.includes('Sorry, I encountered an error');

  const lastMessage = messages[messages.length - 1];
  const followUpSuggestions = lastMessage?.role === 'assistant' && !lastMessage.isStreaming
    ? lastMessage.followUpSuggestions || []
    : [];

  const panelContent = (
    <>
      <div className="flex-1 flex flex-col min-h-0">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col px-4 sm:px-6 py-4 sm:py-6 overflow-y-auto">
            {/* Comparison Quick Info */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border mb-4">
              <div className="w-10 h-10 rounded-full bg-[hsl(var(--young-blue))]/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-[hsl(var(--young-blue))]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{comparisonContext.jobTitle}</p>
                <p className="text-xs text-muted-foreground">
                  Comparing {comparisonContext.candidateCount} candidates
                </p>
              </div>
              <div className="flex items-center gap-1 text-[hsl(var(--young-gold))]">
                <Trophy className="w-4 h-4" />
                <span className="text-sm font-medium truncate max-w-[100px]">
                  {comparisonContext.result.recommendation.top_choice}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center py-2">
              <h3 className="text-base font-semibold mb-1">Ask about this comparison</h3>
              <p className="text-xs text-muted-foreground text-center mb-4">
                Get AI insights on why candidates were ranked this way
              </p>
            </div>

            <div className="w-full space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Suggested questions</p>
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestedQuestion(question)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-lg text-sm",
                    "transition-colors border",
                    selectedSuggestionIndex === index
                      ? "bg-primary/10 border-primary"
                      : "bg-muted/50 hover:bg-muted border-transparent hover:border-border"
                  )}
                >
                  {question}
                </button>
              ))}
            </div>

            {!isMobile && (
              <p className="text-xs text-muted-foreground mt-4 text-center">
                Use ↑↓ arrows to navigate, Enter to select
              </p>
            )}
          </div>
        ) : (
          <>
            <AIAssistantChat 
              messages={messages} 
              isLoading={isLoading}
            />
            
            {followUpSuggestions.length > 0 && !isLoading && (
              <div className="px-4 py-2 border-t bg-muted/30">
                <p className="text-xs text-muted-foreground mb-2">Follow-up questions</p>
                <div className="flex flex-wrap gap-2">
                  {followUpSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestedQuestion(suggestion)}
                      className="text-xs px-3 py-1.5 rounded-full bg-background border hover:bg-muted transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {hasError && lastFailedMessage && (
        <div className="px-4 pb-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetry}
            disabled={isLoading}
            className="w-full gap-2"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry last message
          </Button>
        </div>
      )}

      <div className={cn(
        "flex-shrink-0 border-t bg-background",
        isMobile ? "p-3" : "p-4"
      )}>
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setSelectedSuggestionIndex(-1);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask about the comparison..."
            className={cn(
              "resize-none",
              isMobile ? "min-h-[48px] max-h-[100px] text-base" : "min-h-[44px] max-h-[120px]"
            )}
            disabled={isLoading}
          />
          <Button
            size="icon"
            onClick={() => handleSubmit()}
            disabled={!input.trim() || isLoading}
            className={cn(
              "flex-shrink-0 bg-[hsl(var(--young-blue))] hover:bg-[hsl(var(--young-blue))]/90 text-[hsl(var(--young-black))]",
              isMobile ? "h-12 w-12" : "h-11 w-11"
            )}
          >
            <Send className={cn(isMobile ? "h-5 w-5" : "h-4 w-4")} />
          </Button>
        </div>
      </div>
    </>
  );

  const headerIcon = (
    <div className="w-8 h-8 rounded-full bg-[hsl(var(--young-blue))] flex items-center justify-center">
      <Sparkles className="w-4 h-4 text-[hsl(var(--young-black))]" />
    </div>
  );

  const headerActions = messages.length > 0 ? (
    <Button
      variant="ghost"
      size="icon"
      onClick={clearConversation}
      className="h-8 w-8 text-muted-foreground hover:text-foreground"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  ) : null;

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            size="lg"
            className={cn(
              "fixed bottom-6 right-6 z-50 rounded-full shadow-lg",
              "bg-[hsl(var(--young-blue))] hover:bg-[hsl(var(--young-blue))]/90 text-[hsl(var(--young-black))]",
              "transition-transform hover:scale-105",
              "h-16 w-16"
            )}
          >
            <Sparkles className="h-7 w-7" />
          </Button>
        </SheetTrigger>

        <SheetContent 
          side="right" 
          className="p-0 flex flex-col bg-background w-full sm:w-full"
        >
          <SheetHeader className="px-4 py-3 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {headerIcon}
                <div>
                  <SheetTitle className="text-lg font-semibold">Young AI</SheetTitle>
                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                    Comparison Analysis
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {headerActions}
              </div>
            </div>
          </SheetHeader>
          {panelContent}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <>
      <Button
        size="lg"
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-50 rounded-full shadow-lg",
          "bg-[hsl(var(--young-blue))] hover:bg-[hsl(var(--young-blue))]/90 text-[hsl(var(--young-black))]",
          "transition-transform hover:scale-105",
          isOpen ? "hidden" : ""
        )}
      >
        <Sparkles className="h-5 w-5 mr-2" />
        Ask AI
      </Button>

      <FloatingPanel
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        title="Young AI"
        subtitle="Comparison Analysis"
        headerIcon={headerIcon}
        headerActions={headerActions}
        storageKey="comparison-ai-panel"
      >
        {panelContent}
      </FloatingPanel>
    </>
  );
};
