import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  followUpSuggestions?: string[];
}

// Job Editor Context for AI-assisted job creation
export interface JobEditorContext {
  // Current form state
  title?: string;
  location?: string;
  type?: string;
  department?: string;
  description?: string;
  responsibilities?: string[];
  requirements?: string[];
  benefits?: string[];
  tags?: string[];
  businessCaseQuestions?: { title: string; description: string }[];
  fixedInterviewQuestions?: { text: string; category: string }[];
  aiSystemPrompt?: string;
  aiInterviewPrompt?: string;
  
  // Mode
  isEditing: boolean;
  
  // Insert callbacks for direct content insertion
  onInsertTitle?: (title: string) => void;
  onInsertLocation?: (location: string) => void;
  onInsertJobType?: (type: string) => void;
  onInsertDescription?: (text: string) => void;
  onInsertResponsibilities?: (items: string[]) => void;
  onInsertRequirements?: (items: string[]) => void;
  onInsertBenefits?: (items: string[]) => void;
  onInsertTags?: (items: string[]) => void;
  onInsertAIPrompt?: (prompt: string) => void;
  onInsertInterviewPrompt?: (prompt: string) => void;
  onInsertBusinessCaseQuestions?: (questions: { title: string; description: string }[]) => void;
  onInsertFixedInterviewQuestions?: (questions: { text: string; category: string }[]) => void;
}

export interface CandidateContext {
  // Basic info
  id: string;
  name: string;
  email?: string;
  jobTitle: string;
  jobId: string;
  status: string;
  appliedAt?: string;
  
  // AI Evaluation
  aiScore?: number | null;
  recommendation?: string | null;
  strengths?: string[];
  concerns?: string[];
  evaluationSummary?: string;
  skillsMatchScore?: number | null;
  communicationScore?: number | null;
  culturalFitScore?: number | null;
  evaluationStage?: string;
  initialScore?: number | null;
  
  // Full CV Analysis
  cvAnalysis?: {
    summary?: string;
    experienceYears?: number;
    keySkills?: string[];
    education?: { degree: string; institution: string; year?: string }[];
    workHistory?: { company: string; role: string; duration?: string }[];
    strengths?: string[];
    redFlags?: string[];
    overallImpression?: string;
  };
  
  // Full DISC Analysis
  discAnalysis?: {
    profileType?: string;
    profileDescription?: string;
    dominantTraits?: string[];
    communicationStyle?: string;
    workStyle?: string;
    managementTips?: string;
    potentialChallenges?: string[];
    teamFitConsiderations?: string;
  };
  
  // Business Case Responses
  businessCaseResponses?: {
    questionTitle: string;
    questionDescription: string;
    response: string;
  }[];
  
  // Interview Questions (AI-generated)
  interviewQuestions?: {
    question: string;
    category: string;
    reasoning?: string;
    recruiterNote?: string;
  }[];
  
  // Fixed Interview Questions with Notes
  fixedQuestionNotes?: {
    question: string;
    category: string;
    note?: string;
  }[];
  
  // Interview Evaluation
  interviewEvaluation?: {
    overallImpression?: string;
    strengths?: string[];
    areasForImprovement?: string[];
    technicalScore?: number;
    communicationScore?: number;
    culturalFitScore?: number;
    problemSolvingScore?: number;
    recommendation?: string;
  };
  
  // Interview Analysis (post-interview AI analysis)
  interviewAnalysis?: {
    summary?: string;
    performanceAssessment?: string;
    strengthsIdentified?: string[];
    concernsIdentified?: string[];
    scoreChangeExplanation?: string;
  };
  
  // Recruiter Notes
  recruiterNotes?: {
    note: string;
    createdAt: string;
  }[];
  
  // Scheduled Interviews
  scheduledInterviews?: {
    date: string;
    type: string;
    status: string;
  }[];
  
  // Hiring Decisions
  hiringDecisions?: {
    decision: string;
    reasoning: string;
    createdAt: string;
  }[];
}

interface UseAIAssistantOptions {
  candidateContext?: CandidateContext;
  jobEditorContext?: JobEditorContext;
  sessionKey?: string;
}

interface UseAIAssistantReturn {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearConversation: () => void;
  pinnedQuestions: string[];
  pinQuestion: (question: string) => void;
  unpinQuestion: (question: string) => void;
}

const DEFAULT_SESSION_KEY = 'ai-assistant-messages';
const PINNED_QUESTIONS_KEY = 'ai-assistant-pinned-questions';
const MAX_PINNED_QUESTIONS = 8;

// Helper to serialize/deserialize messages with Date objects
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
      isStreaming: false, // Never restore streaming state
    }));
  } catch {
    return [];
  }
};

export const useAIAssistant = (options?: UseAIAssistantOptions): UseAIAssistantReturn => {
  const sessionKey = options?.sessionKey || DEFAULT_SESSION_KEY;
  const candidateContext = options?.candidateContext;
  const jobEditorContext = options?.jobEditorContext;

  const [messages, setMessages] = useState<Message[]>(() => {
    // Restore messages from session storage on init
    const stored = sessionStorage.getItem(sessionKey);
    return stored ? deserializeMessages(stored) : [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pinnedQuestions, setPinnedQuestions] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(PINNED_QUESTIONS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const abortControllerRef = useRef<AbortController | null>(null);

  // Persist messages to session storage
  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem(sessionKey, serializeMessages(messages));
    }
  }, [messages, sessionKey]);

  // Persist pinned questions to localStorage
  useEffect(() => {
    localStorage.setItem(PINNED_QUESTIONS_KEY, JSON.stringify(pinnedQuestions));
  }, [pinnedQuestions]);

  const pinQuestion = useCallback((question: string) => {
    setPinnedQuestions(prev => {
      if (prev.includes(question) || prev.length >= MAX_PINNED_QUESTIONS) return prev;
      return [...prev, question];
    });
  }, []);

  const unpinQuestion = useCallback((question: string) => {
    setPinnedQuestions(prev => prev.filter(q => q !== question));
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    setError(null);
    setIsLoading(true);

    // Add user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    // Add placeholder assistant message for streaming
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
      // Cancel any previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      // Get conversation history (last 10 messages for context)
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
            candidateContext,
            jobEditorContext: jobEditorContext ? {
              title: jobEditorContext.title,
              location: jobEditorContext.location,
              type: jobEditorContext.type,
              department: jobEditorContext.department,
              description: jobEditorContext.description,
              responsibilities: jobEditorContext.responsibilities,
              requirements: jobEditorContext.requirements,
              benefits: jobEditorContext.benefits,
              tags: jobEditorContext.tags,
              businessCaseQuestions: jobEditorContext.businessCaseQuestions,
              fixedInterviewQuestions: jobEditorContext.fixedInterviewQuestions,
              aiSystemPrompt: jobEditorContext.aiSystemPrompt,
              aiInterviewPrompt: jobEditorContext.aiInterviewPrompt,
              isEditing: jobEditorContext.isEditing,
            } : undefined,
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

      // Handle streaming response
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
              // OpenAI-compatible format: choices[0].delta.content
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

      // Generate follow-up suggestions based on the response
      const followUpSuggestions = generateFollowUpSuggestions(content, fullContent, candidateContext, jobEditorContext);

      // Mark streaming as complete and add follow-up suggestions
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
      
      // Update assistant message with error
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
  }, [messages, isLoading, candidateContext, jobEditorContext]);

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
    pinnedQuestions,
    pinQuestion,
    unpinQuestion,
  };
};

// Generate contextual follow-up suggestions
function generateFollowUpSuggestions(
  userQuestion: string,
  aiResponse: string,
  candidateContext?: CandidateContext,
  jobEditorContext?: JobEditorContext
): string[] {
  const suggestions: string[] = [];
  const questionLower = userQuestion.toLowerCase();
  const responseLower = aiResponse.toLowerCase();

  // Job Editor context suggestions - WORKFLOW AWARE
  if (jobEditorContext) {
    const hasTitle = !!jobEditorContext.title?.trim();
    const hasDescription = !!jobEditorContext.description?.trim();
    const responsibilitiesCount = jobEditorContext.responsibilities?.filter(r => r.trim()).length || 0;
    const requirementsCount = jobEditorContext.requirements?.filter(r => r.trim()).length || 0;
    const benefitsCount = jobEditorContext.benefits?.filter(b => b.trim()).length || 0;
    
    // PRIORITY 1: If essential fields are missing, prioritize those
    if (!hasTitle) {
      // Check if AI just suggested a title
      if (responseLower.includes('[insertable:title]') || responseLower.includes('title')) {
        suggestions.push('Click "Insert Title" above to add it');
        suggestions.push('Suggest a different title');
      } else {
        suggestions.push('Suggest a job title');
      }
      return suggestions.slice(0, 2);
    }
    
    if (!hasDescription) {
      // Check if AI just suggested a description
      if (responseLower.includes('[insertable:description]') || responseLower.includes('description')) {
        suggestions.push('Click "Insert Description" above to add it');
        suggestions.push('Make this description more engaging');
      } else {
        suggestions.push('Write a job description');
      }
      return suggestions.slice(0, 2);
    }
    
    // PRIORITY 2: Now we can suggest next sections
    if (responsibilitiesCount < 3) {
      suggestions.push('Suggest responsibilities for this role');
    }
    if (requirementsCount < 3) {
      suggestions.push('What requirements should I include?');
    }
    if (benefitsCount < 2) {
      suggestions.push('Suggest attractive benefits');
    }
    
    // Context-specific suggestions
    if (questionLower.includes('responsibilit') || responseLower.includes('responsibilit')) {
      suggestions.push('Make these responsibilities more specific');
    }
    if (questionLower.includes('requirement') || responseLower.includes('requirement')) {
      suggestions.push('Differentiate must-haves vs nice-to-haves');
    }
    if (questionLower.includes('benefit') || responseLower.includes('benefit')) {
      suggestions.push('Suggest competitive benefits');
    }
    
    if (suggestions.length === 0) {
      suggestions.push('Review my job posting and suggest improvements');
      suggestions.push('Help me write compelling requirements');
    }
    return suggestions.slice(0, 3);
  }

  if (candidateContext) {
    // Candidate-specific follow-ups
    if (questionLower.includes('strength') || responseLower.includes('strength')) {
      suggestions.push(`What are ${candidateContext.name}'s areas for improvement?`);
    }
    if (questionLower.includes('concern') || questionLower.includes('weakness') || responseLower.includes('concern')) {
      suggestions.push(`How can we address these concerns in the interview?`);
    }
    if (questionLower.includes('experience') || responseLower.includes('experience')) {
      suggestions.push(`What interview questions would assess ${candidateContext.name}'s experience?`);
    }
    if (questionLower.includes('fit') || responseLower.includes('cultural fit')) {
      suggestions.push(`How does ${candidateContext.name} compare to other candidates?`);
    }
    if (questionLower.includes('interview') || responseLower.includes('interview')) {
      suggestions.push(`What red flags should I watch for with ${candidateContext.name}?`);
    }
    if (questionLower.includes('score') || responseLower.includes('score')) {
      suggestions.push(`Break down the scoring criteria for ${candidateContext.name}`);
    }
    // Default candidate follow-ups
    if (suggestions.length === 0) {
      suggestions.push(`What makes ${candidateContext.name} stand out?`);
      suggestions.push(`Suggest interview questions for ${candidateContext.name}`);
    }
  } else {
    // General follow-ups
    if (questionLower.includes('top') || questionLower.includes('best')) {
      suggestions.push('Compare these top candidates in detail');
      suggestions.push('What interview questions should I prioritize?');
    }
    if (questionLower.includes('pipeline') || questionLower.includes('status')) {
      suggestions.push('Which candidates need immediate attention?');
      suggestions.push('Show conversion rates by stage');
    }
    if (questionLower.includes('analytics') || questionLower.includes('metrics')) {
      suggestions.push('What can we improve in our hiring process?');
      suggestions.push('Which job has the best candidates?');
    }
    if (questionLower.includes('interview')) {
      suggestions.push('Who should I interview next?');
      suggestions.push('Show upcoming interview schedule');
    }
    // Default general follow-ups
    if (suggestions.length === 0) {
      suggestions.push('Tell me more about the top candidates');
      suggestions.push('What actions should I prioritize today?');
    }
  }

  // Return max 3 suggestions
  return suggestions.slice(0, 3);
}
