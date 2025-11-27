import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Download, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DocumentsSectionProps {
  cvUrl: string | null;
  discUrl: string | null;
}

export function DocumentsSection({ cvUrl, discUrl }: DocumentsSectionProps) {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Documents
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">CV / Resume</p>
              <p className="text-xs text-muted-foreground">
                {cvUrl ? 'Uploaded' : 'Not uploaded'}
              </p>
            </div>
          </div>
          {cvUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownload(cvUrl, 'cvs')}
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          )}
        </div>

        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary/50 rounded">
              <FileText className="w-5 h-5 text-secondary-foreground" />
            </div>
            <div>
              <p className="font-medium">DISC Assessment</p>
              <p className="text-xs text-muted-foreground">
                {discUrl ? 'Uploaded' : 'Not uploaded'}
              </p>
            </div>
          </div>
          {discUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownload(discUrl, 'disc-assessments')}
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
