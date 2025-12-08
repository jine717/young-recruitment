import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { LinkedInIcon } from '@/components/icons/LinkedInIcon';
import { useLinkedInPost } from '@/hooks/useLinkedInPost';
import { 
  RefreshCw, 
  Copy, 
  ExternalLink, 
  Check, 
  ChevronDown,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LinkedInPostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: {
    id: string;
    title: string;
    linkedin_post_content?: string | null;
    linkedin_post_status?: string;
  } | null;
}

export function LinkedInPostModal({ open, onOpenChange, job }: LinkedInPostModalProps) {
  const {
    content,
    characterCount,
    hashtags,
    cached,
    isGenerated,
    isLoading,
    isMarkingPosted,
    error,
    generatePost,
    copyToClipboard,
    openLinkedIn,
    markAsPosted,
    updateContent,
    reset,
  } = useLinkedInPost();

  const [customInstructions, setCustomInstructions] = useState('');
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate post when modal opens with a job
  useEffect(() => {
    if (open && job && !isGenerated && !isLoading) {
      generatePost({ jobId: job.id });
    }
  }, [open, job, isGenerated, isLoading, generatePost]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      reset();
      setCustomInstructions('');
      setInstructionsOpen(false);
      setCopied(false);
    }
  }, [open, reset]);

  const handleCopy = async () => {
    const success = await copyToClipboard();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRegenerate = () => {
    generatePost({ 
      jobId: job!.id, 
      regenerate: true,
      customInstructions: customInstructions || undefined,
    });
  };

  const handleOpenLinkedIn = () => {
    openLinkedIn();
  };

  const handleMarkAsPosted = () => {
    if (job) {
      markAsPosted(job.id);
      setTimeout(() => onOpenChange(false), 1500);
    }
  };

  const getCharacterCountColor = () => {
    if (characterCount > 3000) return 'text-destructive';
    if (characterCount > 2800) return 'text-[hsl(var(--young-gold))]';
    return 'text-muted-foreground';
  };

  if (!job) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LinkedInIcon className="h-5 w-5 text-[#0077B5]" />
            LinkedIn Post
          </DialogTitle>
          <DialogDescription>
            AI-generated post for <span className="font-medium">{job.title}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Loading State */}
          {isLoading && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 animate-pulse text-[hsl(var(--young-blue))]" />
                Generating LinkedIn post...
              </div>
              <Skeleton className="h-[200px] w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="h-10 w-10 text-destructive mb-3" />
              <p className="text-sm text-muted-foreground mb-4">
                Failed to generate post. Please try again.
              </p>
              <Button onClick={handleRegenerate} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          )}

          {/* Content */}
          {isGenerated && !isLoading && !error && (
            <>
              {/* Cached indicator */}
              {cached && (
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  Using previously generated content
                </div>
              )}

              {/* Editable content */}
              <div className="relative">
                <Textarea
                  value={content}
                  onChange={(e) => updateContent(e.target.value)}
                  className="min-h-[250px] resize-none font-mono text-sm"
                  placeholder="Post content will appear here..."
                />
                <div className={cn(
                  "absolute bottom-2 right-2 text-xs",
                  getCharacterCountColor()
                )}>
                  {characterCount} / 3000
                </div>
              </div>

              {/* Hashtags */}
              {hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {hashtags.map((tag, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary"
                      className="text-xs"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Custom Instructions */}
              <Collapsible open={instructionsOpen} onOpenChange={setInstructionsOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full justify-between">
                    <span className="text-sm">Custom Instructions</span>
                    <ChevronDown className={cn(
                      "h-4 w-4 transition-transform",
                      instructionsOpen && "rotate-180"
                    )} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2">
                  <Input
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    placeholder="E.g., Focus on remote work benefits, mention team culture..."
                    className="text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Add specific instructions for AI regeneration
                  </p>
                </CollapsibleContent>
              </Collapsible>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-2">
                <Button 
                  variant="outline" 
                  onClick={handleRegenerate}
                  disabled={isLoading}
                >
                  <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                  Regenerate
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={handleCopy}
                  disabled={!content}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2 text-green-600" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={handleOpenLinkedIn}
                  className="text-[#0077B5] hover:text-[#0077B5] hover:bg-[#0077B5]/10"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open LinkedIn
                </Button>
                
                <Button 
                  onClick={handleMarkAsPosted}
                  disabled={isMarkingPosted}
                  className="bg-[#0077B5] hover:bg-[#006097] text-white ml-auto"
                >
                  {isMarkingPosted ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Mark as Posted
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
