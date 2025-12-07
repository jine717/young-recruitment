import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ComparisonResult } from '@/hooks/useCandidateComparison';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  followUpSuggestions?: string[];
}

export interface ComparisonContext {
  jobTitle: string;
  jobId?: string;
  candidateCount: number;
  result: ComparisonResult;
}

interface UseComparisonAIAssistantOptions {
  comparisonContext: ComparisonContext;
}

interface UseComparisonAIAssistantReturn {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearConversation: () => void;
}

const SESSION_KEY_PREFIX = 'ai-assistant-comparison-';

const serializeMessages = (messages: Message[]): string => {
  return JSON.stringify(messages.map(m => ({
    ...m,
    timestamp: m.timestamp.toISOString(),
  })));
};

const deserializeMessages = (data: string): Message[] => {
  try {
    const parsed = JSON.parse(data);
    return parsed.map((m: any) => ({
      ...m,
      timestamp: new Date(m.timestamp),
      isStreaming: false,
    }));
  } catch {
    return [];
  }
};

export const useComparisonAIAssistant = (options: UseComparisonAIAssistantOptions): UseComparisonAIAssistantReturn => {
  const { comparisonContext } = options;
  const sessionKey = `${SESSION_KEY_PREFIX}${comparisonContext.jobId || 'default'}`;

  const [messages, setMessages] = useState<Message[]>(() => {
    const stored = sessionStorage.getItem(sessionKey);
    return stored ? deserializeMessages(stored) : [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem(sessionKey, serializeMessages(messages));
    }
  }, [messages, sessionKey]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    setError(null);
    setIsLoading(true);

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    const assistantMessageId = crypto.randomUUID();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages(prev => [...prev, userMessage, assistantMessage]);

    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const conversationHistory = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content,
      }));

      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            question: content.trim(),
            conversationHistory,
            comparisonContext,
          }),
          signal: abortControllerRef.current.signal,
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait a moment and try again.');
        }
        if (response.status === 402) {
          throw new Error('AI usage limit reached. Please try again later.');
        }
        throw new Error(`Request failed: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullContent += content;
                setMessages(prev => 
                  prev.map(m => 
                    m.id === assistantMessageId
                      ? { ...m, content: fullContent }
                      : m
                  )
                );
              }
            } catch {
              // Ignore incomplete JSON chunks
            }
          }
        }
      }

      // Generate follow-up suggestions
      const followUpSuggestions = generateComparisonFollowUps(content, fullContent, comparisonContext);

      setMessages(prev => 
        prev.map(m => 
          m.id === assistantMessageId
            ? { ...m, isStreaming: false, followUpSuggestions }
            : m
        )
      );

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      
      setMessages(prev => 
        prev.map(m => 
          m.id === assistantMessageId
            ? { ...m, content: `Sorry, I encountered an error: ${errorMessage}`, isStreaming: false }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, comparisonContext]);

  const clearConversation = useCallback(() => {
    setMessages([]);
    setError(null);
    sessionStorage.removeItem(sessionKey);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, [sessionKey]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearConversation,
  };
};

function generateComparisonFollowUps(
  userQuestion: string,
  aiResponse: string,
  comparisonContext: ComparisonContext
): string[] {
  const suggestions: string[] = [];
  const questionLower = userQuestion.toLowerCase();
  const responseLower = aiResponse.toLowerCase();
  const topCandidate = comparisonContext.result.recommendation.top_choice;

  if (questionLower.includes('why') || questionLower.includes('reason')) {
    suggestions.push(`What specific evidence supports choosing ${topCandidate}?`);
  }
  
  if (questionLower.includes('score') || responseLower.includes('score')) {
    suggestions.push('Break down how each candidate scored on different criteria');
  }
  
  if (questionLower.includes('risk') || responseLower.includes('risk')) {
    suggestions.push(`How can we mitigate the risks identified for ${topCandidate}?`);
  }
  
  if (questionLower.includes('interview') || responseLower.includes('interview')) {
    suggestions.push('What interview questions would differentiate these candidates further?');
  }
  
  if (questionLower.includes('business case') || responseLower.includes('business case')) {
    suggestions.push('Compare their problem-solving approaches in detail');
  }

  // Default suggestions based on comparison context
  if (suggestions.length === 0) {
    suggestions.push(`Why did ${topCandidate} rank higher than the others?`);
    suggestions.push('What are the key trade-offs between the top candidates?');
  }

  if (comparisonContext.result.recommendation.alternative && 
      comparisonContext.result.recommendation.alternative !== 'None') {
    suggestions.push(`When would ${comparisonContext.result.recommendation.alternative} be a better choice?`);
  }

  return suggestions.slice(0, 3);
}
