import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BusinessCaseProgressProps {
  totalQuestions: number;
  currentQuestion: number;
  completedQuestions: number[];
}

export function BusinessCaseProgress({ 
  totalQuestions, 
  currentQuestion, 
  completedQuestions 
}: BusinessCaseProgressProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: totalQuestions }, (_, i) => i + 1).map((num) => {
        const isCompleted = completedQuestions.includes(num);
        const isCurrent = num === currentQuestion;
        
        return (
          <div key={num} className="flex items-center">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors",
                isCompleted && "bg-primary text-primary-foreground",
                isCurrent && !isCompleted && "bg-secondary text-secondary-foreground ring-2 ring-primary",
                !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
              )}
            >
              {isCompleted ? <Check className="w-5 h-5" /> : num}
            </div>
            {num < totalQuestions && (
              <div 
                className={cn(
                  "w-8 h-1 mx-1",
                  completedQuestions.includes(num) ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
