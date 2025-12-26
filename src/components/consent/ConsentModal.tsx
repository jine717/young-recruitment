import { useState, useEffect } from 'react';
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
import { Loader2, Shield, FileText, ArrowRight, ArrowLeft } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ConsentModalProps {
  open: boolean;
  onAccept: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  jobId?: string;
}

const COOKIES_TABLE_DATA = [
  { name: '_ga', provider: 'google-analytics.com', purpose: 'User identification for statistics', duration: '2 years', type: 'HTTP cookie' },
  { name: '_gat', provider: 'google-analytics.com', purpose: 'Request rate control', duration: 'Session', type: 'HTTP cookie' },
  { name: '_gid', provider: 'google-analytics.com', purpose: 'User identification', duration: 'Session', type: 'HTTP cookie' },
  { name: 'collect', provider: 'google-analytics.com', purpose: 'Data transmission to Google Analytics', duration: 'Session', type: 'Pixel' },
  { name: 'NID', provider: 'google.com', purpose: 'Personalized advertising', duration: '6 months', type: 'HTTP cookie' },
  { name: 'GPS', provider: 'youtube.com', purpose: 'Location tracking (mobile devices)', duration: 'Session', type: 'HTTP cookie' },
];

function CookiePolicyContent() {
  return (
    <div className="space-y-6 text-sm text-foreground pr-4">
      <div className="text-center space-y-1">
        <h2 className="text-lg font-bold">COOKIE POLICY OF YOUNG SPAIN, S.L.</h2>
        <div className="text-muted-foreground text-xs space-y-0.5">
          <p><strong>Owner:</strong> YOUNG SPAIN, S.L.</p>
          <p><strong>Tax ID (CIF):</strong> B75303271</p>
          <p><strong>Registered office:</strong> Calle Mestre Racional, 11</p>
          <p><strong>Business activity:</strong> Holding activities</p>
          <p><strong>Website:</strong> https://young-recruitment.com/</p>
          <p><strong>Contact email:</strong> info@young.com</p>
          <p><strong>Version:</strong> 2025-12-23</p>
        </div>
      </div>

      <section>
        <h3 className="font-semibold mb-2">1. Introduction</h3>
        <p className="text-muted-foreground">This Cookie Policy explains what cookies are, how we use them on the YOUNG SPAIN, S.L. website, and the options available to users to control their use. This policy has been prepared in compliance with Regulation (EU) 2016/679 (GDPR) and Law 34/2002 of 11 July on Information Society Services and Electronic Commerce (LSSI).</p>
      </section>

      <section>
        <h3 className="font-semibold mb-2">2. What is a cookie?</h3>
        <p className="text-muted-foreground">A cookie is a file that is downloaded onto your device (computer, tablet, smartphone) when you access certain websites. Cookies allow information about browsing behavior to be stored and retrieved and, in some cases, enable the user to be identified.</p>
      </section>

      <section>
        <h3 className="font-semibold mb-2">3. Purposes for which we use cookies</h3>
        <p className="text-muted-foreground mb-2">We use the information collected through cookies in order to:</p>
        <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
          <li>Ensure the proper functioning and effective display of the content on our website.</li>
          <li>Analyze website usage to improve user experience and the services offered.</li>
          <li>Send you information about products, services, or offers that may be of interest to you when you have given consent to receive commercial communications by email.</li>
          <li>Notify you of changes to the website or contracted services.</li>
        </ul>
        <p className="text-muted-foreground mt-2">Our intention is to send only useful and desired communications. You may revoke your consent to receive commercial communications at any time by using the unsubscribe link included in our emails.</p>
      </section>

      <section>
        <h3 className="font-semibold mb-2">4. Disclosure of your information</h3>
        <p className="text-muted-foreground mb-2">We will never disclose your personal data to third parties except in the following cases:</p>
        <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
          <li>To suppliers and service providers who assist us in operating the website (data processors), to the extent necessary to provide such services (hosting, analytics, payment gateways, email delivery, etc.).</li>
          <li>To companies within the same corporate group, where applicable.</li>
          <li>If the company or substantially all of its assets were sold, data could be transferred to the purchaser.</li>
          <li>Where disclosure is necessary to comply with legal obligations or to protect the rights, property, or safety of the company, customers, or others (e.g., fraud prevention).</li>
        </ul>
      </section>

      <section>
        <h3 className="font-semibold mb-2">5. Storage and transfers</h3>
        <p className="text-muted-foreground">The data you provide is stored on secure servers managed by providers with whom we have data processing agreements. Most selected providers currently process data within the European Economic Area (EEA); however, some providers (e.g., Google services, Facebook, payment platforms) may involve transfers outside the EEA. In such cases, we implement appropriate safeguards (standard contractual clauses or other measures) in accordance with the GDPR.</p>
        <p className="text-muted-foreground mt-2">We will not retain your personal data longer than necessary for the relevant purpose.</p>
      </section>

      <section>
        <h3 className="font-semibold mb-2">6. Internet data transmission and security</h3>
        <p className="text-muted-foreground">Data transmission over the internet is not completely secure. We adopt reasonable technical and organizational measures (e.g., SSL/TLS, access controls, third-party encryption of payment data) to protect your data. However, we cannot guarantee the absolute security of transmissions; any data transmission is carried out at your own risk.</p>
      </section>

      <section>
        <h3 className="font-semibold mb-2">7. Types of cookies we use</h3>
        <p className="text-muted-foreground mb-3">Our website uses the following types of cookies:</p>
        
        <div className="space-y-3 ml-2">
          <div>
            <h4 className="font-medium text-foreground">a) Technical or strictly necessary cookies</h4>
            <p className="text-muted-foreground">These allow navigation through the site and the use of essential features (e.g., shopping cart, login). Their legal basis is the legitimate interest of the data controller.</p>
          </div>
          <div>
            <h4 className="font-medium text-foreground">b) Personalization cookies</h4>
            <p className="text-muted-foreground">These allow us to remember your preferences (e.g., language) to provide a personalized experience.</p>
          </div>
          <div>
            <h4 className="font-medium text-foreground">c) Analytics / statistics cookies</h4>
            <p className="text-muted-foreground">These allow us to quantify the number of users and analyze their behavior in order to improve the website. Services such as Google Analytics are used. These cookies require prior consent.</p>
          </div>
          <div>
            <h4 className="font-medium text-foreground">d) Advertising and marketing cookies (including behavioral advertising)</h4>
            <p className="text-muted-foreground">These are used to tailor advertising to your interests, measure campaign effectiveness, and develop browsing profiles. These cookies require your consent.</p>
          </div>
        </div>
      </section>

      <section>
        <h3 className="font-semibold mb-2">8. Third-party cookies</h3>
        <p className="text-muted-foreground">Our website may use third-party cookies (e.g., Google, YouTube, Facebook, advertising networks). These entities may collect information about your browsing activity across different websites. We recommend reviewing the privacy and cookie policies of such third parties.</p>
      </section>

      <section>
        <h3 className="font-semibold mb-2">9. Indicative list of cookies (example)</h3>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">NAME</TableHead>
                <TableHead className="text-xs">PROVIDER</TableHead>
                <TableHead className="text-xs">PURPOSE</TableHead>
                <TableHead className="text-xs">DURATION</TableHead>
                <TableHead className="text-xs">TYPE</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {COOKIES_TABLE_DATA.map((cookie) => (
                <TableRow key={cookie.name}>
                  <TableCell className="text-xs font-mono">{cookie.name}</TableCell>
                  <TableCell className="text-xs">{cookie.provider}</TableCell>
                  <TableCell className="text-xs">{cookie.purpose}</TableCell>
                  <TableCell className="text-xs">{cookie.duration}</TableCell>
                  <TableCell className="text-xs">{cookie.type}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className="text-xs text-muted-foreground mt-2 italic">(The above list is for illustrative purposes only. The actual cookie catalog will be displayed in the cookie banner/configuration panel of the website, including full information on each cookie, provider, purpose, duration, and type.)</p>
      </section>

      <section>
        <h3 className="font-semibold mb-2">10. How to disable or delete cookies</h3>
        <p className="text-muted-foreground mb-2">You can allow, block, or delete cookies through your browser settings. Below are links to the settings for the most common browsers:</p>
        <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
          <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Chrome</a></li>
          <li><a href="https://support.microsoft.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Microsoft Internet Explorer / Edge</a></li>
          <li><a href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-que-los-sitios-we" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Mozilla Firefox</a></li>
          <li><a href="https://support.apple.com/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Safari (Apple)</a></li>
        </ul>
        <p className="text-muted-foreground mt-2">Please note that blocking or deleting certain cookies may affect the functionality of the website.</p>
      </section>

      <section>
        <h3 className="font-semibold mb-2">11. Consent management</h3>
        <p className="text-muted-foreground mb-2">When accessing the website, a cookie banner will be displayed allowing you to:</p>
        <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
          <li>Accept all cookies.</li>
          <li>Reject non-essential cookies.</li>
          <li>Configure cookies by category (technical, analytics, marketing).</li>
        </ul>
        <p className="text-muted-foreground mt-2">Registered consent may be revoked at any time via the same panel or by contacting info@young.com.</p>
      </section>

      <section>
        <h3 className="font-semibold mb-2">12. Consent retention period</h3>
        <p className="text-muted-foreground">We will retain the record of your consent for as long as necessary to demonstrate the lawfulness of processing, and in any case until you revoke or modify your settings.</p>
      </section>

      <section>
        <h3 className="font-semibold mb-2">13. Data subject rights</h3>
        <p className="text-muted-foreground">You have the right to request access, rectification, erasure, restriction of processing, data portability, and objection, as well as to withdraw consent at any time. To exercise your rights, you may contact info@young.com or write to Calle Mestre Racional, 11. If you believe your rights have not been properly addressed, you may lodge a complaint with the Spanish Data Protection Authority (www.aepd.es).</p>
      </section>

      <section>
        <h3 className="font-semibold mb-2">14. Links to other websites</h3>
        <p className="text-muted-foreground">Our website may contain links to third-party websites whose owners have their own privacy and cookie policies. We are not responsible for such external policies.</p>
      </section>

      <section>
        <h3 className="font-semibold mb-2">15. Changes to the Cookie Policy</h3>
        <p className="text-muted-foreground">We may update this Cookie Policy. The current version and publication date will always be available in the website footer.</p>
      </section>

      <section>
        <h3 className="font-semibold mb-2">16. Contact</h3>
        <p className="text-muted-foreground">If you have any questions about this policy, you may contact us at: <a href="mailto:info@young.com" className="text-primary hover:underline">info@young.com</a></p>
      </section>

      <section>
        <h3 className="font-semibold mb-2">17. Legal framework</h3>
        <p className="text-muted-foreground">This Cookie Policy is drafted in accordance with Regulation (EU) 2016/679 (GDPR) and Law 34/2002 of 11 July on Information Society Services and Electronic Commerce (Article 22.2).</p>
      </section>
    </div>
  );
}

function AuthorizationContent() {
  return (
    <div className="space-y-6 text-sm text-foreground pr-4">
      <div className="text-center">
        <h2 className="text-lg font-bold">AUTHORIZATION STATEMENT</h2>
      </div>

      <p className="text-muted-foreground">
        I, as a candidate and participant in the recruitment process communicated and initiated by the company <strong>YOUNG SPAIN, S.L.</strong>, with Tax Identification Number <strong>B75303271</strong> (hereinafter, "the Company"),
      </p>

      <p className="text-center font-semibold text-foreground">HEREBY EXPRESSLY AUTHORIZE YOUNG SPAIN, S.L.</p>

      <section>
        <h3 className="font-semibold mb-2">FIRST.- AUTHORIZATION FOR THE USE, PROCESSING, AND TRANSFER OF IMAGES AND RECORDINGS.</h3>
        <p className="text-muted-foreground mb-3">
          I expressly authorize the Company to take photographs, recordings, and/or graphic reports of the production or project that is the subject of its activity and/or similar matters related to my participation in the recruitment process, in my capacity as a Candidate for employment and potential hiring to occupy a position within the Company. This authorization is granted for the purpose of carrying out any type of capture, reproduction, or publication of my image, by means of photography, film, or any other procedure, during the recruitment process, in accordance with the provisions of Article 2.2 of Organic Law 1/1982, of May 5, on the civil protection of the right to honor, personal and family privacy, and one's own image.
        </p>
        <p className="text-muted-foreground mb-3">
          Likewise, I expressly authorize the Company to process my personal data, based on my free and explicit consent, in accordance with Article 5 and subsequent articles of Regulation (EU) 2016/679 of the European Parliament and of the Council, of April 27, 2016, on the protection of natural persons with regard to the processing of personal data and on the free movement of such data, which repeals Directive 95/46/EC (General Data Protection Regulation). This authorization includes the right to reproduce, distribute, publicly communicate, adapt, and transform such material, in any medium (including social networks, website, presentations, printed material, audiovisual campaigns, etc.), without any territorial or time limitation.
        </p>
        <p className="text-muted-foreground">
          I declare that this authorization does not imply any financial compensation and that I will not claim any present or future compensation for the authorized use.
        </p>
      </section>

      <section>
        <h3 className="font-semibold mb-2">SECOND.- DURATION.</h3>
        <p className="text-muted-foreground">
          This authorization is granted for an indefinite period, regardless of whether my application is ultimately accepted by the Company.
        </p>
      </section>

      <section>
        <h3 className="font-semibold mb-2">THIRD.- REVOCATION.</h3>
        <p className="text-muted-foreground">
          I may revoke this consent in writing only in justified cases, by submitting a formal request to the email address <a href="mailto:info@young.com" className="text-primary hover:underline">info@young.com</a>, understanding that the removal of materials already produced or disseminated prior to the date of revocation may not be required.
        </p>
      </section>

      <section>
        <h3 className="font-semibold mb-2">FOURTH.- DATA PROTECTION.</h3>
        <ul className="space-y-2 text-muted-foreground">
          <li>The data controller is <strong>YOUNG SPAIN, S.L.</strong></li>
          <li>Personal data will be processed solely for the purpose of using them exclusively for the objectives described in this document.</li>
          <li>The legal basis for processing is the consent given by the data subject or their legal representative, which may be revoked at any time.</li>
          <li>Data retention criteria: the data will be retained until consent is revoked and, once revoked, will be kept blocked for the legally established limitation periods.</li>
          <li>The recipients of the data will be the partners, employees, and service providers of the Company.</li>
          <li>
            The Candidate may exercise their rights of access, including the right to obtain a copy of the personal data being processed, as well as rectification, objection, erasure or deletion where applicable, data portability, and restriction of processing, by submitting a written request to the data controller at the following address: Valencia, C/ Mestre Racional nº 11, Valencia (46005) – contact telephone number +31 85 060 5163 and contact email <a href="mailto:info@young.com" className="text-primary hover:underline">info@young.com</a>, and has the right to lodge a complaint with the supervisory authority.
          </li>
        </ul>
      </section>
    </div>
  );
}

export default function ConsentModal({ open, onAccept, onCancel, isLoading, jobId }: ConsentModalProps) {
  const [cookiesAccepted, setCookiesAccepted] = useState(false);
  const [authorizationAccepted, setAuthorizationAccepted] = useState(false);
  const [currentStep, setCurrentStep] = useState<'authorization' | 'cookies'>('authorization');
  const [hasTrackedOpen, setHasTrackedOpen] = useState(false);

  // Lazy import to avoid circular dependencies
  const trackEvent = async (eventType: string, metadata?: Record<string, unknown>) => {
    const { trackFunnelEvent } = await import('@/hooks/useFunnelTracking');
    trackFunnelEvent(eventType as any, jobId || null, metadata);
  };

  // Track modal shown
  useEffect(() => {
    if (open && !hasTrackedOpen) {
      trackEvent('consent_modal_shown');
      setHasTrackedOpen(true);
    }
    if (!open) {
      setHasTrackedOpen(false);
    }
  }, [open, hasTrackedOpen, jobId]);

  const handleContinue = () => {
    if (authorizationAccepted) {
      trackEvent('consent_authorization_accepted');
      setCurrentStep('cookies');
    }
  };

  const handleBack = () => {
    setCurrentStep('authorization');
  };

  const handleAccept = () => {
    if (cookiesAccepted && authorizationAccepted) {
      trackEvent('consent_completed');
      onAccept();
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && !isLoading) {
      trackEvent('consent_cancelled', { step: currentStep });
      onCancel();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <DialogTitle className="font-display text-xl">Data Protection Consent</DialogTitle>
            </div>
            <span className="text-sm text-muted-foreground font-medium">
              Step {currentStep === 'authorization' ? '1' : '2'} of 2
            </span>
          </div>
          <DialogDescription>
            {currentStep === 'authorization' 
              ? 'Please review and accept the Candidate Authorization to continue.'
              : 'Please review and accept the Cookie Policy to submit your application.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 py-4">
          {currentStep === 'authorization' ? (
            <div className="h-full flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-foreground">Candidate Authorization</h3>
              </div>
              <ScrollArea className="h-[350px] border rounded-lg p-4 bg-muted/20">
                <AuthorizationContent />
              </ScrollArea>
              <div className="flex items-center gap-2 mt-4">
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
            </div>
          ) : (
            <div className="h-full flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-foreground">Cookie Policy</h3>
              </div>
              <ScrollArea className="h-[350px] border rounded-lg p-4 bg-muted/20">
                <CookiePolicyContent />
              </ScrollArea>
              <div className="flex items-center gap-2 mt-4">
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
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center pt-4">
            By accepting, you confirm that you have read and understood both documents. 
            Your consent will be recorded for compliance purposes.
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {currentStep === 'authorization' ? (
            <>
              <Button
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
                className="sm:w-auto w-full"
              >
                Cancel
              </Button>
              <Button
                onClick={handleContinue}
                disabled={!authorizationAccepted}
                className="sm:w-auto w-full"
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={isLoading}
                className="sm:w-auto w-full"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
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
                disabled={!cookiesAccepted || isLoading}
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
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
