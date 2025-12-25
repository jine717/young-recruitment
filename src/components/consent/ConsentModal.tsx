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
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { FileText, Loader2, Shield, Download } from 'lucide-react';

interface ConsentModalProps {
  open: boolean;
  onAccept: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const COOKIES_POLICY_CONTENT = `COOKIE POLICY OF YOUNG SPAIN, S.L.

Owner: YOUNG SPAIN, S.L.
Website: https://www.youngspain.com
Contact: privacy@youngspain.com

1. WHAT ARE COOKIES?

Cookies are small text files that websites place on your device to store information about your preferences, login status, and browsing behavior. They help us improve your experience on our website.

2. TYPES OF COOKIES WE USE

2.1 Essential Cookies
These cookies are necessary for the website to function properly. They enable basic functions like page navigation and access to secure areas of the website.

2.2 Analytics Cookies
We use analytics cookies to understand how visitors interact with our website. This helps us improve the user experience and optimize our content.

2.3 Functional Cookies
These cookies enable enhanced functionality and personalization, such as remembering your preferences and settings.

3. HOW TO MANAGE COOKIES

You can control and/or delete cookies as you wish. You can delete all cookies that are already on your computer and you can set most browsers to prevent them from being placed.

However, if you do this, you may have to manually adjust some preferences every time you visit our site, and some services and functionalities may not work.

4. THIRD-PARTY COOKIES

We may use third-party services that also set cookies on your device. These third parties have their own privacy policies which govern their use of cookies.

5. UPDATES TO THIS POLICY

We may update this Cookie Policy from time to time. We will notify you of any changes by posting the new policy on this page.

6. CONTACT

If you have any questions about our Cookie Policy, please contact us at privacy@youngspain.com.

Last updated: December 2024`;

const AUTHORIZATION_CONTENT = `CANDIDATE DATA AUTHORIZATION STATEMENT

YOUNG SPAIN, S.L.
CIF: B-XXXXXXXX
Address: Madrid, Spain

I, as a candidate applying for a position at Young Spain, S.L., hereby make the following declarations:

1. DATA PROCESSING AUTHORIZATION

I expressly authorize Young Spain, S.L. to:

a) Collect, store, and process my personal data provided in my curriculum vitae (CV), application form, and any other documents submitted during the recruitment process.

b) Process my DISC assessment results and any psychometric evaluations conducted as part of the selection process.

c) Store and analyze video recordings made during the Business Case Questions (BCQ) assessment phase.

d) Share my data with authorized personnel involved in the recruitment and selection process.

2. IMAGE RIGHTS AUTHORIZATION

I authorize Young Spain, S.L. to capture, store, and use my image and likeness in:

a) Video recordings made during BCQ assessments and interviews.
b) Internal databases for recruitment and talent management purposes.
c) Internal communications related to the hiring process.

This authorization is granted for the sole purpose of evaluating my candidacy and does not extend to commercial or promotional use without additional explicit consent.

3. DATA RETENTION

I understand that my personal data will be retained for a period of up to 24 months after the conclusion of the recruitment process, unless I request its deletion earlier.

4. RIGHTS

I acknowledge that I have the following rights under GDPR/LOPDGDD:

- Right of access to my personal data
- Right to rectification of inaccurate data
- Right to erasure ("right to be forgotten")
- Right to restriction of processing
- Right to data portability
- Right to object to processing
- Right to withdraw consent at any time

To exercise these rights, I may contact: privacy@youngspain.com

5. DECLARATION

By accepting this authorization, I confirm that:

- All information provided is accurate and complete.
- I have read and understood this authorization statement.
- I voluntarily consent to the processing of my data as described above.

This authorization is valid from the date of acceptance until explicitly revoked or until the retention period expires.

Last updated: December 2024`;

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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
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

        <div className="space-y-4 py-4">
          <Accordion type="multiple" className="w-full space-y-3">
            {/* Cookie Policy */}
            <AccordionItem value="cookies" className="border rounded-lg px-4">
              <div className="flex items-center gap-3 py-3">
                <Checkbox
                  id="cookies"
                  checked={cookiesAccepted}
                  onCheckedChange={(checked) => setCookiesAccepted(checked === true)}
                  disabled={isLoading}
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex-1">
                  <AccordionTrigger className="hover:no-underline py-0">
                    <Label htmlFor="cookies" className="text-base font-semibold cursor-pointer">
                      Cookie Policy
                    </Label>
                  </AccordionTrigger>
                </div>
              </div>
              <AccordionContent>
                <div className="space-y-3 pb-3">
                  <ScrollArea className="h-[200px] w-full rounded-md border bg-muted/30 p-4">
                    <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans">
                      {COOKIES_POLICY_CONTENT}
                    </pre>
                  </ScrollArea>
                  <a
                    href="/legal/cookies-policy.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs text-primary hover:underline"
                  >
                    <Download className="h-3 w-3" />
                    Download PDF
                  </a>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Candidate Authorization */}
            <AccordionItem value="authorization" className="border rounded-lg px-4">
              <div className="flex items-center gap-3 py-3">
                <Checkbox
                  id="authorization"
                  checked={authorizationAccepted}
                  onCheckedChange={(checked) => setAuthorizationAccepted(checked === true)}
                  disabled={isLoading}
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex-1">
                  <AccordionTrigger className="hover:no-underline py-0">
                    <Label htmlFor="authorization" className="text-base font-semibold cursor-pointer">
                      Candidate Data Authorization
                    </Label>
                  </AccordionTrigger>
                </div>
              </div>
              <AccordionContent>
                <div className="space-y-3 pb-3">
                  <ScrollArea className="h-[200px] w-full rounded-md border bg-muted/30 p-4">
                    <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans">
                      {AUTHORIZATION_CONTENT}
                    </pre>
                  </ScrollArea>
                  <a
                    href="/legal/candidate-authorization.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs text-primary hover:underline"
                  >
                    <Download className="h-3 w-3" />
                    Download PDF
                  </a>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Info notice */}
          <p className="text-xs text-muted-foreground text-center pt-2">
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