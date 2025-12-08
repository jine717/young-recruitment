import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'default' | 'blue' | 'gold' | 'success';
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const variantStyles = {
  default: {
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
  },
  blue: {
    iconBg: 'bg-[hsl(var(--young-blue))]/15',
    iconColor: 'text-[hsl(var(--young-blue))]',
  },
  gold: {
    iconBg: 'bg-[hsl(var(--young-gold))]/15',
    iconColor: 'text-[hsl(var(--young-gold))]',
  },
  success: {
    iconBg: 'bg-green-500/15',
    iconColor: 'text-green-600',
  },
};

export function StatsCard({ title, value, subtitle, icon: Icon, variant = 'default', trend }: StatsCardProps) {
  const styles = variantStyles[variant];
  
  return (
    <Card className="shadow-young-sm hover-lift transition-all duration-200">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-display">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {trend && (
              <p className={cn(
                "text-xs font-medium",
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              )}>
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}% from last month
              </p>
            )}
          </div>
          <div className={cn("p-3 rounded-xl", styles.iconBg)}>
            <Icon className={cn("h-5 w-5", styles.iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
