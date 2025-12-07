import { useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Message } from '@/hooks/useAIAssistant';

interface AIAssistantChatProps {
  messages: Message[];
  isLoading: boolean;
}

export const AIAssistantChat = ({ messages, isLoading }: AIAssistantChatProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0) {
    return null;
  }

  return (
    <ScrollArea className={cn("flex-1", isMobile ? "px-3" : "px-4")} ref={scrollRef}>
      <div className="space-y-4 py-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex gap-2 sm:gap-3',
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            {message.role === 'assistant' && (
              <div className={cn(
                "flex-shrink-0 rounded-full bg-primary flex items-center justify-center",
                isMobile ? "w-7 h-7" : "w-8 h-8"
              )}>
                <Sparkles className={cn("text-primary-foreground", isMobile ? "w-3.5 h-3.5" : "w-4 h-4")} />
              </div>
            )}
            
            <div
              className={cn(
                'rounded-2xl px-4 py-3',
                // Mobile: allow more width for messages
                isMobile ? 'max-w-[85%] text-sm' : 'max-w-[80%] text-sm',
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border text-foreground'
              )}
            >
              {message.role === 'assistant' ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown
                    components={{
                      // Style headings
                      h1: ({ children }) => <h1 className="text-base font-bold mt-3 mb-2 first:mt-0">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-sm font-bold mt-3 mb-1.5 first:mt-0">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-1 first:mt-0">{children}</h3>,
                      // Style paragraphs
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                      // Style lists
                      ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                      li: ({ children }) => <li className="text-sm">{children}</li>,
                      // Style bold/italic
                      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                      em: ({ children }) => <em className="italic">{children}</em>,
                      // Style code
                      code: ({ children }) => (
                        <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>
                      ),
                      // Style links
                      a: ({ href, children }) => (
                        <a href={href} className="text-primary underline hover:no-underline" target="_blank" rel="noopener noreferrer">
                          {children}
                        </a>
                      ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                  {message.isStreaming && (
                    <span className="inline-block w-1.5 h-4 ml-0.5 bg-primary animate-pulse rounded-sm" />
                  )}
                </div>
              ) : (
                <div className="whitespace-pre-wrap break-words">
                  {message.content}
                </div>
              )}
            </div>

            {message.role === 'user' && (
              <div className={cn(
                "flex-shrink-0 rounded-full bg-muted flex items-center justify-center",
                isMobile ? "w-7 h-7" : "w-8 h-8"
              )}>
                <User className={cn("text-muted-foreground", isMobile ? "w-3.5 h-3.5" : "w-4 h-4")} />
              </div>
            )}
          </div>
        ))}

        {/* Enhanced typing indicator */}
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex gap-2 sm:gap-3 justify-start">
            <div className={cn(
              "flex-shrink-0 rounded-full bg-primary flex items-center justify-center",
              isMobile ? "w-7 h-7" : "w-8 h-8"
            )}>
              <Sparkles className={cn("text-primary-foreground animate-pulse", isMobile ? "w-3.5 h-3.5" : "w-4 h-4")} />
            </div>
            <div className="bg-card border border-border rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">AI is thinking</span>
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};
