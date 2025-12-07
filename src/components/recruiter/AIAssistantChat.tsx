import { useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Message } from '@/hooks/useAIAssistant';

interface AIAssistantChatProps {
  messages: Message[];
  isLoading: boolean;
}

export const AIAssistantChat = ({ messages, isLoading }: AIAssistantChatProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

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
    <ScrollArea className="flex-1 px-4" ref={scrollRef}>
      <div className="space-y-4 py-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex gap-3',
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            {message.role === 'assistant' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
            
            <div
              className={cn(
                'max-w-[80%] rounded-2xl px-4 py-3 text-sm',
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border text-foreground'
              )}
            >
              <div className="whitespace-pre-wrap break-words">
                {message.content}
                {message.isStreaming && (
                  <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
                )}
              </div>
            </div>

            {message.role === 'user' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground animate-pulse" />
            </div>
            <div className="bg-card border border-border rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};
