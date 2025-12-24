import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X, ExternalLink, Loader2 } from 'lucide-react';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentUrl: string | null;
  documentTitle: string;
  isLoading?: boolean;
}

export function DocumentViewerModal({
  isOpen,
  onClose,
  documentUrl,
  documentTitle,
  isLoading = false,
}: DocumentViewerModalProps) {
  const handleDownload = () => {
    if (!documentUrl) return;
    const link = document.createElement('a');
    link.href = documentUrl;
    link.download = `${documentTitle.replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenInNewTab = () => {
    if (!documentUrl) return;
    window.open(documentUrl, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="flex flex-row items-center justify-between px-6 py-4 border-b shrink-0">
          <DialogTitle className="text-lg font-semibold">{documentTitle}</DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={!documentUrl || isLoading}
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenInNewTab}
              disabled={!documentUrl || isLoading}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open in Tab
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 min-h-0 bg-muted/30">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading document...</p>
              </div>
            </div>
          ) : documentUrl ? (
            <object
              data={documentUrl}
              type="application/pdf"
              className="w-full h-full"
            >
              <iframe
                src={documentUrl}
                className="w-full h-full border-0"
                title={documentTitle}
              />
            </object>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">No document available</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
