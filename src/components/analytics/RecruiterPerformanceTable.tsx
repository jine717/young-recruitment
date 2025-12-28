import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Users } from 'lucide-react';

export interface RecruiterStats {
  recruiterId: string;
  recruiterName: string;
  interviewsScheduled: number;
  decisionsMade: number;
  notesAdded: number;
}

interface RecruiterPerformanceTableProps {
  data: RecruiterStats[];
}

/**
 * Render a card showing recruiter performance metrics in a table or an empty-state message when no data is provided.
 *
 * @param data - Array of recruiter metrics where each item contains:
 *   - `recruiterId`: unique identifier for the recruiter
 *   - `recruiterName`: display name of the recruiter
 *   - `interviewsScheduled`: number of interviews scheduled by the recruiter
 *   - `decisionsMade`: number of hiring decisions recorded by the recruiter
 *   - `notesAdded`: number of notes added by the recruiter
 * @returns A React element that displays a table of recruiter metrics (including a computed total per recruiter) or a centered message when `data` is empty.
 */
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
            No recruiter activity recorded
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
                <TableCell className="text-center">{recruiter.decisionsMade}</TableCell>
                <TableCell className="text-center">{recruiter.notesAdded}</TableCell>
                <TableCell className="text-center font-semibold">
                  {recruiter.interviewsScheduled + recruiter.decisionsMade + recruiter.notesAdded}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}