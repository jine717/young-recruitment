import { Link } from 'react-router-dom';
import { ArrowLeft, Users, TrendingUp, Clock, Brain, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRecruiterAnalytics, TimeDuration } from '@/hooks/useRecruiterAnalytics';
import { StatsCard } from '@/components/analytics/StatsCard';
import { ConversionFunnelChart } from '@/components/analytics/ConversionFunnelChart';
import { ApplicationsTrendChart } from '@/components/analytics/ApplicationsTrendChart';
import { AIScoreDistributionChart } from '@/components/analytics/AIScoreDistributionChart';
import { JobPerformanceTable } from '@/components/analytics/JobPerformanceTable';
import { HiringPipelineChart } from '@/components/analytics/HiringPipelineChart';
import { TimeMetricsCard } from '@/components/analytics/TimeMetricsCard';
import { BCQMetricsCard } from '@/components/analytics/BCQMetricsCard';
import { useRoleCheck } from '@/hooks/useRoleCheck';

// Format duration as hours and minutes
const formatDuration = (time: TimeDuration): string => {
  if (time.hours === 0 && time.minutes === 0) return '0m';
  if (time.hours === 0) return `${time.minutes}m`;
  if (time.minutes === 0) return `${time.hours}h`;
  return `${time.hours}h ${time.minutes}m`;
};

export default function RecruiterAnalytics() {
  const { hasAccess, isLoading: roleLoading } = useRoleCheck(['management', 'admin']);
  const analytics = useRecruiterAnalytics();

  if (roleLoading || analytics.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando analytics...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Acceso Denegado</h2>
            <p className="text-muted-foreground mb-4">No tienes permisos para ver esta página.</p>
            <Button asChild>
              <Link to="/">Ir al Inicio</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <DashboardLayout showDashboardLink>
      <div className="container mx-auto px-4 py-8 pt-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
              <p className="text-muted-foreground">Métricas de rendimiento del proceso de reclutamiento</p>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <StatsCard
            title="Total Aplicaciones"
            value={analytics.totalApplications}
            icon={Users}
            subtitle="Todas las aplicaciones"
          />
          <StatsCard
            title="Conversión a Entrevista"
            value={`${analytics.conversionToInterview}%`}
            icon={TrendingUp}
            subtitle="Aplicación → Entrevista"
          />
          <StatsCard
            title="Tiempo a Decisión"
            value={formatDuration(analytics.avgTimeToDecision)}
            icon={Clock}
            subtitle="Promedio hasta decisión final"
          />
          <StatsCard
            title="Score IA Promedio"
            value={analytics.avgAIScore !== null ? analytics.avgAIScore : '—'}
            icon={Brain}
            subtitle="Indicador de calidad"
          />
          <StatsCard
            title="Contratados"
            value={analytics.totalHired}
            icon={CheckCircle}
            subtitle="Total exitosos"
          />
          <StatsCard
            title="Rechazados"
            value={analytics.totalRejected}
            icon={XCircle}
            subtitle="No seleccionados"
          />
        </div>

        {/* BCQ Metrics */}
        <div className="mb-6">
          <BCQMetricsCard metrics={analytics.bcqMetrics} />
        </div>

        {/* Pipeline and Funnel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <HiringPipelineChart data={analytics.pipelineData} />
          <ConversionFunnelChart data={analytics.funnelData} />
        </div>

        {/* Time Metrics and Trend */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <TimeMetricsCard 
            metrics={analytics.timeMetrics} 
            totalHired={analytics.totalHired}
            totalRejected={analytics.totalRejected}
          />
          <ApplicationsTrendChart data={analytics.applicationsTrend} />
        </div>

        {/* AI Score Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <AIScoreDistributionChart data={analytics.aiScoreDistribution} />
        </div>

        {/* Job Performance Table */}
        <JobPerformanceTable data={analytics.jobPerformance} />
      </div>
    </DashboardLayout>
  );
}
