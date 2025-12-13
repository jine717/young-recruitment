import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { FileText, Download, Sparkles, Loader2, ChevronDown } from 'lucide-react';
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
  
  const [isOpen, setIsOpen] = useState(false);
  const [analyzingCv, setAnalyzingCv] = useState(false);
  const [analyzingDisc, setAnalyzingDisc] = useState(false);

  const cvAnalysis = analyses?.find(a => a.document_type === 'cv');
  const discAnalysis = analyses?.find(a => a.document_type === 'disc');

  const documentCount = [cvUrl, discUrl].filter(Boolean).length;

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
    <Card className="shadow-young-sm hover-lift transition-all duration-200">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <FileText className="w-4 h-4 text-[hsl(var(--young-blue))]" />
                Documents
                {documentCount > 0 && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {documentCount}
                  </span>
                )}
              </CardTitle>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-4 pt-0">
            {/* CV Section */}
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[hsl(var(--young-blue))]/10 rounded">
                    <FileText className="w-4 h-4 text-[hsl(var(--young-blue))]" />
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
                      size="sm"
                      onClick={() => handleAnalyze('cv', cvUrl)}
                      disabled={analyzingCv}
                      className="bg-[hsl(var(--young-blue))] hover:bg-[hsl(var(--young-blue))]/90 text-white"
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
                  <div className="p-2 bg-[hsl(var(--young-gold))]/10 rounded">
                    <FileText className="w-4 h-4 text-[hsl(var(--young-gold))]" />
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
                      size="sm"
                      onClick={() => handleAnalyze('disc', discUrl)}
                      disabled={analyzingDisc}
                      className="bg-[hsl(var(--young-blue))] hover:bg-[hsl(var(--young-blue))]/90 text-white"
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
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}