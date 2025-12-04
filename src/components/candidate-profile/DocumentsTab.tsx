import { DocumentsSection } from '@/components/candidate-profile/DocumentsSection';

interface DocumentsTabProps {
  applicationId: string;
  cvUrl: string | null;
  discUrl: string | null;
}

export function DocumentsTab({ applicationId, cvUrl, discUrl }: DocumentsTabProps) {
  return (
    <DocumentsSection
      applicationId={applicationId}
      cvUrl={cvUrl}
      discUrl={discUrl}
    />
  );
}
