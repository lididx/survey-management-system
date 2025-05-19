
import { Fragment } from "react";
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
import { Badge } from "@/components/ui/badge";

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

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("he-IL", {hour: '2-digit', minute:'2-digit'});
  };
  
  const getStatusBadge = (status: string | null) => {
    if (!status) return null;
    
    let variant = "outline";
    switch (status) {
      case "התקבל":
        variant = "secondary";
        break;
      case "בכתיבה":
      case "נקבע":
        variant = "default";
        break;
      case "בבקרה":
        variant = "destructive";
        break;
      case "הסתיים":
        variant = "secondary";
        break;
      case "שאלות השלמה מול מנהל מערכת":
        variant = "warning";
        break;
      case "נשלח מייל תיאום למנהל מערכת":
        variant = "outline";
        break;
      default:
        variant = "outline";
    }
    
    return <Badge variant={variant as any}>{status}</Badge>;
  };

  return (
    <Card className="border border-gray-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">היסטוריית שינויים</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="text-gray-600">
              <TableHead>תאריך</TableHead>
              <TableHead>שינוי סטטוס</TableHead>
              <TableHead>שינוי תאריך</TableHead>
              <TableHead>סיבה</TableHead>
              <TableHead>בוצע ע"י</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedLog.map((change) => (
              <TableRow key={change.id} className="border-b border-gray-200">
                <TableCell className="whitespace-nowrap text-xs text-gray-500">
                  {formatDate(change.timestamp)}{" "}
                  {formatTime(change.timestamp)}
                </TableCell>
                <TableCell>
                  {change.oldStatus || change.newStatus ? (
                    <div className="flex items-center gap-2 text-sm">
                      {change.oldStatus ? 
                        getStatusBadge(change.oldStatus) : 
                        <span className="text-gray-400">-</span>
                      }
                      <span className="mx-2">➞</span>
                      {getStatusBadge(change.newStatus)}
                    </div>
                  ) : null}
                </TableCell>
                <TableCell>
                  {(change.oldDate || change.newDate) && (
                    <div className="text-sm">
                      <span className="text-gray-600">{formatDate(change.oldDate)}</span>
                      <span className="mx-2">➞</span>
                      <span className="font-medium">{formatDate(change.newDate)}</span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-sm text-gray-700">{change.reason}</TableCell>
                <TableCell className="text-sm">{change.modifiedBy || "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
