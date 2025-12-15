import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Scale, Users, Loader2, ChevronRight, History, Check } from 'lucide-react';
import { CandidateSelector } from '@/components/recruiter/CandidateSelector';
import { ComparisonResultCard } from '@/components/recruiter/ComparisonResultCard';
import { ComparisonHistoryDialog } from '@/components/recruiter/ComparisonHistoryDialog';
import { useJobsWithApplications, useJobCandidates, useCompareCandidates } from '@/hooks/useCandidateComparison';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import { cn } from '@/lib/utils';

export default function CandidatesEvaluation() {
  const [step, setStep] = useState(1);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [customPrompt, setCustomPrompt] = useState('');
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [historyJobId, setHistoryJobId] = useState<string | null>(null);
  const [historyJobTitle, setHistoryJobTitle] = useState('');

  const { user, hasAccess, isLoading: roleLoading } = useRoleCheck(['recruiter', 'admin', 'management']);
  const { data: jobs, isLoading: jobsLoading } = useJobsWithApplications();
  const { data: candidates, isLoading: candidatesLoading } = useJobCandidates(selectedJobId);
  const { compare, isComparing, result, reset } = useCompareCandidates();

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Access denied. Recruiter or Admin role required.</p>
      </div>
    );
  }

  const selectedJob = jobs?.find(j => j.id === selectedJobId);

  const handleJobSelect = (jobId: string) => {
    setSelectedJobId(jobId);
    setSelectedCandidateIds([]);
    setStep(2);
  };

  const handleOpenHistory = (jobId: string, jobTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistoryJobId(jobId);
    setHistoryJobTitle(jobTitle);
    setHistoryDialogOpen(true);
  };

  const handleContinueToPrompt = () => {
    if (selectedCandidateIds.length >= 2) {
      setStep(3);
    }
  };

  const handleCompare = () => {
    if (selectedJobId && selectedCandidateIds.length >= 2) {
      compare({
        applicationIds: selectedCandidateIds,
        customPrompt,
        jobId: selectedJobId,
      });
      setStep(4);
    }
  };

  const handleReset = () => {
    setStep(1);
    setSelectedJobId(null);
    setSelectedCandidateIds([]);
    setCustomPrompt('');
    reset();
  };

  return (
    <DashboardLayout>

      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Scale className="w-8 h-8 text-primary" />
              Candidates Evaluation
            </h1>
            <p className="text-muted-foreground">Compare final candidates and get AI recommendations</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => {
            const isCompleted = s < step;
            const isCurrent = s === step;
            const canNavigate = isCompleted && step !== 4;
            
            return (
              <div key={s} className="flex items-center">
                <button
                  type="button"
                  onClick={() => canNavigate && setStep(s)}
                  disabled={!canNavigate}
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                    step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                    canNavigate && 'cursor-pointer hover:ring-2 hover:ring-primary/50 hover:scale-105',
                    !canNavigate && 'cursor-default'
                  )}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : s}
                </button>
                {s < 4 && (
                  <ChevronRight className={cn(
                    'w-5 h-5 mx-1',
                    step > s ? 'text-primary' : 'text-muted-foreground'
                  )} />
                )}
              </div>
            );
          })}
          <span className="ml-4 text-sm text-muted-foreground">
            {step === 1 && 'Select Job Position'}
            {step === 2 && 'Select Candidates'}
            {step === 3 && 'Custom Instructions'}
            {step === 4 && 'View Results'}
          </span>
        </div>

        {/* Step 1: Job Selection */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Select Job Position</CardTitle>
              <CardDescription>
                Choose a job with at least 2 candidates to compare
              </CardDescription>
            </CardHeader>
            <CardContent>
              {jobsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : jobs && jobs.length > 0 ? (
                <div className="grid gap-3">
                  {jobs.map((job) => (
                    <Card
                      key={job.id}
                      className="cursor-pointer hover:border-primary transition-colors"
                      onClick={() => handleJobSelect(job.id)}
                    >
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{job.title}</p>
                          <p className="text-sm text-muted-foreground">{job.location}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => handleOpenHistory(job.id, job.title, e)}
                          >
                            <History className="w-4 h-4 mr-1" />
                            History
                          </Button>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{job.applicationCount} candidates</span>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-12">
                  No jobs with 2+ candidates available for comparison.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 2: Candidate Selection */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Select Candidates to Compare</CardTitle>
                  <CardDescription>
                    {selectedJob?.title} • {selectedJob?.location}
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={() => setStep(1)}>
                  Change Job
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {candidatesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : candidates ? (
                <>
                  <CandidateSelector
                    candidates={candidates}
                    selectedIds={selectedCandidateIds}
                    onSelectionChange={setSelectedCandidateIds}
                  />

                  <div className="flex justify-end mt-6">
                    <Button
                      onClick={handleContinueToPrompt}
                      disabled={selectedCandidateIds.length < 2}
                    >
                      Continue
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Custom Instructions */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Custom Evaluation Instructions</CardTitle>
                  <CardDescription>
                    Comparing {selectedCandidateIds.length} candidates for {selectedJob?.title}
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={() => setStep(2)}>
                  Change Selection
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Custom Instructions (Optional)
                </label>
                <Textarea
                  placeholder="Add specific criteria or instructions for the AI comparison...

Example:
- Prioritize candidates with leadership experience
- Consider remote work capability
- Evaluate cultural fit with our startup environment
- Focus on communication skills for client-facing role"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  rows={8}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  These instructions will be added to the AI evaluation prompt to customize the comparison criteria.
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button onClick={handleCompare}>
                  <Scale className="w-4 h-4 mr-2" />
                  Compare Candidates
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Results */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Comparison Results</h2>
                <p className="text-muted-foreground">{selectedJob?.title}</p>
              </div>
              <Button onClick={handleReset}>
                New Comparison
              </Button>
            </div>

            {isComparing ? (
              <Card>
                <CardContent className="py-16 flex flex-col items-center justify-center">
                  <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                  <p className="text-lg font-medium">Analyzing Candidates...</p>
                  <p className="text-muted-foreground">AI is comparing {selectedCandidateIds.length} candidates</p>
                </CardContent>
              </Card>
            ) : result?.comparison ? (
              <ComparisonResultCard result={result.comparison} jobTitle={selectedJob?.title} jobId={selectedJob?.id} />
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No results available. Please try again.</p>
                  <Button onClick={handleReset} className="mt-4">
                    Start Over
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>

      {historyJobId && (
        <ComparisonHistoryDialog
          open={historyDialogOpen}
          onOpenChange={setHistoryDialogOpen}
          jobId={historyJobId}
          jobTitle={historyJobTitle}
        />
      )}
    </DashboardLayout>
  );
}
