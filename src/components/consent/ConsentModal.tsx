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
CIF: B75303271
Registered Office: Calle Mestre Racional 11, Pta. 1, 46005 Valencia
Contact Email: info@young.com
Website: https://young-recruitment.com/

1. INTRODUCTION

This document describes the cookie policy (hereinafter, the "Cookie Policy") of the website https://young-recruitment.com/ (hereinafter, the "Website"), owned by YOUNG SPAIN, S.L. (hereinafter, "YOUNG SPAIN" or "the Company"), with CIF B75303271 and registered office at Calle Mestre Racional 11, Pta. 1, 46005 Valencia.

This Cookie Policy is part of the Privacy Policy and Terms of Use of the Website. By accessing and using the Website, you agree to the use of cookies in accordance with this policy. If you do not agree with the use of cookies, you should adjust your browser settings accordingly or refrain from using the Website.

2. WHAT IS A COOKIE?

A cookie is a small text file that a website stores on your computer or mobile device when you visit the site. It allows the website to remember your actions and preferences (such as login, language, font size, and other display preferences) over a period of time, so you don't have to keep re-entering them whenever you come back to the site or browse from one page to another.

3. PURPOSES OF USING COOKIES

YOUNG SPAIN uses cookies for the following purposes:

a) Technical and Essential Purposes: To enable basic functions such as page navigation, access to secure areas, and ensuring the security of the Website.

b) Analytical and Performance Purposes: To collect statistical data on the use of the Website, such as the number of visitors, time spent on pages, and browsing behavior, in order to improve the quality and content of the Website.

c) Functional Purposes: To remember user preferences and provide enhanced, personalized features.

d) Advertising and Marketing Purposes: To deliver relevant advertisements to users and measure the effectiveness of advertising campaigns.

4. DISCLOSURE OF INFORMATION TO THIRD PARTIES

Some cookies on the Website may be set by third-party services, such as analytics tools (e.g., Google Analytics, Vercel Analytics) or social media plugins. These third parties may use cookies to collect information about your online activities across different websites and services. YOUNG SPAIN does not have control over these third-party cookies and recommends that you review the privacy policies of these third parties for more information.

5. INTERNATIONAL STORAGE AND TRANSFER OF DATA

Please note that the data collected through cookies may be stored and processed in countries outside the European Economic Area (EEA), including countries that may not provide the same level of data protection. YOUNG SPAIN ensures that appropriate safeguards, such as standard contractual clauses or other legal mechanisms, are in place to protect your data in such cases.

6. SECURITY MEASURES

YOUNG SPAIN has implemented appropriate technical and organizational measures to ensure the security of the data collected through cookies and to prevent unauthorized access, alteration, disclosure, or destruction of such data.

7. TYPES OF COOKIES USED

The Website uses the following types of cookies:

a) Session Cookies: Temporary cookies that expire when you close your browser. They are used to maintain your session and enable essential functions.

b) Persistent Cookies: Cookies that remain on your device for a specified period or until you delete them. They are used to remember your preferences and improve your experience on subsequent visits.

c) First-Party Cookies: Cookies set directly by the Website.

d) Third-Party Cookies: Cookies set by third-party services, such as analytics or advertising partners.

8. THIRD-PARTY COOKIES

The Website may use cookies from the following third-party services:

a) Google Analytics: Used to collect statistical data about website usage.

b) Vercel Analytics: Used to monitor website performance and user behavior.

c) Social Media Plugins: Cookies from social media platforms (e.g., LinkedIn, Twitter) may be used if you interact with social sharing features.

For more information about how these third parties use cookies, please refer to their respective privacy policies.

9. COOKIE LIST

The specific cookies used on the Website, along with their purposes and durations, are detailed in the cookie management panel accessible through the Website. You can review and update your cookie preferences at any time through this panel.

10. HOW TO DISABLE COOKIES

You can control and delete cookies through your browser settings. Please note that disabling certain cookies may affect the functionality of the Website. Here are links to instructions for managing cookies in common browsers:

- Google Chrome: https://support.google.com/chrome/answer/95647
- Mozilla Firefox: https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer
- Safari: https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471
- Microsoft Edge: https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09

11. CONSENT MANAGEMENT

When you first visit the Website, you will be presented with a cookie consent banner that allows you to accept or reject the use of non-essential cookies. You can change your preferences at any time through the cookie settings link available in the footer of the Website or by adjusting your browser settings.

12. RETENTION PERIOD

The retention period for cookies varies depending on their type and purpose. Session cookies are deleted when you close your browser, while persistent cookies remain on your device until they expire or you delete them. Third-party cookies are subject to the retention policies of the respective third parties.

13. YOUR RIGHTS

Under the General Data Protection Regulation (GDPR) and the Spanish Organic Law on Personal Data Protection (LOPDGDD), you have the following rights regarding your personal data:

a) Right of Access: You have the right to request access to the personal data we hold about you.

b) Right to Rectification: You have the right to request the correction of inaccurate or incomplete data.

c) Right to Erasure: You have the right to request the deletion of your personal data under certain circumstances.

d) Right to Restriction: You have the right to request the restriction of processing of your personal data under certain circumstances.

e) Right to Data Portability: You have the right to receive your personal data in a structured, commonly used, and machine-readable format and to transmit it to another controller.

f) Right to Object: You have the right to object to the processing of your personal data under certain circumstances.

g) Right to Withdraw Consent: Where processing is based on your consent, you have the right to withdraw your consent at any time.

To exercise any of these rights, please contact us at: info@young.com.

14. LINKS TO OTHER WEBSITES

The Website may contain links to other websites that are not operated by YOUNG SPAIN. This Cookie Policy does not apply to those websites, and we recommend that you review the cookie policies of any third-party websites you visit.

15. CHANGES TO THIS POLICY

YOUNG SPAIN reserves the right to modify or update this Cookie Policy at any time. Any changes will be posted on the Website, and the date of the last update will be indicated at the top of this document. We encourage you to review this policy periodically to stay informed about how we use cookies.

16. CONTACT

If you have any questions or concerns about this Cookie Policy or the use of cookies on the Website, please contact us at:

YOUNG SPAIN, S.L.
Calle Mestre Racional 11, Pta. 1, 46005 Valencia
Email: info@young.com
Website: https://young-recruitment.com/

17. LEGAL FRAMEWORK

This Cookie Policy is governed by the following regulations:

- Regulation (EU) 2016/679 of the European Parliament and of the Council of 27 April 2016 (General Data Protection Regulation - GDPR).
- Organic Law 3/2018, of December 5, on Personal Data Protection and Guarantee of Digital Rights (LOPDGDD).
- Law 34/2002, of July 11, on Information Society Services and Electronic Commerce (LSSI-CE).

Last Updated: December 2024`;

const AUTHORIZATION_CONTENT = `AUTHORIZATION STATEMENT

I, as a candidate and participant in the selection processes of YOUNG SPAIN, S.L. (hereinafter, "YOUNG SPAIN"), understand that during the selection process I may be filmed, photographed or recorded in the context of interviews, group dynamics, individual assessments, or other evaluation activities conducted in person or through virtual platforms. Therefore, I make the following declarations:

FIRST

I authorize YOUNG SPAIN, its affiliated companies, collaborating entities, and/or companies belonging to the group, to use, process, and transfer my images, voice recordings, and any audiovisual content in which I appear (hereinafter, "the Audiovisual Material") for the following purposes:

a) Internal use related to the selection, recruitment, and talent management processes, including but not limited to performance evaluations, internal training, and documentation of selection procedures.

b) External use in marketing, advertising, employer branding campaigns, communication materials, social media, corporate presentations, and any other promotional activity aimed at enhancing the company's reputation and attracting future talent.

c) Other commercial purposes.

SECOND

This authorization is granted for an indefinite period, unless expressly revoked by the interested party, and covers any medium, format, or platform, whether current or future, without territorial restrictions.

THIRD

I acknowledge my right to revoke this authorization at any time by written notice to the address info@young.com. However, such revocation shall not affect the lawfulness of the uses made prior to the revocation.

FOURTH

Pursuant to Regulation (EU) 2016/679 (General Data Protection Regulation) and Organic Law 3/2018 on Personal Data Protection and Guarantee of Digital Rights, I am informed of my right to access, rectify, delete, limit, oppose, and port my data. To exercise these rights, I may contact YOUNG SPAIN at the email address: info@young.com, or at the postal address: Calle Mestre Racional 11, Pta. 1, 46005 Valencia.

By accepting this declaration, I confirm that I have read and understood the above conditions and that I voluntarily consent to the processing of my personal data and images as described.

Date of Last Update: December 2024`;

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
                    download="YOUNG_SPAIN_Cookie_Policy.pdf"
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
                    download="YOUNG_SPAIN_Candidate_Authorization.pdf"
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