import { useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, X } from 'lucide-react';
import { ExecutiveReportContent, type PresentationContent, type ViableCandidate } from './ExecutiveReportContent';

interface ExecutiveReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  presentationContent: PresentationContent | null;
  viableCandidates: ViableCandidate[];
  confidence: 'high' | 'medium' | 'low';
  jobTitle: string;
}

export function ExecutiveReportModal({
  open,
  onOpenChange,
  presentationContent,
  viableCandidates,
  confidence,
  jobTitle,
}: ExecutiveReportModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  if (!presentationContent) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[900px] max-h-[95vh] overflow-hidden p-0 print:hidden">
        <DialogHeader className="px-6 py-4 border-b bg-muted/50 print:hidden">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              Executive Report Preview
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button onClick={handlePrint} className="bg-[#93B1FF] hover:bg-[#7a9ce8] text-[#100D0A]">
                <Printer className="w-4 h-4 mr-2" />
                Print / Save as PDF
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        {/* Scrollable Preview Area */}
        <div className="overflow-y-auto max-h-[calc(95vh-80px)] print:overflow-visible print:max-h-none">
          <div ref={printRef} className="print:block">
            <ExecutiveReportContent
              presentationContent={presentationContent}
              viableCandidates={viableCandidates}
              confidence={confidence}
              jobTitle={jobTitle}
            />
          </div>
        </div>
      </DialogContent>

      {/* Print-only content (rendered outside dialog for print) */}
      <div className="hidden print:block">
        <ExecutiveReportContent
          presentationContent={presentationContent}
          viableCandidates={viableCandidates}
          confidence={confidence}
          jobTitle={jobTitle}
        />
      </div>
    </Dialog>
  );
}
