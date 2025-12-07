import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Send, Trash2, X } from 'lucide-react';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import { AIAssistantChat } from './AIAssistantChat';
import { cn } from '@/lib/utils';

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
  const { messages, isLoading, sendMessage, clearConversation } = useAIAssistant();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea when sheet opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = async (message?: string) => {
    const content = message || input;
    if (!content.trim() || isLoading) return;
    
    setInput('');
    await sendMessage(content);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    handleSubmit(question);
  };

  return (
    <>
      {/* Floating Action Button */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            size="lg"
            className={cn(
              "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg",
              "bg-primary hover:bg-primary/90 text-primary-foreground",
              "transition-transform hover:scale-105"
            )}
          >
            <Sparkles className="h-6 w-6" />
          </Button>
        </SheetTrigger>

        <SheetContent 
          side="right" 
          className="w-[400px] sm:w-[440px] p-0 flex flex-col bg-background"
        >
          {/* Header */}
          <SheetHeader className="px-4 py-3 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary-foreground" />
                </div>
                <SheetTitle className="text-lg font-semibold">AI Assistant</SheetTitle>
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
              <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-primary" />
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
                        "bg-muted/50 hover:bg-muted transition-colors",
                        "border border-transparent hover:border-border"
                      )}
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <AIAssistantChat messages={messages} isLoading={isLoading} />
            )}
          </div>

          {/* Input Area */}
          <div className="flex-shrink-0 p-4 border-t bg-background">
            <div className="flex gap-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about candidates, analytics..."
                className="min-h-[44px] max-h-[120px] resize-none"
                disabled={isLoading}
              />
              <Button
                size="icon"
                onClick={() => handleSubmit()}
                disabled={!input.trim() || isLoading}
                className="h-11 w-11 flex-shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
