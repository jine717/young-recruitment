import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Send, Trash2, RefreshCw } from 'lucide-react';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import { AIAssistantChat } from './AIAssistantChat';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

const SUGGESTED_QUESTIONS = [
  "Who are the top candidates with highest AI scores?",
  "What's the current pipeline status?",
  "Which candidates should I prioritize interviewing?",
  "Compare interview conversion rates across jobs",
  "Who has strong leadership experience?",
];

export const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const { messages, isLoading, error, sendMessage, clearConversation } = useAIAssistant();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

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
      // Escape to close
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
    
    // Clear last failed message on success
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
    // Submit on Enter (without Shift) or Ctrl/Cmd + Enter
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (messages.length === 0 && selectedSuggestionIndex >= 0) {
        handleSubmit(SUGGESTED_QUESTIONS[selectedSuggestionIndex]);
      } else {
        handleSubmit();
      }
      return;
    }

    // Arrow key navigation for suggestions (only in empty state)
    if (messages.length === 0 && !input.trim()) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < SUGGESTED_QUESTIONS.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : SUGGESTED_QUESTIONS.length - 1
        );
      }
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    handleSubmit(question);
  };

  // Check if the last message is an error message
  const hasError = error && messages.length > 0 && 
    messages[messages.length - 1]?.content?.includes('Sorry, I encountered an error');

  return (
    <>
      {/* Floating Action Button */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            size="lg"
            className={cn(
              "fixed bottom-6 right-6 z-50 rounded-full shadow-lg",
              "bg-primary hover:bg-primary/90 text-primary-foreground",
              "transition-transform hover:scale-105",
              // Mobile: larger touch target
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
            // Mobile: full width, Desktop: fixed width
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
              /* Empty State with Suggested Questions */
              <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-6 sm:py-8">
                <div className={cn(
                  "rounded-full bg-primary/10 flex items-center justify-center mb-4",
                  isMobile ? "w-14 h-14" : "w-16 h-16"
                )}>
                  <Sparkles className={cn("text-primary", isMobile ? "w-7 h-7" : "w-8 h-8")} />
                </div>
                <h3 className="text-lg font-semibold mb-2">How can I help?</h3>
                <p className="text-sm text-muted-foreground text-center mb-6">
                  Ask me about candidates, pipeline status, analytics, or get recommendations.
                </p>
                <div className="w-full space-y-2">
                  {SUGGESTED_QUESTIONS.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestedQuestion(question)}
                      className={cn(
                        "w-full text-left px-4 py-3 rounded-lg text-sm",
                        "transition-colors",
                        "border",
                        // Highlight selected suggestion (keyboard nav)
                        selectedSuggestionIndex === index
                          ? "bg-primary/10 border-primary"
                          : "bg-muted/50 hover:bg-muted border-transparent hover:border-border",
                        // Mobile: larger touch target
                        isMobile && "py-4"
                      )}
                    >
                      {question}
                    </button>
                  ))}
                </div>
                {!isMobile && (
                  <p className="text-xs text-muted-foreground mt-4">
                    Use ↑↓ arrows to navigate, Enter to select
                  </p>
                )}
              </div>
            ) : (
              <AIAssistantChat messages={messages} isLoading={isLoading} />
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
