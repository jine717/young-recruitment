import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RecruiterStats } from '@/hooks/useAnalytics';
import { Users } from 'lucide-react';

interface RecruiterPerformanceTableProps {
  data: RecruiterStats[];
}

export function RecruiterPerformanceTable({ data }: RecruiterPerformanceTableProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Recruiter Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No recruiter activity recorded yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Recruiter Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Recruiter</TableHead>
              <TableHead className="text-center">Interviews Scheduled</TableHead>
              <TableHead className="text-center">Decisions Made</TableHead>
              <TableHead className="text-center">Notes Added</TableHead>
              <TableHead className="text-center">Total Activity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((recruiter) => (
              <TableRow key={recruiter.recruiterId}>
                <TableCell className="font-medium">{recruiter.recruiterName}</TableCell>
                <TableCell className="text-center">{recruiter.interviewsScheduled}</TableCell>
                <TableCell className="text-center">{recruiter.decisionseMade}</TableCell>
                <TableCell className="text-center">{recruiter.notesAdded}</TableCell>
                <TableCell className="text-center font-semibold">
                  {recruiter.interviewsScheduled + recruiter.decisionseMade + recruiter.notesAdded}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
