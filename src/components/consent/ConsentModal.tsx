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
import { FileText, ExternalLink, Loader2, Shield } from 'lucide-react';

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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
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

        <div className="space-y-6 py-4">
          {/* Cookie Policy */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Checkbox
                id="cookies"
                checked={cookiesAccepted}
                onCheckedChange={(checked) => setCookiesAccepted(checked === true)}
                disabled={isLoading}
                className="mt-1"
              />
              <div className="flex-1 space-y-2">
                <Label htmlFor="cookies" className="text-base font-semibold cursor-pointer">
                  Cookie Policy
                </Label>
                <p className="text-sm text-muted-foreground">
                  I have read and accept the Cookie Policy of Young Spain, S.L. regarding the use of 
                  cookies on this website for analytics, functionality, and personalization purposes.
                </p>
                <a
                  href="/legal/cookies-policy.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <FileText className="h-4 w-4" />
                  View Cookie Policy
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Candidate Authorization */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Checkbox
                id="authorization"
                checked={authorizationAccepted}
                onCheckedChange={(checked) => setAuthorizationAccepted(checked === true)}
                disabled={isLoading}
                className="mt-1"
              />
              <div className="flex-1 space-y-2">
                <Label htmlFor="authorization" className="text-base font-semibold cursor-pointer">
                  Candidate Data Authorization
                </Label>
                <p className="text-sm text-muted-foreground">
                  I expressly authorize Young Spain, S.L. to process my personal data, including my 
                  CV, DISC assessment, and any information provided during the recruitment process, 
                  for the purpose of evaluating my candidacy. I also authorize the use of my image 
                  for internal recruitment purposes as described in the Authorization Statement.
                </p>
                <a
                  href="/legal/candidate-authorization.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <FileText className="h-4 w-4" />
                  View Authorization Statement
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Info notice */}
          <p className="text-xs text-muted-foreground text-center">
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
