import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { FloatingPanel } from '@/components/ui/floating-panel';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Send, Trash2, RefreshCw, Star, StarOff, CheckCircle2, Circle } from 'lucide-react';
import { useAIAssistant, JobEditorContext } from '@/hooks/useAIAssistant';
import { AIAssistantChat } from './AIAssistantChat';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

// Workflow Progress Tracker Component
const WorkflowProgressTracker = ({ jobEditorContext }: { jobEditorContext: JobEditorContext }) => {
  const hasTitle = !!jobEditorContext.title?.trim();
  const hasLocation = !!jobEditorContext.location?.trim();
  const hasDescription = !!jobEditorContext.description?.trim();
  const responsibilitiesCount = jobEditorContext.responsibilities?.filter(r => r.trim()).length || 0;
  const requirementsCount = jobEditorContext.requirements?.filter(r => r.trim()).length || 0;
  const benefitsCount = jobEditorContext.benefits?.filter(b => b.trim()).length || 0;
  
  // Truncate title for display (max 30 chars)
  const truncatedTitle = jobEditorContext.title 
    ? jobEditorContext.title.length > 30 
      ? `"${jobEditorContext.title.substring(0, 30)}..."` 
      : `"${jobEditorContext.title}"`
    : null;
  
  const steps = [
    { label: 'Title', done: hasTitle, value: truncatedTitle },
    { label: 'Location', done: hasLocation, value: hasLocation ? jobEditorContext.location : null },
    { label: 'Description', done: hasDescription, value: hasDescription ? '✓' : null },
    { label: 'Responsibilities', done: responsibilitiesCount >= 3, value: `${responsibilitiesCount}/5` },
    { label: 'Requirements', done: requirementsCount >= 3, value: `${requirementsCount}/3` },
    { label: 'Benefits', done: benefitsCount >= 2, value: `${benefitsCount}/2` },
  ];
  
  const completedCount = steps.filter(s => s.done).length;
  
  return (
    <div className="mb-4 p-3 rounded-lg bg-muted/50 border">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-muted-foreground">Job Creation Progress</p>
        <span className="text-xs text-muted-foreground">{completedCount}/{steps.length}</span>
      </div>
      <div className="space-y-1.5">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            {step.done ? (
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            )}
            <span className={cn(
              "truncate flex-1",
              step.done ? "text-foreground" : "text-muted-foreground"
            )}>
              {step.label}
            </span>
            {step.value && (
              <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                {step.value}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

interface JobEditorAIAssistantProps {
  jobEditorContext: JobEditorContext;
}

export const JobEditorAIAssistant = ({ jobEditorContext }: JobEditorAIAssistantProps) => {
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
    pinnedQuestions,
    pinQuestion,
    unpinQuestion,
  } = useAIAssistant({ 
    jobEditorContext,
    sessionKey: 'job-editor-ai-messages',
  });
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Dynamic suggested questions based on form state - PRIORITY ORDER
  const suggestedQuestions = useMemo(() => {
    const questions: string[] = [];
    const hasTitle = jobEditorContext.title?.trim();
    const hasDescription = jobEditorContext.description?.trim();
    const responsibilitiesCount = jobEditorContext.responsibilities?.filter(r => r.trim()).length || 0;
    const requirementsCount = jobEditorContext.requirements?.filter(r => r.trim()).length || 0;
    const benefitsCount = jobEditorContext.benefits?.filter(b => b.trim()).length || 0;
    const businessCaseCount = jobEditorContext.businessCaseQuestions?.length || 0;
    const interviewQuestionsCount = jobEditorContext.fixedInterviewQuestions?.length || 0;
    
    // PRIORITY 1: Title (if not set) - This is the first step
    if (!hasTitle) {
      questions.push('Help me create a new job vacancy');
      questions.push('Suggest a job title for a developer role');
      return questions; // Only show title-related suggestions first
    }
    
    // PRIORITY 2: Description (if not set)
    if (!hasDescription) {
      questions.push(`Write a compelling job description for ${jobEditorContext.title}`);
      questions.push(`Suggest a location for this ${jobEditorContext.title} role`);
      return questions.slice(0, 3);
    }
    
    // PRIORITY 3: Core sections (responsibilities, requirements, benefits)
    if (responsibilitiesCount < 3) {
      questions.push(`Suggest 5 key responsibilities for ${jobEditorContext.title}`);
    }
    if (requirementsCount < 3) {
      questions.push('What requirements should I include?');
    }
    if (benefitsCount < 2) {
      questions.push('Suggest attractive benefits for this role');
    }
    
    // If we have some core sections suggestions, return them
    if (questions.length >= 2) {
      return questions.slice(0, 4);
    }
    
    // PRIORITY 4: Advanced sections (business case, interview questions)
    if (businessCaseCount === 0) {
      questions.push(`Suggest 3 business case questions for ${jobEditorContext.title}`);
    }
    if (interviewQuestionsCount === 0) {
      questions.push(`Suggest fixed interview questions for ${jobEditorContext.title}`);
    }
    
    // PRIORITY 5: Polish and review
    if (!jobEditorContext.aiSystemPrompt?.trim()) {
      questions.push('Help me write AI evaluation criteria');
    }
    
    questions.push('Review my job posting and suggest improvements');
    
    return questions.slice(0, 4);
  }, [jobEditorContext]);

  // Combine pinned and suggested
  const allQuestions = useMemo(() => {
    const suggested = suggestedQuestions.filter(q => !pinnedQuestions.includes(q));
    return { pinned: pinnedQuestions, suggested };
  }, [pinnedQuestions, suggestedQuestions]);

  // Focus textarea when panel opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Show toast on error
  useEffect(() => {
    if (error) {
      const isRateLimit = error.includes('Rate limit') || error.includes('429');
      const isQuotaExceeded = error.includes('usage limit') || error.includes('402');
      
      toast({
        variant: 'destructive',
        title: isRateLimit ? 'Too many requests' : isQuotaExceeded ? 'Usage limit reached' : 'Error',
        description: error,
      });
    }
  }, [error, toast]);

  // Keyboard shortcut
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen]);

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
    const totalQuestions = allQuestions.pinned.length + allQuestions.suggested.length;
    
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (messages.length === 0 && selectedSuggestionIndex >= 0) {
        const allQ = [...allQuestions.pinned, ...allQuestions.suggested];
        handleSubmit(allQ[selectedSuggestionIndex]);
      } else {
        handleSubmit();
      }
      return;
    }

    if (messages.length === 0 && !input.trim()) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < totalQuestions - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : totalQuestions - 1
        );
      }
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    handleSubmit(question);
  };

  const togglePin = (question: string, isPinned: boolean) => {
    if (isPinned) {
      unpinQuestion(question);
    } else {
      pinQuestion(question);
    }
  };

  const hasError = error && messages.length > 0 && 
    messages[messages.length - 1]?.content?.includes('Sorry, I encountered an error');

  // Follow-up suggestions
  const lastMessage = messages[messages.length - 1];
  const followUpSuggestions = lastMessage?.role === 'assistant' && !lastMessage.isStreaming
    ? lastMessage.followUpSuggestions || []
    : [];

  // Panel content
  const panelContent = (
    <>
      <div className="flex-1 flex flex-col min-h-0">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col px-4 sm:px-6 py-4 sm:py-6 overflow-y-auto">
            {/* Welcome */}
            <div className="flex flex-col items-center justify-center py-4">
              <div className={cn(
                "rounded-full bg-primary/10 flex items-center justify-center mb-3",
                isMobile ? "w-12 h-12" : "w-14 h-14"
              )}>
                <Sparkles className={cn("text-primary", isMobile ? "w-6 h-6" : "w-7 h-7")} />
              </div>
              <h3 className="text-base font-semibold mb-1">Job Creation Assistant</h3>
              <p className="text-xs text-muted-foreground text-center mb-4">
                I can help you write descriptions, requirements, and more
              </p>
            </div>

            {/* Workflow Progress Tracker */}
            <WorkflowProgressTracker jobEditorContext={jobEditorContext} />

            {/* Pinned Questions */}
            {allQuestions.pinned.length > 0 && (
              <div className="w-full space-y-2 mb-4">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Star className="w-3 h-3 text-[hsl(var(--young-gold))]" />
                  Pinned questions
                </p>
                {allQuestions.pinned.map((question, index) => (
                  <div key={`pinned-${index}`} className="flex items-center gap-1">
                    <button
                      onClick={() => handleSuggestedQuestion(question)}
                      className={cn(
                        "flex-1 text-left px-3 py-2.5 rounded-lg text-sm transition-colors border",
                        selectedSuggestionIndex === index
                          ? "bg-[hsl(var(--young-gold))]/20 border-[hsl(var(--young-gold))]"
                          : "bg-[hsl(var(--young-gold))]/10 hover:bg-[hsl(var(--young-gold))]/20 border-transparent"
                      )}
                    >
                      {question}
                    </button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => togglePin(question, true)}>
                      <StarOff className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Suggested Questions */}
            <div className="w-full space-y-2">
              <p className="text-xs font-medium text-muted-foreground mb-2">Suggested questions</p>
              {allQuestions.suggested.map((question, index) => {
                const actualIndex = allQuestions.pinned.length + index;
                return (
                  <div key={index} className="flex items-center gap-1">
                    <button
                      onClick={() => handleSuggestedQuestion(question)}
                      className={cn(
                        "flex-1 text-left px-3 py-2.5 rounded-lg text-sm transition-colors border",
                        selectedSuggestionIndex === actualIndex
                          ? "bg-primary/10 border-primary"
                          : "bg-muted/50 hover:bg-muted border-transparent hover:border-border",
                        isMobile && "py-3"
                      )}
                    >
                      {question}
                    </button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => togglePin(question, false)}>
                      <Star className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </div>
                );
              })}
            </div>

            {!isMobile && (
              <p className="text-xs text-muted-foreground mt-4 text-center">
                Use ⌘J to toggle • ↑↓ to navigate
              </p>
            )}
          </div>
        ) : (
          <>
            <AIAssistantChat 
              messages={messages} 
              isLoading={isLoading}
              jobEditorContext={jobEditorContext}
            />
            
            {/* Follow-up Suggestions */}
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

      {/* Error Retry */}
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

      {/* Input */}
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
            placeholder="Ask about job descriptions, requirements..."
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
              "flex-shrink-0",
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
    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
      <Sparkles className="w-4 h-4 text-primary-foreground" />
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
              "bg-primary hover:bg-primary/90 text-primary-foreground",
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
                  <p className="text-xs text-muted-foreground">Job Creation Assistant</p>
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
          "fixed bottom-6 right-6 z-40 rounded-full shadow-lg",
          "bg-primary hover:bg-primary/90 text-primary-foreground",
          "transition-transform hover:scale-105",
          "h-14 w-14",
          isOpen && "opacity-0 pointer-events-none"
        )}
      >
        <Sparkles className="h-6 w-6" />
      </Button>

      <FloatingPanel
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        title="Young AI"
        subtitle="⌘J to toggle"
        headerIcon={headerIcon}
        headerActions={headerActions}
        storageKey="job-editor-ai-panel"
      >
        {panelContent}
      </FloatingPanel>
    </>
  );
};
