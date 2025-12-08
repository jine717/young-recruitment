import { useRef, useEffect, useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, User, ExternalLink, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import type { Message, JobEditorContext } from '@/hooks/useAIAssistant';
import { useToast } from '@/hooks/use-toast';

interface AIAssistantChatProps {
  messages: Message[];
  isLoading: boolean;
  candidateMap?: Map<string, { id: string; name: string }>;
  jobEditorContext?: JobEditorContext;
}

// Parse insertable content blocks from AI response
interface InsertableBlock {
  field: 'title' | 'location' | 'jobType' | 'description' | 'responsibilities' | 'requirements' | 'benefits' | 'tags' | 'aiPrompt' | 'interviewPrompt' | 'businessCaseQuestions' | 'fixedInterviewQuestions';
  content: string;
  items?: string[];
  structuredData?: any;
}

// Pre-process AI response to fix common formatting mistakes
const cleanAIResponse = (text: string): string => {
  let cleaned = text;
  
  // Remove any internal status lines that leaked through
  cleaned = cleaned.replace(/^.*(_TITLE|_DESC|_RESP|_REQS|_BENS|_BC|_IQ|TITLE_STATUS|DESCRIPTION_STATUS|RESPONSIBILITIES_COUNT|REQUIREMENTS_COUNT|BENEFITS_COUNT|BUSINESS_CASE_COUNT|INTERVIEW_QUESTIONS_COUNT).*$/gm, '');
  cleaned = cleaned.replace(/<!-- SYSTEM_INTERNAL_STATE[\s\S]*?END SYSTEM_INTERNAL_STATE -->/g, '');
  cleaned = cleaned.replace(/^.*[❌⏳✅].*(?:NOT_SET|SET|Needs more|NOT SET|minimum).*$/gm, '');
  
  // Fix "Lettitle]" or "Letdescription]" malformations
  cleaned = cleaned.replace(/Let(title|location|description|responsibilities|requirements|benefits)\]/gi, '[INSERTABLE:$1]');
  
  // Fix missing opening bracket entirely: "INSERTABLE:title]" -> "[INSERTABLE:title]"
  cleaned = cleaned.replace(/(?:^|\s)(INSERTABLE:(title|location|description|responsibilities|requirements|benefits))/gi, ' [INSERTABLE:$2');
  
  // Fix common AI mistakes:
  // 1. "[ INSERTABLE:field]" -> "[INSERTABLE:field]"
  cleaned = cleaned.replace(/\[\s+INSERTABLE:/gi, '[INSERTABLE:');
  
  // 2. "[INSERTABLE :field]" -> "[INSERTABLE:field]"
  cleaned = cleaned.replace(/\[INSERTABLE\s+:/gi, '[INSERTABLE:');
  
  // 3. "[INSERTABLE: field]" -> "[INSERTABLE:field]"
  cleaned = cleaned.replace(/\[INSERTABLE:\s+/gi, '[INSERTABLE:');
  
  // 4. "[ /INSERTABLE]" -> "[/INSERTABLE]"
  cleaned = cleaned.replace(/\[\s*\/\s*INSERTABLE\s*\]/gi, '[/INSERTABLE]');
  
  // Clean up empty lines left by removed content
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  
  return cleaned.trim();
};

const parseInsertableBlocks = (text: string): { cleanText: string; blocks: InsertableBlock[] } => {
  const blocks: InsertableBlock[] = [];
  
  // Pre-process to fix common AI formatting mistakes
  let cleanText = cleanAIResponse(text);
  
  // Pattern: [INSERTABLE:field]content[/INSERTABLE]
  const regex = /\[INSERTABLE:(title|location|jobType|description|responsibilities|requirements|benefits|tags|aiPrompt|interviewPrompt|businessCaseQuestions|fixedInterviewQuestions)\]([\s\S]*?)\[\/INSERTABLE\]/gi;
  
  let match;
  while ((match = regex.exec(cleanText)) !== null) {
    const field = match[1].toLowerCase() as InsertableBlock['field'];
    const content = match[2].trim();
    
    // Parse list items for array fields
    const listFields = ['responsibilities', 'requirements', 'benefits', 'tags'];
    // Parse JSON for structured fields
    const jsonFields = ['businessCaseQuestions', 'fixedInterviewQuestions'];
    
    if (jsonFields.includes(field)) {
      try {
        const structuredData = JSON.parse(content);
        blocks.push({ field, content, structuredData });
      } catch {
        // If JSON parsing fails, try to parse as simple list
        console.warn('[AIAssistantChat] Failed to parse JSON for field:', field);
        blocks.push({ field, content });
      }
    } else if (listFields.includes(field)) {
      const items = content
        .split('\n')
        .map(line => line.replace(/^[-•*]\s*/, '').trim())
        .filter(line => line.length > 0);
      blocks.push({ field, content, items });
    } else {
      blocks.push({ field, content });
    }
  }
  
  // Remove all matched blocks from display text
  cleanText = cleanText.replace(regex, '');
  
  // FALLBACK: Detect malformed blocks (closing tag without proper opening tag)
  if (blocks.length === 0 && cleanText.includes('[/INSERTABLE]')) {
    console.warn('[AIAssistantChat] Detected malformed INSERTABLE block - attempting recovery');
    
    // Strategy 1: Look for content that starts with "[ " (malformed opening bracket)
    // Pattern: "[ Content...[/INSERTABLE]" where the AI used "[ " instead of "[INSERTABLE:field]"
    const malformedPatterns = [
      // Pattern: "[ Content..." before closing tag (AI started with bracket but no INSERTABLE)
      /\[\s+([A-Z][^[\]]{50,}?)\[\/INSERTABLE\]/gi,
      // Pattern: Just content before closing tag with no opening at all
      /(?:^|\n\n)((?:[A-Z][^[\]]{100,}?))\[\/INSERTABLE\]/gi,
    ];
    
    for (const pattern of malformedPatterns) {
      const fallbackMatch = cleanText.match(pattern);
      if (fallbackMatch) {
        let potentialContent = fallbackMatch[1].trim();
        // Clean up any malformed opening brackets
        potentialContent = potentialContent.replace(/^\[\s*/, '');
        
        // Check if it looks like a description (has sentences, substantial length)
        if (potentialContent.includes('.') && potentialContent.length > 100) {
          console.log('[AIAssistantChat] Recovered malformed block as description');
          blocks.push({ field: 'description', content: potentialContent });
          cleanText = cleanText.replace(fallbackMatch[0], '');
          break;
        }
      }
    }
    
    // Strategy 2: If still no blocks, try to find any substantial content before [/INSERTABLE]
    if (blocks.length === 0) {
      const lastResortPattern = /([\s\S]{150,}?)\[\/INSERTABLE\]/;
      const lastMatch = cleanText.match(lastResortPattern);
      if (lastMatch) {
        let content = lastMatch[1].trim();
        // Remove any malformed brackets at the start
        content = content.replace(/^\[\s*/, '');
        
        if (content.includes('.') && content.length > 100) {
          console.log('[AIAssistantChat] Recovered block using last resort pattern');
          blocks.push({ field: 'description', content });
          cleanText = cleanText.replace(lastMatch[0], '');
        }
      }
    }
  }
  
  // Clean up orphan [/INSERTABLE] tags
  cleanText = cleanText.replace(/\[\/INSERTABLE\]/g, '');
  
  return { cleanText: cleanText.trim(), blocks };
};

// Parse candidate names from text and create clickable links
const parseCandidateReferences = (
  text: string,
  candidateMap: Map<string, { id: string; name: string }>,
  onCandidateClick: (id: string) => void
) => {
  if (!candidateMap.size) return null;

  // Create a regex pattern to match candidate names
  const names = Array.from(candidateMap.values()).map(c => c.name);
  if (!names.length) return null;

  // Escape special regex characters and create pattern
  const escapedNames = names.map(name => 
    name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  );
  const pattern = new RegExp(`\\b(${escapedNames.join('|')})\\b`, 'gi');

  const parts: (string | JSX.Element)[] = [];
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    // Find the candidate
    const matchedName = match[1];
    const candidate = Array.from(candidateMap.values()).find(
      c => c.name.toLowerCase() === matchedName.toLowerCase()
    );

    if (candidate) {
      parts.push(
        <button
          key={`${candidate.id}-${match.index}`}
          onClick={() => onCandidateClick(candidate.id)}
          className="inline-flex items-center gap-0.5 text-primary font-medium hover:underline"
        >
          {matchedName}
          <ExternalLink className="w-3 h-3" />
        </button>
      );
    } else {
      parts.push(matchedName);
    }

    lastIndex = pattern.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : null;
};

export const AIAssistantChat = ({ messages, isLoading, candidateMap = new Map(), jobEditorContext }: AIAssistantChatProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Handle insert action
  const handleInsert = (block: InsertableBlock) => {
    if (!jobEditorContext) return;
    
    const fieldLabels: Record<string, string> = {
      title: 'Job Title',
      location: 'Location',
      jobType: 'Job Type',
      description: 'Description',
      responsibilities: 'Responsibilities',
      requirements: 'Requirements',
      benefits: 'Benefits',
      tags: 'Tags',
      aiPrompt: 'AI Evaluation Instructions',
      interviewPrompt: 'AI Interview Instructions',
      businessCaseQuestions: 'Business Case Questions',
      fixedInterviewQuestions: 'Interview Questions',
    };
    
    switch (block.field) {
      case 'title':
        jobEditorContext.onInsertTitle?.(block.content);
        break;
      case 'location':
        jobEditorContext.onInsertLocation?.(block.content);
        break;
      case 'jobType':
        jobEditorContext.onInsertJobType?.(block.content);
        break;
      case 'description':
        jobEditorContext.onInsertDescription?.(block.content);
        break;
      case 'responsibilities':
        jobEditorContext.onInsertResponsibilities?.(block.items || []);
        break;
      case 'requirements':
        jobEditorContext.onInsertRequirements?.(block.items || []);
        break;
      case 'benefits':
        jobEditorContext.onInsertBenefits?.(block.items || []);
        break;
      case 'tags':
        jobEditorContext.onInsertTags?.(block.items || []);
        break;
      case 'aiPrompt':
        jobEditorContext.onInsertAIPrompt?.(block.content);
        break;
      case 'interviewPrompt':
        jobEditorContext.onInsertInterviewPrompt?.(block.content);
        break;
      case 'businessCaseQuestions':
        if (block.structuredData && Array.isArray(block.structuredData)) {
          jobEditorContext.onInsertBusinessCaseQuestions?.(block.structuredData);
        }
        break;
      case 'fixedInterviewQuestions':
        if (block.structuredData && Array.isArray(block.structuredData)) {
          jobEditorContext.onInsertFixedInterviewQuestions?.(block.structuredData);
        }
        break;
    }
    
    const getDescription = () => {
      if (block.items) return `Added ${block.items.length} items`;
      if (block.structuredData && Array.isArray(block.structuredData)) return `Added ${block.structuredData.length} questions`;
      return 'Content added to form';
    };
    
    toast({
      title: `${fieldLabels[block.field]} inserted`,
      description: getDescription(),
    });
  };

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleCandidateClick = (id: string) => {
    navigate(`/candidate/${id}`);
  };

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
                isMobile ? 'max-w-[85%] text-sm' : 'max-w-[80%] text-sm',
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border text-foreground'
              )}
            >
              {message.role === 'assistant' ? (
                (() => {
                  const { cleanText, blocks } = parseInsertableBlocks(message.content);
                  const fieldLabels: Record<string, string> = {
                    title: 'Title',
                    location: 'Location',
                    jobType: 'Job Type',
                    description: 'Description',
                    responsibilities: 'Responsibilities',
                    requirements: 'Requirements',
                    benefits: 'Benefits',
                    tags: 'Tags',
                    aiPrompt: 'AI Evaluation',
                    interviewPrompt: 'Interview Instructions',
                    businessCaseQuestions: 'Business Case Questions',
                    fixedInterviewQuestions: 'Interview Questions',
                  };
                  
                  return (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown
                        components={{
                          h1: ({ children }) => <h1 className="text-base font-bold mt-3 mb-2 first:mt-0">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-sm font-bold mt-3 mb-1.5 first:mt-0">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-1 first:mt-0">{children}</h3>,
                          p: ({ children }) => {
                            if (typeof children === 'string' && candidateMap.size > 0) {
                              const parsed = parseCandidateReferences(children, candidateMap, handleCandidateClick);
                              if (parsed) {
                                return <p className="mb-2 last:mb-0">{parsed}</p>;
                              }
                            }
                            return <p className="mb-2 last:mb-0">{children}</p>;
                          },
                          ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                          li: ({ children }) => {
                            if (typeof children === 'string' && candidateMap.size > 0) {
                              const parsed = parseCandidateReferences(children, candidateMap, handleCandidateClick);
                              if (parsed) {
                                return <li className="text-sm">{parsed}</li>;
                              }
                            }
                            return <li className="text-sm">{children}</li>;
                          },
                          strong: ({ children }) => {
                            if (typeof children === 'string' && candidateMap.size > 0) {
                              const parsed = parseCandidateReferences(children, candidateMap, handleCandidateClick);
                              if (parsed) {
                                return <strong className="font-semibold">{parsed}</strong>;
                              }
                            }
                            return <strong className="font-semibold">{children}</strong>;
                          },
                          em: ({ children }) => <em className="italic">{children}</em>,
                          code: ({ children }) => (
                            <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>
                          ),
                          a: ({ href, children }) => (
                            <a href={href} className="text-primary underline hover:no-underline" target="_blank" rel="noopener noreferrer">
                              {children}
                            </a>
                          ),
                        }}
                      >
                        {cleanText}
                      </ReactMarkdown>
                      
                      {/* Insertable content cards */}
                      {blocks.length > 0 && jobEditorContext && !message.isStreaming && (
                        <div className="space-y-3 mt-4 pt-3 border-t border-border/50">
                          {blocks.map((block, idx) => (
                            <div 
                              key={idx}
                              className="rounded-lg border border-primary/30 bg-primary/5 p-3"
                            >
                              {/* Header */}
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                                  {fieldLabels[block.field]}
                                </span>
                              </div>
                              
                              {/* Content */}
                              <div className="text-sm text-foreground mb-3">
                                {block.structuredData && Array.isArray(block.structuredData) ? (
                                  <div className="space-y-2">
                                    {block.structuredData.map((item: any, i: number) => (
                                      <div key={i} className="p-2 bg-muted/50 rounded text-sm">
                                        <strong className="block">{item.title || item.question_title || item.text || `Question ${i + 1}`}</strong>
                                        {(item.description || item.question_description) && (
                                          <p className="text-muted-foreground text-xs mt-1">
                                            {item.description || item.question_description}
                                          </p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : block.items && block.items.length > 0 ? (
                                  <ul className="list-disc pl-4 space-y-1">
                                    {block.items.map((item, i) => (
                                      <li key={i}>{item}</li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="whitespace-pre-wrap">{block.content}</p>
                                )}
                              </div>
                              
                              {/* Insert button */}
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1.5 text-xs"
                                onClick={() => handleInsert(block)}
                              >
                                <Plus className="w-3.5 h-3.5" />
                                Insert {fieldLabels[block.field]}
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {message.isStreaming && (
                        <span className="inline-block w-1.5 h-4 ml-0.5 bg-primary animate-pulse rounded-sm" />
                      )}
                    </div>
                  );
                })()
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
