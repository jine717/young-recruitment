import React, { useRef, useEffect, useCallback, useState } from 'react';
import ReactDOM from 'react-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Mail, Loader2 } from 'lucide-react';
import { 
  ExecutiveReportContent, 
  type PresentationContent, 
  type ViableCandidate,
  type CandidateRanking,
  type ComparisonMatrixItem,
  type BusinessCaseAnalysisItem,
  type InterviewPerformanceItem,
  type CandidateRisk
} from './ExecutiveReportContent';
import { EmailShareDialog } from './EmailShareDialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ExecutiveReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  presentationContent: PresentationContent | null;
  viableCandidates: ViableCandidate[];
  allRankings: CandidateRanking[];
  comparisonMatrix: ComparisonMatrixItem[];
  businessCaseAnalysis: BusinessCaseAnalysisItem[];
  interviewPerformance: InterviewPerformanceItem[];
  risks?: CandidateRisk[];
  confidence: 'high' | 'medium' | 'low';
  jobTitle: string;
}

export function ExecutiveReportModal({
  open,
  onOpenChange,
  presentationContent,
  viableCandidates,
  allRankings,
  comparisonMatrix,
  businessCaseAnalysis,
  interviewPerformance,
  risks,
  confidence,
  jobTitle,
}: ExecutiveReportModalProps) {
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);

  const formatFileName = useCallback((title: string) => {
    const sanitizedTitle = title.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = date.toTimeString().slice(0, 8).replace(/:/g, '');
    return `${sanitizedTitle}_evaluation_${dateStr}-${timeStr}`;
  }, []);

  useEffect(() => {
    if (!open) return;

    let originalTitle = '';

    const handleBeforePrint = () => {
      originalTitle = document.title;
      document.title = formatFileName(jobTitle);
    };

    const handleAfterPrint = () => {
      document.title = originalTitle || 'Lovable';
    };

    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [open, jobTitle, formatFileName]);

  const handlePrint = () => {
    // Save original title and change BEFORE print (synchronously)
    const originalTitle = document.title;
    document.title = formatFileName(jobTitle);
    
    // Call print - the title is already changed
    window.print();
    
    // Restore after (afterprint will also handle this as fallback)
    document.title = originalTitle;
  };

  const handleSendEmail = async (email: string, message: string) => {
    if (!presentationContent) return;

    setIsSendingEmail(true);
    try {
      const topCandidate = viableCandidates[0];
      const topRecommendation = {
        name: topCandidate?.name || 'N/A',
        score: topCandidate?.score || 0,
        keyStrengths: presentationContent.topRecommendation?.keyStrengths || [],
        whyChosen: presentationContent.topRecommendation?.whyChosen || '',
      };

      const { data, error } = await supabase.functions.invoke('send-executive-report', {
        body: {
          recipientEmail: email,
          personalMessage: message || undefined,
          jobTitle,
          executiveSummary: presentationContent.executiveSummary || '',
          topRecommendation,
          rankings: viableCandidates.map(c => ({
            name: c.name,
            score: c.score,
            recommendation: c.keyDifferentiator || '',
          })),
          keyInsights: presentationContent.keyInsights || [],
          confidence,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to send email');

      toast({
        title: "Report Sent",
        description: `Executive report sent to ${email}`,
      });
      setEmailDialogOpen(false);
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast({
        title: "Failed to Send",
        description: error.message || 'An error occurred while sending the report',
        variant: "destructive",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  if (!presentationContent) return null;

  const printRoot = document.getElementById('print-root');

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] w-[900px] max-h-[95vh] overflow-hidden p-0">
          <DialogHeader className="px-6 py-5 border-b border-[#605738]/20 bg-[#FDFAF0]">
            <div className="flex items-center justify-between pr-8">
              <div className="space-y-1">
                <DialogTitle className="text-2xl font-bold text-[#100D0A] tracking-tight">
                  Executive Report
                </DialogTitle>
                <p className="text-sm text-[#605738]">
                  Preview and export candidate evaluation report
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* Share via Email - temporarily hidden
                <Button 
                  onClick={() => setEmailDialogOpen(true)}
                  className="bg-[#93B1FF] hover:bg-[#7a9ce8] text-[#100D0A] font-semibold shadow-md hover:shadow-lg transition-all"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Share via Email
                </Button>
                */}
                <Button 
                  onClick={handlePrint} 
                  className="bg-[#93B1FF] hover:bg-[#7a9ce8] text-[#100D0A] font-semibold shadow-md hover:shadow-lg transition-all"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print / Save as PDF
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          {/* Scrollable Preview Area */}
          <div className="overflow-y-auto max-h-[calc(95vh-80px)]">
            <div ref={printRef}>
              <ExecutiveReportContent
                presentationContent={presentationContent}
                viableCandidates={viableCandidates}
                allRankings={allRankings}
                comparisonMatrix={comparisonMatrix}
                businessCaseAnalysis={businessCaseAnalysis}
                interviewPerformance={interviewPerformance}
                risks={risks}
                confidence={confidence}
                jobTitle={jobTitle}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Print-only content rendered via Portal outside Dialog */}
      {open && printRoot && ReactDOM.createPortal(
        <div className="hidden print:block">
          <ExecutiveReportContent
            presentationContent={presentationContent}
            viableCandidates={viableCandidates}
            allRankings={allRankings}
            comparisonMatrix={comparisonMatrix}
            businessCaseAnalysis={businessCaseAnalysis}
            interviewPerformance={interviewPerformance}
            risks={risks}
            confidence={confidence}
            jobTitle={jobTitle}
          />
        </div>,
        printRoot
      )}

      <EmailShareDialog
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        onSend={handleSendEmail}
        isLoading={isSendingEmail}
      />
    </>
  );
}
