import React, { useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { 
  ExecutiveReportContent, 
  type PresentationContent, 
  type ViableCandidate,
  type CandidateRanking,
  type ComparisonMatrixItem,
  type BusinessCaseAnalysisItem 
} from './ExecutiveReportContent';

interface ExecutiveReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  presentationContent: PresentationContent | null;
  viableCandidates: ViableCandidate[];
  allRankings: CandidateRanking[];
  comparisonMatrix: ComparisonMatrixItem[];
  businessCaseAnalysis: BusinessCaseAnalysisItem[];
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
  confidence,
  jobTitle,
}: ExecutiveReportModalProps) {
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
    // Guardar título original y cambiar ANTES de print (sincronamente)
    const originalTitle = document.title;
    document.title = formatFileName(jobTitle);
    
    // Llamar a print - el título ya está cambiado
    window.print();
    
    // Restaurar después (el afterprint también lo hará como fallback)
    document.title = originalTitle;
  };

  if (!presentationContent) return null;

  const printRoot = document.getElementById('print-root');

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] w-[900px] max-h-[95vh] overflow-hidden p-0">
          <DialogHeader className="px-6 py-5 border-b border-[#605738]/20 bg-[#FDFAF0]">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <DialogTitle className="text-2xl font-bold text-[#100D0A] tracking-tight">
                  Executive Report
                </DialogTitle>
                <p className="text-sm text-[#605738]">
                  Preview and export candidate evaluation report
                </p>
              </div>
              <Button 
                onClick={handlePrint} 
                className="bg-[#93B1FF] hover:bg-[#7a9ce8] text-[#100D0A] font-semibold shadow-md hover:shadow-lg transition-all"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print / Save as PDF
              </Button>
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
            confidence={confidence}
            jobTitle={jobTitle}
          />
        </div>,
        printRoot
      )}
    </>
  );
}
