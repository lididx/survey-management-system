
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import { StatusChange } from "@/types/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatusLogViewProps {
  statusLog: StatusChange[];
}

export const StatusLogView = ({ statusLog }: StatusLogViewProps) => {
  if (!statusLog || statusLog.length === 0) {
    return <div className="text-center py-4 text-gray-500">אין שינויים בלוג</div>;
  }

  // Sort log entries by timestamp, newest first
  const sortedLog = [...statusLog].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const formatDate = (date: Date | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("he-IL");
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">היסטוריית שינויים</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>תאריך</TableHead>
              <TableHead>שינוי סטטוס</TableHead>
              <TableHead>שינוי תאריך</TableHead>
              <TableHead>סיבה</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedLog.map((change) => (
              <TableRow key={change.id}>
                <TableCell className="whitespace-nowrap">
                  {new Date(change.timestamp).toLocaleDateString("he-IL")}
                  {" "}
                  {new Date(change.timestamp).toLocaleTimeString("he-IL", {hour: '2-digit', minute:'2-digit'})}
                </TableCell>
                <TableCell>
                  {change.oldStatus && change.newStatus && (
                    <>
                      <span className="text-gray-600">{change.oldStatus}</span>
                      <span className="mx-2">➞</span>
                      <span className="font-medium">{change.newStatus}</span>
                    </>
                  )}
                </TableCell>
                <TableCell>
                  {(change.oldDate || change.newDate) && (
                    <>
                      <span className="text-gray-600">{formatDate(change.oldDate)}</span>
                      <span className="mx-2">➞</span>
                      <span className="font-medium">{formatDate(change.newDate)}</span>
                    </>
                  )}
                </TableCell>
                <TableCell>{change.reason}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
