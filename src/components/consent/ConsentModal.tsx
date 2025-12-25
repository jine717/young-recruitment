import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PdfViewer } from '@/components/candidate-profile/PdfViewer';
import { Download, Loader2, Shield, FileText } from 'lucide-react';

interface ConsentModalProps {
  open: boolean;
  onAccept: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ConsentModal({ open, onAccept, onCancel, isLoading }: ConsentModalProps) {
  const [cookiesAccepted, setCookiesAccepted] = useState(false);
  const [authorizationAccepted, setAuthorizationAccepted] = useState(false);

  const canSubmit = cookiesAccepted && authorizationAccepted;

  const handleAccept = () => {
    if (canSubmit) {
      onAccept();
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && !isLoading) {
      onCancel();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-full">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="font-display text-xl">Data Protection Consent</DialogTitle>
          </div>
          <DialogDescription>
            Before submitting your application, please review and accept our data protection policies. 
            Your privacy is important to us.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 py-4">
          <Tabs defaultValue="authorization" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="authorization" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Candidate Authorization
              </TabsTrigger>
              <TabsTrigger value="cookies" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Cookie Policy
              </TabsTrigger>
            </TabsList>

            <TabsContent value="authorization" className="flex-1 min-h-0 mt-0 data-[state=active]:flex data-[state=active]:flex-col">
              <div className="flex-1 min-h-0 h-[400px] border rounded-lg overflow-hidden bg-muted/20">
                <PdfViewer url="/legal/candidate-authorization.pdf" />
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="authorization"
                    checked={authorizationAccepted}
                    onCheckedChange={(checked) => setAuthorizationAccepted(checked === true)}
                    disabled={isLoading}
                  />
                  <Label htmlFor="authorization" className="text-sm font-medium cursor-pointer">
                    I have read and accept the Candidate Authorization
                  </Label>
                </div>
                <a
                  href="/legal/candidate-authorization.pdf"
                  download="YOUNG_SPAIN_Candidate_Authorization.pdf"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </a>
              </div>
            </TabsContent>

            <TabsContent value="cookies" className="flex-1 min-h-0 mt-0 data-[state=active]:flex data-[state=active]:flex-col">
              <div className="flex-1 min-h-0 h-[400px] border rounded-lg overflow-hidden bg-muted/20">
                <PdfViewer url="/legal/cookies-policy.pdf" />
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="cookies"
                    checked={cookiesAccepted}
                    onCheckedChange={(checked) => setCookiesAccepted(checked === true)}
                    disabled={isLoading}
                  />
                  <Label htmlFor="cookies" className="text-sm font-medium cursor-pointer">
                    I have read and accept the Cookie Policy
                  </Label>
                </div>
                <a
                  href="/legal/cookies-policy.pdf"
                  download="YOUNG_SPAIN_Cookie_Policy.pdf"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </a>
              </div>
            </TabsContent>
          </Tabs>

          {/* Acceptance status summary */}
          <div className="mt-4 p-3 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${cookiesAccepted ? 'bg-green-500' : 'bg-muted-foreground/30'}`} />
                <span className={cookiesAccepted ? 'text-foreground' : 'text-muted-foreground'}>
                  Cookie Policy {cookiesAccepted ? '✓' : '(pending)'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${authorizationAccepted ? 'bg-green-500' : 'bg-muted-foreground/30'}`} />
                <span className={authorizationAccepted ? 'text-foreground' : 'text-muted-foreground'}>
                  Candidate Authorization {authorizationAccepted ? '✓' : '(pending)'}
                </span>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center pt-3">
            By accepting, you confirm that you have read and understood both documents. 
            Your consent will be recorded for compliance purposes.
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="sm:w-auto w-full"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAccept}
            disabled={!canSubmit || isLoading}
            className="sm:w-auto w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Accept & Submit Application'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
