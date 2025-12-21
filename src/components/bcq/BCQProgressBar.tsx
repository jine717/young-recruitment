import { cn } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';

interface BCQProgressBarProps {
  currentQuestion: number;
  totalQuestions: number;
  completedQuestions: number[];
}

export function BCQProgressBar({ 
  currentQuestion, 
  totalQuestions, 
  completedQuestions 
}: BCQProgressBarProps) {
  const progressPercentage = (completedQuestions.length / totalQuestions) * 100;
  
  return (
    <div className="w-full space-y-3">
      {/* Progress bar */}
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      
      {/* Question indicators */}
      <div className="flex items-center justify-between">
        {Array.from({ length: totalQuestions }, (_, index) => {
          const isCompleted = completedQuestions.includes(index);
          const isCurrent = index === currentQuestion;
          
          return (
            <div
              key={index}
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all",
                isCompleted && "bg-chart-1 text-white",
                isCurrent && !isCompleted && "bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2 ring-offset-background",
                !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
              )}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                index + 1
              )}
            </div>
          );
        })}
      </div>
      
      {/* Progress text */}
      <p className="text-center text-sm text-muted-foreground">
        {completedQuestions.length} of {totalQuestions} questions completed
      </p>
    </div>
  );
}
