import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Download, Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useDocumentAnalyses, useTriggerDocumentAnalysis } from '@/hooks/useDocumentAnalysis';
import { DocumentAnalysisCard } from './DocumentAnalysisCard';
import { useToast } from '@/hooks/use-toast';

interface DocumentsSectionProps {
  applicationId: string;
  cvUrl: string | null;
  discUrl: string | null;
}

export function DocumentsSection({ applicationId, cvUrl, discUrl }: DocumentsSectionProps) {
  const { toast } = useToast();
  const { data: analyses } = useDocumentAnalyses(applicationId);
  const triggerAnalysis = useTriggerDocumentAnalysis();
  
  const [analyzingCv, setAnalyzingCv] = useState(false);
  const [analyzingDisc, setAnalyzingDisc] = useState(false);

  const cvAnalysis = analyses?.find(a => a.document_type === 'cv');
  const discAnalysis = analyses?.find(a => a.document_type === 'disc');

  const getSignedUrl = async (bucketName: string, path: string) => {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(path, 3600);

    if (error) {
      console.error('Error getting signed URL:', error);
      return null;
    }
    return data.signedUrl;
  };

  const handleDownload = async (url: string | null, bucketName: string) => {
    if (!url) return;

    const signedUrl = await getSignedUrl(bucketName, url);
    if (signedUrl) {
      window.open(signedUrl, '_blank');
    }
  };

  const handleAnalyze = async (documentType: 'cv' | 'disc', documentPath: string | null) => {
    if (!documentPath) return;

    const setLoading = documentType === 'cv' ? setAnalyzingCv : setAnalyzingDisc;
    setLoading(true);

    try {
      await triggerAnalysis.mutateAsync({
        applicationId,
        documentType,
        documentPath,
      });
      toast({
        title: 'Analysis Complete',
        description: `${documentType === 'cv' ? 'CV' : 'DISC'} analysis has been completed.`,
      });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: 'Analysis Failed',
        description: 'Failed to analyze document. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Documents
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* CV Section */}
        <div className="p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded">
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">CV / Resume</p>
                <p className="text-xs text-muted-foreground">
                  {cvUrl ? 'Uploaded' : 'Not uploaded'}
                </p>
              </div>
            </div>
            {cvUrl && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAnalyze('cv', cvUrl)}
                  disabled={analyzingCv}
                >
                  {analyzingCv ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  {cvAnalysis?.status === 'completed' ? 'Re-analyze' : 'Analyze'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(cvUrl, 'cvs')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            )}
          </div>
          {cvAnalysis && cvAnalysis.status === 'completed' && <DocumentAnalysisCard analysis={cvAnalysis} />}
        </div>

        {/* DISC Section */}
        <div className="p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary/50 rounded">
                <FileText className="w-4 h-4 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">DISC Assessment</p>
                <p className="text-xs text-muted-foreground">
                  {discUrl ? 'Uploaded' : 'Not uploaded'}
                </p>
              </div>
            </div>
            {discUrl && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAnalyze('disc', discUrl)}
                  disabled={analyzingDisc}
                >
                  {analyzingDisc ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  {discAnalysis?.status === 'completed' ? 'Re-analyze' : 'Analyze'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(discUrl, 'disc-assessments')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            )}
          </div>
          {discAnalysis && discAnalysis.status === 'completed' && <DocumentAnalysisCard analysis={discAnalysis} />}
        </div>
      </CardContent>
    </Card>
  );
}
