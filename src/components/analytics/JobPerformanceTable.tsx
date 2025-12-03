import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { JobPerformance } from '@/hooks/useRecruiterAnalytics';

interface JobPerformanceTableProps {
  data: JobPerformance[];
}

export function JobPerformanceTable({ data }: JobPerformanceTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance by Job Vacancy</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No job data available</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Title</TableHead>
                  <TableHead className="text-center">Applications</TableHead>
                  <TableHead className="text-center">Avg AI Score</TableHead>
                  <TableHead className="text-center">In Interview</TableHead>
                  <TableHead className="text-center">Hired</TableHead>
                  <TableHead className="text-center">Conversion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((job) => (
                  <TableRow key={job.jobId}>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {job.jobTitle}
                    </TableCell>
                    <TableCell className="text-center">{job.applications}</TableCell>
                    <TableCell className="text-center">
                      {job.avgAIScore !== null ? (
                        <Badge 
                          variant={job.avgAIScore >= 70 ? "default" : job.avgAIScore >= 40 ? "secondary" : "destructive"}
                        >
                          {job.avgAIScore}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">{job.inInterview}</TableCell>
                    <TableCell className="text-center">{job.hired}</TableCell>
                    <TableCell className="text-center">
                      <span className={job.conversionRate >= 10 ? "text-green-600" : "text-muted-foreground"}>
                        {job.conversionRate}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
