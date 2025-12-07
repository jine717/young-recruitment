import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { FloatingPanel } from '@/components/ui/floating-panel';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Send, Trash2, RefreshCw, Star, StarOff, User } from 'lucide-react';
import { useAIAssistant, CandidateContext } from '@/hooks/useAIAssistant';
import { AIAssistantChat } from '../recruiter/AIAssistantChat';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

interface CandidateAIAssistantProps {
  candidateContext: CandidateContext;
}

export const CandidateAIAssistant = ({ candidateContext }: CandidateAIAssistantProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  
  // Use a unique session key for each candidate
  const sessionKey = `ai-assistant-candidate-${candidateContext.id}`;
  
  const { 
    messages, 
    isLoading, 
    error, 
    sendMessage, 
    clearConversation,
    pinnedQuestions,
    pinQuestion,
    unpinQuestion,
  } = useAIAssistant({ candidateContext, sessionKey });
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Generate candidate-specific suggested questions
  const suggestedQuestions = useMemo(() => {
    const name = candidateContext.name;
    const questions = [
      `What are ${name}'s key strengths for this role?`,
      `How does ${name}'s experience align with the job requirements?`,
      `What interview questions should I ask ${name}?`,
      `Summarize ${name}'s profile and qualifications`,
      `What concerns should I explore with ${name}?`,
    ];
    
    // Add DISC-specific question if available
    if (candidateContext.discProfile) {
      questions.splice(3, 0, `How does ${name}'s ${candidateContext.discProfile} DISC profile affect team fit?`);
    }
    
    return questions.slice(0, 5);
  }, [candidateContext]);

  // Combine pinned and suggested questions
  const allQuestions = useMemo(() => {
    // Filter pinned questions relevant to this candidate context
    const relevantPinned = pinnedQuestions.filter(q => 
      q.includes(candidateContext.name) || !q.includes("'s")
    );
    return { pinned: relevantPinned, suggested: suggestedQuestions };
  }, [pinnedQuestions, suggestedQuestions, candidateContext.name]);

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
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

  // Get last message's follow-up suggestions
  const lastMessage = messages[messages.length - 1];
  const followUpSuggestions = lastMessage?.role === 'assistant' && !lastMessage.isStreaming
    ? lastMessage.followUpSuggestions || []
    : [];

  // Panel content (shared between mobile sheet and desktop floating panel)
  const panelContent = (
    <>
      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {messages.length === 0 ? (
          /* Empty State with Candidate Context and Questions */
          <div className="flex-1 flex flex-col px-4 sm:px-6 py-4 sm:py-6 overflow-y-auto">
            {/* Candidate Quick Info */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border mb-4">
              <div className="w-10 h-10 rounded-full bg-[hsl(var(--young-gold))]/20 flex items-center justify-center">
                <User className="w-5 h-5 text-[hsl(var(--young-gold))]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{candidateContext.name}</p>
                <p className="text-xs text-muted-foreground truncate">{candidateContext.jobTitle}</p>
              </div>
              {candidateContext.aiScore && (
                <div className="flex-shrink-0 px-2 py-1 rounded-full bg-[hsl(var(--young-blue))]/20 text-[hsl(var(--young-blue))] text-sm font-semibold">
                  {candidateContext.aiScore}
                </div>
              )}
            </div>

            {/* Welcome Message */}
            <div className="flex flex-col items-center justify-center py-2">
              <h3 className="text-base font-semibold mb-1">Ask about this candidate</h3>
              <p className="text-xs text-muted-foreground text-center mb-4">
                Get AI-powered insights about {candidateContext.name}
              </p>
            </div>

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
                        "flex-1 text-left px-3 py-2.5 rounded-lg text-sm",
                        "transition-colors border",
                        selectedSuggestionIndex === index
                          ? "bg-[hsl(var(--young-gold))]/20 border-[hsl(var(--young-gold))]"
                          : "bg-[hsl(var(--young-gold))]/10 hover:bg-[hsl(var(--young-gold))]/20 border-transparent hover:border-[hsl(var(--young-gold))]/50"
                      )}
                    >
                      {question}
                    </button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={() => togglePin(question, true)}
                    >
                      <StarOff className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Suggested Questions */}
            <div className="w-full space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Suggested questions</p>
              {allQuestions.suggested.map((question, index) => {
                const actualIndex = allQuestions.pinned.length + index;
                const isPinned = pinnedQuestions.includes(question);
                
                return (
                  <div key={`suggested-${index}`} className="flex items-center gap-1">
                    <button
                      onClick={() => handleSuggestedQuestion(question)}
                      className={cn(
                        "flex-1 text-left px-3 py-2.5 rounded-lg text-sm",
                        "transition-colors border",
                        selectedSuggestionIndex === actualIndex
                          ? "bg-primary/10 border-primary"
                          : "bg-muted/50 hover:bg-muted border-transparent hover:border-border"
                      )}
                    >
                      {question}
                    </button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={() => togglePin(question, isPinned)}
                    >
                      {isPinned ? (
                        <Star className="w-4 h-4 text-[hsl(var(--young-gold))] fill-[hsl(var(--young-gold))]" />
                      ) : (
                        <Star className="w-4 h-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                );
              })}
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

      {/* Error Retry Button */}
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

      {/* Input Area */}
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
            placeholder={`Ask about ${candidateContext.name}...`}
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

  // Header icon for panel
  const headerIcon = (
    <div className="w-8 h-8 rounded-full bg-[hsl(var(--young-blue))] flex items-center justify-center">
      <Sparkles className="w-4 h-4 text-[hsl(var(--young-black))]" />
    </div>
  );

  // Header actions for panel
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

  // Mobile: Use Sheet (full-screen)
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
                    About {candidateContext.name}
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

  // Desktop: Use FloatingPanel (draggable, no overlay)
  return (
    <>
      {/* FAB Trigger */}
      <Button
        size="lg"
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-40 rounded-full shadow-lg",
          "bg-[hsl(var(--young-blue))] hover:bg-[hsl(var(--young-blue))]/90 text-[hsl(var(--young-black))]",
          "transition-transform hover:scale-105",
          "h-14 w-14",
          isOpen && "opacity-0 pointer-events-none"
        )}
      >
        <Sparkles className="h-6 w-6" />
      </Button>

      {/* Floating Panel */}
      <FloatingPanel
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        title="Young AI"
        subtitle={`About ${candidateContext.name}`}
        headerIcon={headerIcon}
        headerActions={headerActions}
        storageKey={`young-ai-candidate-${candidateContext.id}`}
      >
        {panelContent}
      </FloatingPanel>
    </>
  );
};
