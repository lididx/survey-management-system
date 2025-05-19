
import { Fragment } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import { StatusChange, StatusType } from "@/types/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatusLogViewProps {
  statusLog: StatusChange[];
}

// Status color mapping
const statusColorMap: Record<StatusType, { bg: string, text: string, border?: string }> = {
  "התקבל": { bg: "#cce5ff", text: "#004085", border: "#b8daff" },
  "נשלח מייל תיאום למנהל מערכת": { bg: "#fff3cd", text: "#856404", border: "#ffeeba" },
  "נקבע": { bg: "#d4edda", text: "#155724", border: "#c3e6cb" },
  "בכתיבה": { bg: "#ffeeba", text: "#856404", border: "#ffeeba" },
  "שאלות השלמה מול מנהל מערכת": { bg: "#f8d7da", text: "#721c24", border: "#f5c6cb" },
  "בבקרה": { bg: "#e2d6f3", text: "#5a2f93", border: "#d5c8ed" },
  "הסתיים": { bg: "#c3e6cb", text: "#155724", border: "#b1dfbb" }
};

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
    
    const colors = statusColorMap[status as StatusType] || { bg: "#e9ecef", text: "#495057", border: "#dee2e6" };
    
    return (
      <span 
        style={{
          backgroundColor: colors.bg,
          color: colors.text,
          border: `1px solid ${colors.border || colors.bg}`,
          padding: '0.25rem 0.5rem',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          fontWeight: 500,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {status}
      </span>
    );
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
              <TableHead className="text-center">תאריך</TableHead>
              <TableHead className="text-center">שינוי סטטוס</TableHead>
              <TableHead className="text-center">שינוי תאריך</TableHead>
              <TableHead className="text-center">סיבה</TableHead>
              <TableHead className="text-center">בוצע ע"י</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedLog.map((change) => (
              <TableRow key={change.id} className="border-b border-gray-200">
                <TableCell className="whitespace-nowrap text-xs text-gray-500 text-center">
                  {formatDate(change.timestamp)}{" "}
                  {formatTime(change.timestamp)}
                </TableCell>
                <TableCell className="text-center">
                  {change.oldStatus || change.newStatus ? (
                    <div className="flex items-center justify-center gap-2 text-sm">
                      {change.oldStatus ? 
                        getStatusBadge(change.oldStatus) : 
                        <span className="text-gray-400">-</span>
                      }
                      <span className="mx-2">➞</span>
                      {getStatusBadge(change.newStatus)}
                    </div>
                  ) : null}
                </TableCell>
                <TableCell className="text-center">
                  {(change.oldDate || change.newDate) && (
                    <div className="text-sm">
                      <span className="text-gray-600">{formatDate(change.oldDate)}</span>
                      <span className="mx-2">➞</span>
                      <span className="font-medium">{formatDate(change.newDate)}</span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-sm text-gray-700 text-center">{change.reason}</TableCell>
                <TableCell className="text-sm text-center">{change.modifiedBy || "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
