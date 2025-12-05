import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { User, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Candidate {
  id: string;
  candidate_name: string;
  candidate_email: string;
  ai_score: number | null;
  status: string;
  ai_recommendation: string | null;
}

interface CandidateSelectorProps {
  candidates: Candidate[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  maxSelection?: number;
}

export function CandidateSelector({
  candidates,
  selectedIds,
  onSelectionChange,
  maxSelection = 3,
}: CandidateSelectorProps) {
  const handleToggle = (candidateId: string) => {
    if (selectedIds.includes(candidateId)) {
      onSelectionChange(selectedIds.filter(id => id !== candidateId));
    } else if (selectedIds.length < maxSelection) {
      onSelectionChange([...selectedIds, candidateId]);
    }
  };

  const getRecommendationColor = (rec: string | null) => {
    switch (rec) {
      case 'proceed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'review':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'reject':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-muted-foreground';
    if (score >= 70) return 'text-green-600 dark:text-green-400';
    if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Select 2-{maxSelection} candidates to compare</span>
        <span>{selectedIds.length} / {maxSelection} selected</span>
      </div>

      <div className="grid gap-3">
        {candidates.map((candidate) => {
          const isSelected = selectedIds.includes(candidate.id);
          const isDisabled = !isSelected && selectedIds.length >= maxSelection;

          return (
            <Card
              key={candidate.id}
              className={cn(
                'cursor-pointer transition-all',
                isSelected && 'ring-2 ring-primary',
                isDisabled && 'opacity-50 cursor-not-allowed'
              )}
              onClick={() => !isDisabled && handleToggle(candidate.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Checkbox
                    checked={isSelected}
                    disabled={isDisabled}
                    onCheckedChange={() => handleToggle(candidate.id)}
                    onClick={(e) => e.stopPropagation()}
                  />

                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                    <User className="w-5 h-5 text-muted-foreground" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{candidate.candidate_name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {candidate.candidate_email}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {candidate.ai_score !== null && (
                      <div className="flex items-center gap-1">
                        <Star className={cn('w-4 h-4', getScoreColor(candidate.ai_score))} />
                        <span className={cn('font-semibold', getScoreColor(candidate.ai_score))}>
                          {candidate.ai_score}
                        </span>
                      </div>
                    )}

                    {candidate.ai_recommendation && (
                      <Badge className={getRecommendationColor(candidate.ai_recommendation)}>
                        {candidate.ai_recommendation}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {candidates.length === 0 && (
        <p className="text-center text-muted-foreground py-8">
          No candidates found for this job.
        </p>
      )}
    </div>
  );
}
