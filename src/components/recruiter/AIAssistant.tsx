import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Send, Trash2, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import { useAIAssistantInsights } from '@/hooks/useAIAssistantInsights';
import { useApplications } from '@/hooks/useApplications';
import { AIAssistantChat } from './AIAssistantChat';
import { QuickInsightsCard } from './QuickInsightsCard';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [insightsOpen, setInsightsOpen] = useState(true);
  const { messages, isLoading, error, sendMessage, clearConversation } = useAIAssistant();
  const { data: insights, isLoading: insightsLoading } = useAIAssistantInsights();
  const { data: applications } = useApplications();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Build candidate map for quick actions
  const candidateMap = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    applications?.forEach(app => {
      const name = app.candidate_name || app.profiles?.full_name;
      if (name) {
        map.set(app.id, { id: app.id, name });
      }
    });
    return map;
  }, [applications]);

  // Get dynamic suggested questions
  const suggestedQuestions = insights?.suggestedQuestions || [
    "Who are the top candidates with highest AI scores?",
    "What's the current pipeline status?",
    "Which candidates should I prioritize interviewing?",
    "Compare interview conversion rates across jobs",
    "Who has strong leadership experience?",
  ];

  // Focus textarea when sheet opens
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

  // Global keyboard shortcut: Ctrl/Cmd + K to toggle
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

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            size="lg"
            className={cn(
              "fixed bottom-6 right-6 z-50 rounded-full shadow-lg",
              "bg-primary hover:bg-primary/90 text-primary-foreground",
              "transition-transform hover:scale-105",
              isMobile ? "h-16 w-16" : "h-14 w-14"
            )}
          >
            <Sparkles className={cn(isMobile ? "h-7 w-7" : "h-6 w-6")} />
          </Button>
        </SheetTrigger>

        <SheetContent 
          side="right" 
          className={cn(
            "p-0 flex flex-col bg-background",
            isMobile ? "w-full sm:w-full" : "w-[400px] sm:w-[440px]"
          )}
        >
          {/* Header */}
          <SheetHeader className="px-4 py-3 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <SheetTitle className="text-lg font-semibold">AI Assistant</SheetTitle>
                  {!isMobile && (
                    <p className="text-xs text-muted-foreground">⌘K to toggle</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={clearConversation}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </SheetHeader>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col min-h-0">
            {messages.length === 0 ? (
              /* Empty State with Quick Insights and Suggested Questions */
              <div className="flex-1 flex flex-col px-4 sm:px-6 py-4 sm:py-6 overflow-y-auto">
                {/* Quick Insights Card */}
                <Collapsible open={insightsOpen} onOpenChange={setInsightsOpen} className="mb-4">
                  <CollapsibleTrigger asChild>
                    <button className="flex items-center justify-between w-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-2">
                      <span>Quick Insights</span>
                      {insightsOpen ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <QuickInsightsCard 
                      insights={insights} 
                      isLoading={insightsLoading} 
                      isMobile={isMobile} 
                    />
                  </CollapsibleContent>
                </Collapsible>

                {/* Welcome Message */}
                <div className="flex flex-col items-center justify-center py-4">
                  <div className={cn(
                    "rounded-full bg-primary/10 flex items-center justify-center mb-3",
                    isMobile ? "w-12 h-12" : "w-14 h-14"
                  )}>
                    <Sparkles className={cn("text-primary", isMobile ? "w-6 h-6" : "w-7 h-7")} />
                  </div>
                  <h3 className="text-base font-semibold mb-1">How can I help?</h3>
                  <p className="text-xs text-muted-foreground text-center mb-4">
                    Ask about candidates, pipeline, or analytics
                  </p>
                </div>

                {/* Dynamic Suggested Questions */}
                <div className="w-full space-y-2">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Suggested questions</p>
                  {suggestedQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestedQuestion(question)}
                      className={cn(
                        "w-full text-left px-3 py-2.5 rounded-lg text-sm",
                        "transition-colors",
                        "border",
                        selectedSuggestionIndex === index
                          ? "bg-primary/10 border-primary"
                          : "bg-muted/50 hover:bg-muted border-transparent hover:border-border",
                        isMobile && "py-3"
                      )}
                    >
                      {question}
                    </button>
                  ))}
                </div>

                {/* Top Candidates Quick Access */}
                {insights?.topCandidates && insights.topCandidates.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Top candidates</p>
                    <div className="space-y-1.5">
                      {insights.topCandidates.slice(0, 3).map((candidate) => (
                        <button
                          key={candidate.id}
                          onClick={() => handleSuggestedQuestion(`Tell me about ${candidate.name}'s profile and qualifications`)}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-muted/30 hover:bg-muted transition-colors text-left"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{candidate.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{candidate.jobTitle}</p>
                          </div>
                          <div className="flex-shrink-0 ml-2 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                            {candidate.score}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {!isMobile && (
                  <p className="text-xs text-muted-foreground mt-4 text-center">
                    Use ↑↓ arrows to navigate, Enter to select
                  </p>
                )}
              </div>
            ) : (
              <AIAssistantChat 
                messages={messages} 
                isLoading={isLoading} 
                candidateMap={candidateMap}
              />
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
                placeholder="Ask about candidates, analytics..."
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
        </SheetContent>
      </Sheet>
    </>
  );
};
